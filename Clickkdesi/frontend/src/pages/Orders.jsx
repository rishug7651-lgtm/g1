import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem("admin_api_token") || ""
  );
  const [tokenInput, setTokenInput] = useState(adminToken);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminToken) return;

    let alive = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/orders", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          params: {
            page: 1,
            limit: 20,
          },
        });

        if (alive) setOrders(res.data.orders || []);
      } catch (err) {
        console.log(err);
        if (alive) setError("Unable to load orders with this admin token.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      alive = false;
    };
  }, [adminToken]);

  const saveToken = () => {
    const token = tokenInput.trim();

    if (token) {
      sessionStorage.setItem("admin_api_token", token);
      setAdminToken(token);
    }
  };

  if (!adminToken) {
    return (
      <div className="p-10 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Orders</h1>
        <p className="text-gray-600 mb-4">
          Admin token required. Public order listing is disabled to reduce
          bandwidth and protect customer data.
        </p>
        <input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="Admin API token"
          className="border p-3 w-full rounded"
        />
        <button
          onClick={saveToken}
          className="mt-3 bg-pink-600 text-white px-6 py-3 rounded-lg"
        >
          Load Orders
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center">Loading Orders...</div>;
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!orders.length && !error ? (
        <div className="p-10 text-center">No Orders Found</div>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            className="border rounded-lg p-6 mb-6 shadow-sm bg-white"
          >
            <div className="flex justify-between mb-4">
              <div>
                <p className="font-semibold">Order ID:</p>
                <p className="text-sm text-gray-500">{order._id}</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">Rs. {order.totalAmount}</p>
                <p
                  className={`text-sm font-semibold ${
                    order.paymentStatus === "paid"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {order.paymentStatus?.toUpperCase()}
                </p>
              </div>
            </div>

            <div>
              {order.products?.map((product, index) => (
                <div
                  key={`${product.productId || product.name}-${index}`}
                  className="flex justify-between border-t py-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {product.quantity}
                    </p>
                  </div>

                  <p>Rs. {product.price}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold">Shipping To:</p>
              <p>{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.address}</p>
              <p>{order.shippingAddress?.pincode}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
