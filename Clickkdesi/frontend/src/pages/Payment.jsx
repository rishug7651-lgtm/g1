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

  useEffect(() => {
    let alive = true;

    const initPayment = async () => {
      try {
        const res = await API.post("/payment/create-order", { orderId });
        if (alive) setPaymentData(res.data);
      } catch (err) {
        console.log(err);
        alert("Payment initialization failed");
        navigate("/checkout");
      } finally {
        if (alive) setLoading(false);
      }
    };

    initPayment();

    return () => {
      alive = false;
    };
  }, [orderId, navigate]);

  const buildOrderItemsHTML = (products = []) => {
    if (!products.length) return "<p>No items found</p>";

    return products
      .map(
        (product) => `
      <table style="width:100%;margin-top:12px;border-bottom:1px solid #eee">
        <tr>
          <td>
            <strong>${product.name || ""}</strong><br/>
            Qty: ${product.quantity || 1}
            ${product.size ? `<br/>Size: ${product.size}` : ""}
          </td>
          <td style="text-align:right">Rs. ${product.price || 0}</td>
        </tr>
      </table>
    `
      )
      .join("");
  };

  const sendConfirmationMail = async (order) => {
    try {
      const customerEmail = order?.shippingAddress?.email;
      const customerName = order?.shippingAddress?.name;

      if (!customerEmail) {
        console.log("Customer email missing");
        return;
      }

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE,
        import.meta.env.VITE_EMAILJS_TEMPLATE,
        {
          name: customerName,
          email: customerEmail,
          order_id: orderId,
          amount: order.totalAmount,
          order_items: buildOrderItemsHTML(order.products),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
    } catch (err) {
      console.log("Email Error:", err);
    }
  };

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
          const verify = await API.post("/payment/verify", {
            ...response,
            orderId,
          });

          if (verify.data.success) {
            await sendConfirmationMail(verify.data.order);
            clearCart();
            navigate("/success", { replace: true });
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
        },
      },

      theme: {
        color: "#ec4899",
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", () => {
      setProcessing(false);
      alert("Payment Failed");
    });

    rzp.open();
  };

  if (loading) {
    return <div className="p-10 text-center">Preparing Payment...</div>;
  }

  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold">Secure Checkout</h1>

      <button
        onClick={payNow}
        disabled={processing}
        className="bg-green-600 text-white px-10 py-4 mt-6 rounded-lg"
      >
        {processing ? "Processing..." : `Pay Rs. ${paymentData.amount / 100}`}
      </button>
    </div>
  );
}
