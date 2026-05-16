import { useCart } from "../context/CartContext";
import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Checkout() {

  const { cart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success" // success | error
});
  /* ================= ADDRESS ================= */

  const [address, setAddress] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: ""
  });

  /* ================= COUPON ================= */

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("N/A");
  const [discount, setDiscount] = useState(0);

  const COUPONS = {
    // NEW10: 10,
    // SAVE20: 20,
    // PANKURI50: 50 ,
    // FIRST100: 30,
    SUPER50 : 30 ,
      
  };

  /* ================= PRICE ================= */

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const deliveryCharge = 0;

  const total =
    subtotal + deliveryCharge - discount;

  /* ================= APPLY COUPON ================= */

 const applyCoupon = () => {
  const code = couponInput.trim().toUpperCase();

  if (!COUPONS[code]) {
    setToast({
      show: true,
      message: "Invalid Coupon Code ❌",
      type: "error"
    });

    setTimeout(() => setToast({ ...toast, show: false }), 2500);
    return;
  }

  const discountAmount = COUPONS[code];
  const finalDiscount = Math.min(discountAmount, subtotal);

  setDiscount(finalDiscount);
  setAppliedCoupon(code);

  setToast({
    show: true,
    message: `Coupon Applied 🎉 ₹${finalDiscount} OFF`,
    type: "success"
  });

  setTimeout(() => setToast({ ...toast, show: false }), 2500);
};
  /* ================= VALIDATION ================= */

  const validateForm = () => {

    let newErrors = {};

    if (!address.name.trim())
      newErrors.name = "Name required";

    if (!/^\S+@\S+\.\S+$/.test(address.email))
      newErrors.email = "Valid email required";

    if (!/^[6-9]\d{9}$/.test(address.phone))
      newErrors.phone = "Invalid phone number";

    if (!address.address.trim())
      newErrors.address = "Complete address required";

    if (!/^\d{6}$/.test(address.pincode))
      newErrors.pincode = "Invalid pincode";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ================= CREATE ORDER ================= */
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
  const continuePayment = async () => {

    if (!validateForm()) return;

    try {

      setLoading(true);

      const res = await API.post("/orders", {
        products: cart,
        shippingAddress: address,
        totalAmount: total,
        couponCode: appliedCoupon || "N/A"
      });

      if (!res.data?.orderId) {
        alert("Order creation failed");
        return;
      }

      navigate(`/payment/${res.data.orderId}`);

    } catch (err) {

      console.error(err);
      alert("Order Failed");

    } finally {
      setLoading(false);
    }
  };

  /* ================= EMPTY CART ================= */

  if (cart.length === 0)
    return (
      <h2 className="p-10 text-center text-xl">
        Cart Empty 🛒
      </h2>
    );

  /* ================= UI ================= */

  return (

    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 p-8">

      {/* ================= ADDRESS ================= */}

      <div className="bg-white shadow-xl p-6 rounded-xl">

        <h2 className="text-2xl font-bold mb-5">
          Shipping Details
        </h2>

        {/* NAME */}
        <input
          type="text"
          placeholder="Full Name"
          className="border p-3 w-full mb-2 rounded"
          value={address.name}
          onChange={(e)=>
            setAddress({...address,name:e.target.value})
          }
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email Address"
          className="border p-3 w-full mb-2 rounded"
          value={address.email}
          onChange={(e)=>
            setAddress({...address,email:e.target.value})
          }
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        {/* PHONE */}
        <input
          type="number"
          placeholder="Phone Number"
          className="border p-3 w-full mb-2 rounded"
          value={address.phone}
          onChange={(e)=>
            setAddress({...address,phone:e.target.value})
          }
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

        {/* COMPLETE ADDRESS */}
        <textarea
          placeholder="Complete Address (House No, Street, Area, Landmark, City, State)"
          rows={4}
          className="border p-3 w-full mb-2 rounded resize-none"
          value={address.address}
          onChange={(e)=>
            setAddress({...address,address:e.target.value})
          }
        />
        {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}

        {/* PINCODE */}
        <input
          type="number"
          placeholder="Pincode"
          className="border p-3 w-full mb-2 rounded"
          value={address.pincode}
          onChange={(e)=>
            setAddress({...address,pincode:e.target.value})
          }
        />
        {errors.pincode && <p className="text-red-500 text-sm">{errors.pincode}</p>}

      </div>


      {/* ================= SUMMARY ================= */}

      <div className="bg-gray-50 shadow-xl p-6 rounded-xl max-h-[80vh] overflow-y-auto">

        <h2 className="text-2xl font-bold mb-4">
          Order Summary
        </h2>

        {cart.map(item => (
          <div
            key={item._id}
            className="flex justify-between mb-2"
          >
            <span>
              {item.name} × {item.quantity}
            </span>

            <span>
              ₹{item.price * item.quantity}
            </span>
          </div>
        ))}

        <hr className="my-4" />

        <p>Subtotal : ₹{subtotal}</p>

        {/* ================= COUPON ================= */}

        <h3 className="mt-4 font-semibold">
          Have a Coupon?
        </h3>

        <input
          placeholder="Enter Coupon Code"
          className="border p-2 w-full rounded mt-2"
          value={couponInput}
          onChange={(e)=>
            setCouponInput(e.target.value)
          }
        />

        <button
          onClick={applyCoupon}
          className="mt-2 w-full bg-black text-white py-2 rounded"
        >
          Apply Coupon
        </button>

        {discount > 0 && (
          <p className="text-green-600 mt-2">
            Discount Applied: -₹{discount}
          </p>
        )}

        <p className="mt-2">
          Delivery :
          {deliveryCharge === 0
            ? " Free"
            : ` ₹${deliveryCharge}`}
        </p>

        <h3 className="text-xl font-bold mt-4">
          Total : ₹{total}
        </h3>

        <button
          onClick={continuePayment}
          disabled={loading}
          className="w-full mt-6 bg-pink-600 text-white py-3 rounded-lg hover:bg-black transition disabled:bg-gray-400"
        >
          {loading
            ? "Creating Order..."
            : "Proceed To Payment"}
        </button>

      </div>

    </div>
  );
}