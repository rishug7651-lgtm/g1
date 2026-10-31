import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useCart } from "../context/CartContext";
import ResponsiveImage from "../components/ResponsiveImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMediaPathFromLegacySrc, siteMediaPaths } from "../utils/media";

const LOCAL_BACKEND_URL = "http://localhost:5000";
const PRODUCTION_BACKEND_URL = "https://g1-x5ol.onrender.com";

const shareBaseURL = (
  import.meta.env.VITE_PUBLIC_BACKEND_URL ||
  (import.meta.env.DEV ? LOCAL_BACKEND_URL : PRODUCTION_BACKEND_URL)
).replace(/\/$/, "");

export default function ProductDetails() {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    let alive = true;

    const loadProduct = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        if (alive) {
          setProduct(res.data);
          setSelectedImageIndex(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    addToCart({
      ...product,
      size: "default",
    });

    setToast({
      show: true,
      message: "Added to Cart",
      type: "success",
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      navigate("/cart");
    }, 1500);
  };

  const handleShare = async () => {
    const shareURL = `${shareBaseURL}/product/${id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Clickkdesi!`,
          url: shareURL,
        });
      } else {
        await navigator.clipboard.writeText(shareURL);

        setToast({
          show: true,
          message: "Link copied",
          type: "success",
        });

        setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mainImagePublicId =
    product.image || getMediaPathFromLegacySrc(product.imagePublicId);
  const backImagePublicId =
    product.hoverImage || getMediaPathFromLegacySrc(product.hoverImagePublicId);
  const hasBackImage = Boolean(
    (product.hoverImage && product.hoverImage !== product.image) ||
      (backImagePublicId && backImagePublicId !== mainImagePublicId)
  );
  const productImages = [
    {
      label: "Front",
      publicId: mainImagePublicId,
      src: product.image,
      alt: `${product.name || "Product"} front view`,
    },
    ...(hasBackImage
      ? [
          {
            label: "Back",
            publicId: backImagePublicId,
            src: product.hoverImage,
            alt: `${product.name || "Product"} back view`,
          },
        ]
      : []),
  ];
  const selectedImage =
    productImages[Math.min(selectedImageIndex, productImages.length - 1)] ||
    productImages[0];

  const changeSelectedImage = (direction) => {
    if (productImages.length < 2) return;
    setSelectedImageIndex(
      (current) => (current + direction + productImages.length) % productImages.length
    );
  };

  if (loading) return <p className="px-4 py-8 sm:p-10">Loading...</p>;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-10">
      {toast.show && (
        <div className="fixed left-4 right-4 top-5 z-50 animate-slideIn sm:left-auto sm:right-5">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="min-w-0">
        <div className="relative overflow-hidden rounded-xl shadow-lg">
          <ResponsiveImage
            publicId={selectedImage.publicId}
            src={selectedImage.src}
            alt={selectedImage.alt || product.imageAlt || product.name}
            loading="eager"
            sizes="(max-width: 768px) 100vw, 50vw"
            widths={[360, 480, 640, 800]}
            className="aspect-[3/4] w-full object-cover sm:max-h-[78vh]"
          />

          {productImages.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between sm:hidden">
              <button
                type="button"
                aria-label="Show previous product image"
                onClick={() => changeSelectedImage(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow-md"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                aria-label="Show next product image"
                onClick={() => changeSelectedImage(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow-md"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {productImages.length > 1 && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-pink-600 shadow-md sm:hidden">
              {selectedImage.label}
            </div>
          )}
        </div>

        {productImages.length > 1 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {productImages.map((image, index) => (
              <button
                key={image.label}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`overflow-hidden rounded-lg border-2 text-left transition ${
                  selectedImageIndex === index
                    ? "border-pink-600"
                    : "border-transparent"
                }`}
              >
                <ResponsiveImage
                  publicId={image.publicId}
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 160px"
                  widths={[160, 240, 320]}
                  className="aspect-[3/4] w-full object-cover"
                />
                <span className="block bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700">
                  {image.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>

        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
          {product.description}
        </p>

        <h2 className="text-2xl text-pink-600 mt-4">Rs. {product.price}</h2>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <button
            onClick={handleAddToCart}
            className="w-full rounded-full bg-pink-600 px-8 py-3 text-white transition hover:bg-black sm:w-auto"
          >
            Add To Cart
          </button>

          <button
            onClick={handleShare}
            className="w-full rounded-full border-2 border-pink-600 px-8 py-3 text-pink-600 transition hover:bg-pink-600 hover:text-white sm:w-auto"
          >
            Share
          </button>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-3">Size Chart</h3>
          <ResponsiveImage
            publicId={siteMediaPaths.sizeChart}
            alt="Size Chart"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
            widths={[320, 480, 640]}
            className="w-full max-w-xl rounded-lg border shadow-md transition hover:scale-[1.02] sm:cursor-zoom-in"
          />
        </div>
      </div>
    </div>
  );
}
