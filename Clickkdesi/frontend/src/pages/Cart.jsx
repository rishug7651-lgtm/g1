import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import ResponsiveImage from "../components/ResponsiveImage";
import { getPublicIdFromLegacySrc } from "../utils/cloudinary";

export default function Cart() {

  const {
    cart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    updateSize
  } = useCart();

  if (cart.length === 0)
    return (
      <h2 className="p-10 text-xl">
        Cart is Empty 🛒
      </h2>
    );

  const total = cart.reduce(
    (acc, item) =>
      acc + item.price * item.quantity,
    0
  );

  return (

    <div className="p-10 max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-8">
        My Cart
      </h1>

      {cart.map((item, index) => (

        <div
          key={`${item._id}-${item.size || index}`} // ✅ FIXED UNIQUE KEY
          className="flex justify-between items-center border-b py-6"
        >

          {/* PRODUCT */}
          <div className="flex gap-4 items-center">

            <ResponsiveImage
              publicId={item.imagePublicId || getPublicIdFromLegacySrc(item.image)}
              src={item.image}
              alt={item.name}
              width="90"
              sizes="90px"
              widths={[90, 120]}
              className="rounded-lg w-[90px] h-[120px] object-cover"
            />

            <div>

              <h3 className="font-semibold">
                {item.name}
              </h3>

              <p>₹{item.price}</p>

              {/* ✅ SIZE SELECTOR (FIXED) */}
              <select
                value={item.size || ""}
                onChange={(e) =>
                  updateSize(item._id, e.target.value)
                }
                className="border mt-2 p-1 rounded"
              >
                <option value="">
                  Select Size
                </option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>2XL</option>
                <option>3XL</option>
              </select>

              {/* QUANTITY */}
              <div className="flex gap-3 mt-2">

                <button
                  onClick={() =>
                    decreaseQty(item._id)
                  }
                  className="px-3 bg-gray-200 rounded"
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  onClick={() =>
                    increaseQty(item._id)
                  }
                  className="px-3 bg-gray-200 rounded"
                >
                  +
                </button>

              </div>

            </div>
          </div>

          {/* PRICE */}
          <div className="text-right">

            <h3 className="font-bold">
              ₹{item.price * item.quantity}
            </h3>

            <button
              onClick={() =>
                removeFromCart(item._id)
              }
              className="text-red-500 text-sm"
            >
              Remove
            </button>

          </div>

        </div>

      ))}

      {/* TOTAL */}
      <div className="mt-10 text-right">

        <h2 className="text-2xl font-bold">
          Total: ₹{total}
        </h2>

        <Link to="/checkout">
          <button className="
            mt-6 bg-pink-600 text-white
            px-8 py-3 rounded-full
            hover:bg-black transition
          ">
            Proceed To Payment →
          </button>
        </Link>

      </div>

    </div>
  );
}
