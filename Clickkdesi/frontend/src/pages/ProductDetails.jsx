import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useCart } from "../context/CartContext";

const shareBaseURL = (
  import.meta.env.VITE_PUBLIC_BACKEND_URL || "https://g1-x5ol.onrender.com"
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

  useEffect(() => {
    let alive = true;

    const loadProduct = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        if (alive) setProduct(res.data);
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

  if (loading) return <p className="p-10">Loading...</p>;

  return (
    <div className="p-10 grid md:grid-cols-2 gap-10">
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-slideIn">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <img
        src={product.image || "/photos/logo.jpg"}
        alt={product.name}
        loading="eager"
        decoding="async"
        className="rounded-xl shadow-lg w-full"
      />

      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>

        <p className="mt-4 text-gray-600 whitespace-pre-line">
          {product.description}
        </p>

        <h2 className="text-2xl text-pink-600 mt-4">Rs. {product.price}</h2>

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={handleAddToCart}
            className="bg-pink-600 text-white px-8 py-3 rounded-full hover:bg-black transition"
          >
            Add To Cart
          </button>

          <button
            onClick={handleShare}
            className="border-2 border-pink-600 text-pink-600 px-8 py-3 rounded-full hover:bg-pink-600 hover:text-white transition"
          >
            Share
          </button>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-3">Size Chart</h3>
          <img
            src="/photos/sc.jpg"
            alt="Size Chart"
            loading="lazy"
            decoding="async"
            className="rounded-lg shadow-md border cursor-zoom-in hover:scale-105 transition"
            onClick={() => window.open("/photos/sc.jpg", "_blank")}
          />
        </div>
      </div>
    </div>
  );
}
