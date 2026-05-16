import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useCart } from "../context/CartContext";
import emailjs from "@emailjs/browser";

export default function Payment() {

  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  /* ================= INIT PAYMENT ================= */

  useEffect(() => {

    const initPayment = async () => {
      try {

        const res = await API.post(
          "/payment/create-order",
          { orderId }
        );

        setPaymentData(res.data);

      } catch (err) {
        console.log(err);
        alert("Payment initialization failed");
        navigate("/checkout");
      } finally {
        setLoading(false);
      }
    };

    initPayment();

  }, [orderId, navigate]);



  /* ================= BUILD PRODUCT HTML ================= */

  const buildOrderItemsHTML = (products = []) => {

    if (!products.length)
      return "<p>No items found</p>";

    return products.map(p => `
      <table style="width:100%;margin-top:15px;border-bottom:1px solid #eee">

        <tr>

          <td style="width:80px">
            <img
              src="${p.image || p.product?.image || ""}"
              width="70"
              height="70"
              style="border-radius:8px;object-fit:cover"
            />
          </td>

          <td>
            <strong>${p.name || p.product?.name}</strong><br/>
            Qty: ${p.quantity}
          </td>

          <td style="text-align:right">
            ₹${p.price}
          </td>

        </tr>

      </table>
    `).join("");
  };



  /* ================= SEND CONFIRMATION MAIL ================= */

  const sendConfirmationMail = async () => {

    try {

      /* ✅ FETCH ORDER FROM BACKEND */
      const orderRes =
        await API.get(`/orders/${orderId}`);

      const order = orderRes.data;

      /* ✅ USE FILLED CHECKOUT EMAIL */
      const customerEmail =
        order?.shippingAddress?.email;

      const customerName =
        order?.shippingAddress?.name;

      if (!customerEmail) {
        console.log("❌ Customer email missing");
        return;
      }

      const orderItemsHTML =
        buildOrderItemsHTML(order.products);

      console.log("📩 Sending mail to:", customerEmail);

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE,
        import.meta.env.VITE_EMAILJS_TEMPLATE,
        {
          name: customerName,
          email: customerEmail,
          order_id: orderId,
          amount: order.totalAmount,
          order_items: orderItemsHTML
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log("✅ Email Sent Successfully");

    } catch (err) {
      console.log("🚨 Email Error:", err);
    }
  };



  /* ================= PAYMENT ================= */

  const payNow = () => {

    if (!paymentData || processing) return;

    setProcessing(true);

    const options = {

      key: import.meta.env.VITE_RAZORPAY_KEY,

      amount: paymentData.amount,
      currency: "INR",
      order_id: paymentData.razorpayOrderId,

      name: "Clickkdesi",
      description: "Secure Payment",

      handler: async (response) => {

        try {

          const verify =
            await API.post("/payment/verify", {
              ...response,
              orderId
            });

          if (verify.data.success) {

            /* ✅ SEND EMAIL */
            await sendConfirmationMail();

            /* ✅ CLEAR CART */
            clearCart();

            navigate("/success", {
              replace: true
            });
          }

        } catch (err) {

          console.log(err);
          alert("Payment verification failed");
        }

        setProcessing(false);
      },

      modal: {
        ondismiss: () => {
          setProcessing(false);
          navigate("/checkout");
        }
      },

      theme: {
        color: "#ec4899"
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", () => {
      setProcessing(false);
      alert("Payment Failed");
    });

    rzp.open();
  };



  /* ================= UI ================= */

  if (loading)
    return (
      <div className="p-10 text-center">
        Preparing Payment...
      </div>
    );

  return (
    <div className="h-screen flex flex-col justify-center items-center">

      <h1 className="text-3xl font-bold">
        Secure Checkout
      </h1>

      <button
        onClick={payNow}
        disabled={processing}
        className="bg-green-600 text-white px-10 py-4 mt-6 rounded-lg"
      >
        {processing
          ? "Processing..."
          : `Pay ₹${paymentData.amount / 100}`}
      </button>

    </div>
  );
}