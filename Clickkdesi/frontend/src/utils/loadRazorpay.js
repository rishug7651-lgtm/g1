const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayPromise;

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;

    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      razorpayPromise = undefined;
      reject(new Error("Unable to load Razorpay checkout"));
    };

    document.body.appendChild(script);
  });

  return razorpayPromise;
};
