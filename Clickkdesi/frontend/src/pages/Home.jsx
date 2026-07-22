import { useEffect, useState } from "react";
import { getProducts } from "../api/products";

import HeroCarousel from "../components/HeroCarousel";
import ProductCard from "../components/ProductCard";
import ResponsiveImage from "../components/ResponsiveImage";
import { siteMediaPublicIds } from "../utils/cloudinary";

import { Link } from "react-router-dom";

/* ================= DISCOUNT ================= */

function DiscountBanner() {
  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white text-center py-3 font-medium">
      ✨ Free Shipping on all orders ✨
    </div>
  );
}

/* ================= CATEGORIES ================= */

function Categories() {

  const categories = [
    { name: "Full Sleeves", publicId: siteMediaPublicIds.categoryFullSleeves },
    { name: "Sleeveless", publicId: siteMediaPublicIds.categorySleeveless }
  ];

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-16">

      <h2 className="text-3xl sm:text-4xl font-bold text-center text-pink-600 mb-12">
        Shop By Style
      </h2>

      <div className="
        grid grid-cols-1 sm:grid-cols-2
        gap-8 max-w-5xl mx-auto
      ">

        {categories.map((cat, i) => (

          <Link
            key={i}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className="
              relative h-[280px] sm:h-[380px]
              rounded-3xl overflow-hidden
              group shadow-xl
            "
          >

            <ResponsiveImage
              publicId={cat.publicId}
              alt={cat.name}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 50vw"
              widths={[320, 480, 640]}
              className="
                w-full h-full object-cover
                group-hover:scale-110
                transition duration-700
              "
            />

            <div className="
              absolute inset-0
              bg-black/30
              group-hover:bg-black/40
            "/>

            <h3 className="
              absolute bottom-6 left-6
              text-white text-xl sm:text-2xl font-semibold
            ">
              {cat.name}
            </h3>

          </Link>

        ))}

      </div>

    </section>
  );
}

/* ================= PRODUCTS ================= */

function Products({ products }) {

  if (!products.length) {
    return (
      <section className="px-6 py-16">
        <h2 className="text-3xl font-bold text-pink-600">
          Trending Collection
        </h2>
        <p className="mt-4 text-gray-500">Loading products...</p>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-16">

      <h2 className="text-3xl sm:text-4xl font-bold text-pink-600 mb-10">
        Trending Collection
      </h2>

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        xl:grid-cols-4
        gap-6 sm:gap-8
      ">
        {products.map((p) => (
          <ProductCard
            key={p._id || p.imagePublicId || p.name}
            product={p}
            imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            imageWidths={[240, 320, 480]}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/products"
          className="
            inline-flex items-center justify-center
            rounded-full
            bg-pink-600 px-8 py-3
            text-sm font-semibold text-white
            shadow-lg
            hover:bg-black
            transition
          "
        >
          View All Products
        </Link>
      </div>

    </section>
  );
}

/* ================= HOME ================= */

export default function Home(){

  const [products,setProducts]=useState([]);

  useEffect(()=>{
    const loadProducts = async () => {
      try{
        const res = await getProducts({ limit: 8 });
        setProducts(res.products || []);
      }catch(err){
        console.error(err);
      }
    };
    loadProducts();
  },[]);

  return(
    <main className="
      flex flex-col
      overflow-x-hidden
      bg-gradient-to-b
      from-pink-50
      via-white
      to-rose-50
      bg-[radial-gradient(circle_at_1px_1px,#fbcfe8_1px,transparent_0)]
      [background-size:26px_26px]
    ">

      <HeroCarousel/>

      <DiscountBanner/>

      <Categories/>

      <Products products={products}/>

    </main>
  );
}
