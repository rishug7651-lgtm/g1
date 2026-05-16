import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/* ✅ IMPORT THIS */
import { CartProvider } from "./context/CartContext";


import AOS from "aos";
import "aos/dist/aos.css";

AOS.init({
 duration:1200,
 once:true,
 easing:"ease-out-cubic"
});

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);

