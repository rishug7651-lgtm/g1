import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { motion as Motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useState } from "react";
import ResponsiveImage from "./ResponsiveImage";
import { getMediaPathFromLegacySrc } from "../utils/media";

export default function ProductCard({
  product,
  imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  imageWidths = [240, 320, 480, 640],
}) {
  const { addToCart } = useCart();
  const [hover, setHover] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const mainImagePublicId =
    product?.image || getMediaPathFromLegacySrc(product?.imagePublicId);
  const backImagePublicId =
    product?.hoverImage || getMediaPathFromLegacySrc(product?.hoverImagePublicId);
  const hasBackImage = Boolean(
    (product?.hoverImage && product.hoverImage !== product.image) ||
      (backImagePublicId && backImagePublicId !== mainImagePublicId)
  );
  const images = [
    {
      label: "Front",
      publicId: mainImagePublicId,
      src: product?.image,
    },
    ...(hasBackImage
      ? [
          {
            label: "Back",
            publicId: backImagePublicId,
            src: product?.hoverImage,
          },
        ]
      : []),
  ];
  const visibleImageIndex = hasBackImage && hover ? 1 : activeImageIndex;
  const visibleImage = images[visibleImageIndex] || images[0];
  const discount =
    product?.mrp &&
    Math.round(((product.mrp - product.price) / product.mrp) * 100);

  if (!product) return null;

  const changeMobileImage = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasBackImage) return;

    setHover(false);
    setActiveImageIndex(
      (current) => (current + direction + images.length) % images.length
    );
  };

  const handlePointerEnter = (event) => {
    if (event.pointerType === "mouse") {
      setHover(true);
    }
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType === "mouse") {
      setHover(false);
    }
  };

  return (
    <Motion.div
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      whileHover={{ y: -12 }}
      transition={{ duration: 0.4 }}
      className="relative group"
    >
      <div
        className="
          absolute inset-0 rounded-[30px]
          bg-[radial-gradient(circle_at_1px_1px,#e5e5e5_1px,transparent_0)]
          [background-size:22px_22px]
          opacity-40
        "
      />

      <Motion.div
        className="
          relative h-[380px]
          overflow-hidden
          backdrop-blur-lg
          bg-white/70
          shadow-xl
        "
        animate={{
          borderRadius: hover
            ? "60% 40% 55% 45% / 45% 60% 40% 55%"
            : "28px",
        }}
        transition={{ duration: 0.6 }}
      >
        <Link
          to={`/product/${product._id}`}
          aria-label={`View ${product.name}`}
          className="block h-full"
        >
          {discount && (
            <div
              className="
                absolute top-4 left-4
                bg-pink-500 text-white
                text-xs font-semibold
                px-3 py-1 rounded-full
                z-20 shadow-md
              "
            >
              {discount}% OFF
            </div>
          )}

          <Motion.div
            key={visibleImage.publicId || visibleImage.src}
            className="w-full h-full object-cover"
            animate={{ scale: hover ? 1.1 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <ResponsiveImage
              publicId={visibleImage.publicId}
              src={visibleImage.src}
              alt={`${product.name} ${visibleImage.label.toLowerCase()} view`}
              loading="lazy"
              className="w-full h-full object-cover"
              sizes={imageSizes}
              widths={imageWidths}
            />
          </Motion.div>
        </Link>

        {hasBackImage && (
          <div className="absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 items-center justify-between sm:hidden">
            <button
              type="button"
              aria-label={`Show previous image for ${product.name}`}
              onClick={(event) => changeMobileImage(event, -1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow-md"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              aria-label={`Show next image for ${product.name}`}
              onClick={(event) => changeMobileImage(event, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow-md"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {hasBackImage && (
          <div className="absolute right-3 top-3 z-30 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-pink-600 shadow-md sm:hidden">
            {visibleImage.label}
          </div>
        )}

        <Motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
          animate={{ opacity: hover ? 1 : 0 }}
        />

        <div
          className="
            absolute bottom-5 left-1/2 z-30 -translate-x-1/2
            opacity-100 sm:opacity-0
            translate-y-0 sm:translate-y-5
            transition duration-300
            sm:group-hover:translate-y-0 sm:group-hover:opacity-100
          "
        >
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addToCart(product);
            }}
            className="
              flex items-center gap-2
              bg-white text-black
              px-6 py-2
              rounded-full
              shadow-lg
              hover:bg-black hover:text-white
              transition
            "
          >
            <ShoppingBag size={18} />
            Add To Cart
          </button>
        </div>
      </Motion.div>

      <Motion.div className="mt-5 text-center" animate={{ y: hover ? -4 : 0 }}>
        <h3 className="font-semibold text-lg">{product.name}</h3>

        <p className="text-gray-500 text-sm">Premium Collection</p>

        <div className="flex flex-col items-center mt-3">
          <span className="text-pink-600 font-bold text-xl">
            Rs. {product.price}
          </span>

          {product.mrp && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 line-through text-sm">
                Rs. {product.mrp}
              </span>

              <span className="text-green-600 text-xs font-semibold">
                {discount}% OFF
              </span>
            </div>
          )}
        </div>
      </Motion.div>
    </Motion.div>
  );
}
