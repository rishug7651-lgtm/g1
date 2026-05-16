import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Orders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ORDERS ================= */

  useEffect(() => {

    const loadOrders = async () => {
      try {

        const res = await API.get("/orders");

        setOrders(res.data);

      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

  }, []);




  /* ================= UI ================= */

  if (loading)
    return (
      <div className="p-10 text-center">
        Loading Orders...
      </div>
    );

  if (!orders.length)
    return (
      <div className="p-10 text-center">
        No Orders Found
      </div>
    );



  return (

    <div className="p-10 max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        My Orders
      </h1>

      {orders.map(order => (

        <div
          key={order._id}
          className="
            border rounded-lg
            p-6 mb-6
            shadow-sm
            bg-white
          "
        >

          {/* ORDER HEADER */}
          <div className="flex justify-between mb-4">

            <div>
              <p className="font-semibold">
                Order ID:
              </p>
              <p className="text-sm text-gray-500">
                {order._id}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-lg">
                ₹{order.totalAmount}
              </p>

              <p className={`
                text-sm font-semibold
                ${order.paymentStatus === "paid"
                  ? "text-green-600"
                  : "text-red-500"}
              `}>
                {order.paymentStatus.toUpperCase()}
              </p>
            </div>

          </div>



          {/* PRODUCTS */}
          <div>

            {order.products?.map((p, i) => (

              <div
                key={i}
                className="flex justify-between border-t py-3"
              >

                <div>
                  <p className="font-medium">
                    {p.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    Qty: {p.quantity}
                  </p>
                </div>

                <p>₹{p.price}</p>

              </div>

            ))}

          </div>



          {/* ADDRESS */}
          <div className="mt-4 text-sm text-gray-600">

            <p className="font-semibold">
              Shipping To:
            </p>

            <p>
              {order.shippingAddress?.name}
            </p>

            <p>
              {order.shippingAddress?.address},
              {" "}
              {order.shippingAddress?.city}
            </p>

            <p>
              {order.shippingAddress?.pincode}
            </p>

          </div>

        </div>

      ))}

    </div>
  );
}