import { useEffect, useState } from "react";
import { getProducts } from "../api/products";

import HeroCarousel from "../components/HeroCarousel";
import ProductCard from "../components/ProductCard";

import { Link } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

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
    { name: "Full Sleeves", img: "/photos/c1.jpg" },
    { name: "Sleeveless", img: "/photos/c2.jpg" }
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

            <img
              src={cat.img}
              alt={cat.name}
              loading="lazy"
              decoding="async"
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
          <ProductCard key={p._id} product={p}/>
        ))}
      </div>

    </section>
  );
}

/* ================= VIDEO ================= */

function FashionVideo() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-20">

      <div className="
        relative
        h-[260px]
        sm:h-[420px]
        lg:h-[520px]
        rounded-3xl
        overflow-hidden
        shadow-2xl
      ">

        <video
          controls
          muted
          playsInline
          preload="none"
          poster="/photos/p1.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/v2.mp4" type="video/mp4"/>
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>

        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-xl sm:text-4xl font-bold">
            Confidence in Every Style
          </h2>
        </div>

      </div>

    </section>
  );
}

/* ================= GALLERY ================= */

function GalleryCarousel() {

  const images = [
    "/photos/p1.jpg",
    "/photos/p2.jpg",
    "/photos/p3.jpg",
    "/photos/p4.jpg"
  ];

  return (
    <section className="py-20">

      <h2 className="text-2xl sm:text-3xl font-bold text-center text-pink-600 mb-12">
        Style Inspiration
      </h2>

      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 2500 }}
        loop
        spaceBetween={16}
        slidesPerView={1.2}
        breakpoints={{
          640:{slidesPerView:2},
          1024:{slidesPerView:3}
        }}
        className="px-4 sm:px-8"
      >

        {images.map((img,i)=>(
          <SwiperSlide key={i}>
            <div className="h-[280px] sm:h-[360px] rounded-3xl overflow-hidden shadow-xl">
              <img
                src={img}
                alt="Style inspiration"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:scale-110 transition duration-700"
              />
            </div>
          </SwiperSlide>
        ))}

      </Swiper>

    </section>
  );
}

/* ================= HOME ================= */

export default function Home(){

  const [products,setProducts]=useState([]);

  useEffect(()=>{
    const loadProducts = async () => {
      try{
        const res = await getProducts({ limit: 12 });
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

      <FashionVideo/>

      <GalleryCarousel/>

    </main>
  );
}
