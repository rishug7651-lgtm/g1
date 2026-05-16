import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function ProductCard({ product }) {

  const { addToCart } = useCart();
  const [hover, setHover] = useState(false);

  if (!product) return null;

  /* ========= AUTO IMAGE px → px+1 ========= */
  const match = product.image.match(/p(\d+)/);

  let hoverImage = product.image;

  if (match) {
    const num = parseInt(match[1]);
    hoverImage = product.image.replace(`p${num}`, `p${num + 1}`);
  }

  /* ========= DISCOUNT ========= */
  const discount =
    product.mrp &&
    Math.round(
      ((product.mrp - product.price) /
        product.mrp) * 100
    );

  return (
    <motion.div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -12 }}
      transition={{ duration: 0.4 }}
      className="relative group"
    >

      {/* BACKGROUND PATTERN */}
      <div className="
        absolute inset-0 rounded-[30px]
        bg-[radial-gradient(circle_at_1px_1px,#e5e5e5_1px,transparent_0)]
        [background-size:22px_22px]
        opacity-40
      "/>

      <Link to={`/product/${product._id}`}>

        {/* IMAGE FRAME */}
        <motion.div
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
              : "28px"
          }}
          transition={{ duration: 0.6 }}
        >

          {/* DISCOUNT BADGE */}
          {discount && (
            <div className="
              absolute top-4 left-4
              bg-pink-500 text-white
              text-xs font-semibold
              px-3 py-1 rounded-full
              z-20 shadow-md
            ">
              {discount}% OFF
            </div>
          )}

          {/* IMAGE */}
          <motion.img
            key={hover ? hoverImage : product.image}
            src={hover ? hoverImage : product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{ scale: hover ? 1.1 : 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* OVERLAY */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
            animate={{ opacity: hover ? 1 : 0 }}
          />

          {/* ADD TO CART */}
          <motion.div
            className="absolute bottom-5 left-1/2 -translate-x-1/2"
            animate={{
              opacity: hover ? 1 : 0,
              y: hover ? 0 : 25
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
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
              <ShoppingBag size={18}/>
              Add To Cart
            </button>
          </motion.div>

        </motion.div>

      </Link>

      {/* ================= PRODUCT INFO ================= */}
      <motion.div
        className="mt-5 text-center"
        animate={{ y: hover ? -4 : 0 }}
      >

        <h3 className="font-semibold text-lg">
          {product.name}
        </h3>

        <p className="text-gray-500 text-sm">
          Premium Collection
        </p>

        {/* ✅ FINAL PRICE SECTION */}
        <div className="flex flex-col items-center mt-3">

          {/* SELLING PRICE */}
          <span className="
            text-pink-600
            font-bold
            text-xl
          ">
            ₹{product.price}
          </span>

          {/* MRP + DISCOUNT */}
          {product.mrp && (
            <div className="flex items-center gap-2 mt-1">

              <span className="
                text-gray-400
                line-through
                text-sm
              ">
                ₹{product.mrp}
              </span>

              <span className="
                text-green-600
                text-xs
                font-semibold
              ">
                {discount}% OFF
              </span>

            </div>
          )}

        </div>

      </motion.div>

    </motion.div>
  );
}