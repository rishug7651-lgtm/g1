import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {

  const navigate = useNavigate();

  useEffect(() => {

    /* ✅ Redirect after 4 seconds */
    const timer = setTimeout(() => {
      navigate("/");
    }, 4000);

    return () => clearTimeout(timer);

  }, [navigate]);

  return (

    <div className="h-screen flex flex-col 
    justify-center items-center text-center">

      <h1 className="text-4xl font-bold text-green-600">
        ✅ Payment Successful
      </h1>

      <p className="mt-4 text-lg">
        Your order has been confirmed.
      </p>

      <p className="text-gray-500 mt-2">
        Invoice & confirmation sent to your email.
      </p>

      <p className="mt-6 text-sm">
        Redirecting to homepage...
      </p>

    </div>
  );
}
