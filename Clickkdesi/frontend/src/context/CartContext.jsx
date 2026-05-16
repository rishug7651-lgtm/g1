import React,
{
  createContext,
  useContext,
  useState
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {

  const [cart, setCart] = useState([]);

  /* ================= ADD TO CART ================= */

  const addToCart = (product) => {

  setCart(prev => {

    const productSize = product.size || "default"; // ✅ FIX

    const exist = prev.find(
      i =>
        i._id === product._id &&
        (i.size || "default") === productSize
    );

    /* ✅ SAME PRODUCT + SAME SIZE */
    if (exist) {
      return prev.map(i =>
        i._id === product._id &&
        (i.size || "default") === productSize
          ? {
              ...i,
              quantity: i.quantity + 1
            }
          : i
      );
    }

    /* ✅ NEW ITEM */
    return [
      ...prev,
      {
        ...product,
        quantity: 1,
        size: productSize
      }
    ];
  });
};

  /* ================= UPDATE SIZE ================= */

  const updateSize = (id, size) => {

    setCart(prev =>
      prev.map(item =>
        item._id === id
          ? { ...item, size }
          : item
      )
    );
  };

  /* ================= QUANTITY ================= */

  const increaseQty = (id) => {
  setCart((prevCart) =>
    prevCart.map((item) =>
      item._id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  );
};

  const decreaseQty = (id) => {
  setCart((prevCart) =>
    prevCart
      .map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0)
  );
};

  /* ================= REMOVE ================= */

  const removeFromCart = (id) => {
  setCart((prevCart) =>
    prevCart.filter((item) => item._id !== id)
  );
};

  /* ================= CLEAR ================= */

  const clearCart = () => setCart([]);

  /* ✅ IMPORTANT EXPORT */

  const value = {
    cart,
    addToCart,
    clearCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    updateSize   // ⭐ FIX ADDED
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useCart() {
  return useContext(CartContext);
}