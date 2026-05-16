import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    const loadProduct = async () => {
      const res = await API.get(`/products/${id}`);
      setProduct(res.data);
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  /* ================= ADD FLOW ================= */
  const handleAddToCart = () => {

    // ✅ FORCE consistent default size
    addToCart({
      ...product,
      size: "default"
    });

    setToast({
      show: true,
      message: "✅ Added to Cart",
      type: "success"
    });

    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
      navigate("/cart");
    }, 1500);
  };

  /* ================= SHARE FLOW ================= */
  const handleShare = async () => {
    const shareURL = `https://e-commerce-t99l.onrender.com/product/${id}`;

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
        message: "🔗 Link Copied!",
        type: "success"
      });

      setTimeout(() =>
        setToast(prev => ({ ...prev, show: false })),
        2000
      );
    }
  };

  if (loading) return <p className="p-10">Loading...</p>;

  return (
    <div className="p-10 grid md:grid-cols-2 gap-10">

      {/* ✅ TOAST */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-slideIn">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium
            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* ================= PRODUCT IMAGE ================= */}
      <img
        src={product.image}
        alt={product.name}
        className="rounded-xl shadow-lg w-full"
      />

      {/* ================= DETAILS ================= */}
      <div>

        <h1 className="text-3xl font-bold">
          {product.name}
        </h1>

        <p className="mt-4 text-gray-600 whitespace-pre-line">
          {product.description}
        </p>

        <h2 className="text-2xl text-pink-600 mt-4">
          ₹{product.price}
        </h2>

        {/* ================= BUTTONS ================= */}
        <div className="flex gap-4 mt-6">

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
            🔗 Share
          </button>

        </div>

        {/* ================= SIZE CHART ================= */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-3">Size Chart</h3>
          <img
            src="/photos/sc.jpg"
            alt="Size Chart"
            className="rounded-lg shadow-md border cursor-zoom-in hover:scale-105 transition"
            onClick={() => window.open("/photos/sc.jpg", "_blank")}
          />
        </div>

      </div>

    </div>
  );
}