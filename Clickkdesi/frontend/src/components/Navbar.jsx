import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  X
} from "lucide-react";

import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import ResponsiveImage from "./ResponsiveImage";
import { siteMediaPublicIds } from "../utils/cloudinary";

export default function Navbar() {

  const { cart } = useCart();
  const [mobileMenu, setMobileMenu] = useState(false);

  const cartCount = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  return (
    <nav className="
      sticky top-0 z-50
      backdrop-blur-xl
      bg-gradient-to-r
      from-pink-50/70
      via-white/70
      to-rose-50/70
      border-b border-pink-100
      shadow-[0_10px_35px_rgba(255,105,180,0.18)]
    ">

      {/* SOFT PINK GLOW */}
      <div className="
        absolute inset-0
        bg-gradient-to-r
        from-pink-200/20
        via-transparent
        to-rose-200/20
        -z-10
      "/>

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="flex justify-between items-center h-16">

          {/* ================= LOGO ================= */}
          <Link to="/" className="flex items-center gap-3">

            <ResponsiveImage
              publicId={siteMediaPublicIds.logo}
              alt="Clickkdesi"
              widths={[64, 96, 120]}
              sizes="96px"
              className="
                h-10 w-auto
                object-contain
                drop-shadow-md
                hover:scale-105
                transition
              "
            />

            <span className="
              hidden sm:block
              text-xl font-semibold
              text-pink-600
              tracking-wide
            ">
              Clickkdesi
            </span>

          </Link>

          {/* ================= DESKTOP MENU ================= */}
          <ul className="
            hidden md:flex
            gap-8
            font-medium
            text-gray-700
          ">

            {["Home", "Shop", "Dresses", "Beauty"].map((item,i)=>(
              <li key={i}>
                <Link
                  to={item==="Home"?"/":"/products"}
                  className="
                    relative
                    hover:text-pink-600
                    transition
                    after:absolute
                    after:left-0
                    after:-bottom-1
                    after:h-[2px]
                    after:w-0
                    after:bg-gradient-to-r
                    after:from-pink-400
                    after:to-rose-400
                    after:transition-all
                    hover:after:w-full
                  "
                >
                  {item}
                </Link>
              </li>
            ))}

            <li className="
              text-pink-600
              font-semibold
              cursor-pointer
            ">
              Sale
            </li>

          </ul>

          {/* ================= RIGHT ICONS ================= */}
          <div className="flex items-center gap-5">

            <Heart
              size={22}
              className="
                cursor-pointer
                text-gray-700
                hover:text-pink-500
                hover:scale-110
                transition
              "
            />

            {/* CART */}
            <Link to="/cart" className="relative">

              <ShoppingBag
                size={22}
                className="
                  text-gray-700
                  hover:text-pink-500
                  hover:scale-110
                  transition
                "
              />

              {cartCount > 0 && (
                <span className="
                  absolute -top-2 -right-2
                  bg-gradient-to-r
                  from-pink-500
                  to-rose-400
                  text-white
                  text-xs
                  w-5 h-5
                  flex items-center justify-center
                  rounded-full
                  shadow-lg
                ">
                  {cartCount}
                </span>
              )}
            </Link>

            <User
              size={22}
              className="
                cursor-pointer
                text-gray-700
                hover:text-pink-500
                hover:scale-110
                transition
              "
            />

            {/* MOBILE MENU BUTTON */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>

          </div>

        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div className={`
        md:hidden
        overflow-hidden
        transition-all duration-500
        ${mobileMenu ? "max-h-96 py-6" : "max-h-0"}
      `}>

        <div className="
          mx-4 rounded-2xl
          backdrop-blur-xl
          bg-white/80
          shadow-xl
          border border-pink-100
        ">

          <ul className="
            flex flex-col
            gap-6
            px-6 py-6
            font-medium text-gray-700
          ">
            <Link to="/" onClick={()=>setMobileMenu(false)}>Home</Link>
            <Link to="/products" onClick={()=>setMobileMenu(false)}>Shop</Link>
            <li>Dresses</li>
            <li>Beauty</li>

            <li className="text-pink-600 font-semibold">
              Sale
            </li>
          </ul>

        </div>

      </div>

    </nav>
  );
}
