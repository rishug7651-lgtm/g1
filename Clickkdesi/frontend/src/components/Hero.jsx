import { useEffect, useState } from "react";
import API from "../api/axios";

import HeroCarousel from "../components/HeroCarousel";
import Categories from "../components/Categories";
import ProductCard from "../components/ProductCard";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

/* ================= DISCOUNT ================= */

function DiscountBanner() {
  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white text-center py-4 font-medium">
      ✨ Flat 10% OFF — Use CLICKKDESI10
    </div>
  );
}

/* ================= VIDEO SECTION ================= */

function FashionVideo() {
  return (
    <section className="px-6 md:px-12 py-16">

      <div className="
        relative
        w-full
        h-[300px]
        md:h-[520px]
        rounded-3xl
        overflow-hidden
        shadow-2xl
      ">

        {/* ✅ VIDEO FIXED */}
        <video
          autoPlay
          muted
          loop
          playsInline
          controls
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/v2.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute bottom-10 left-8 text-white">
          <h2 className="text-3xl md:text-5xl font-bold">
            Clickkdesi Fashion
          </h2>
        </div>

      </div>

    </section>
  );
}

/* ================= IMAGE GALLERY ================= */

function GalleryCarousel() {

  const gallery = [
    "/photos/p1.jpg",
    "/photos/p2.jpg",
    "/photos/p3.jpg",
    "/photos/p4.jpg",
    "/photos/p5.jpg",
    "/photos/p6.jpg"
  ];

  return (
    <section className="py-20">

      <h2 className="text-center text-3xl font-bold text-pink-600 mb-10">
        Style Inspiration
      </h2>

      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 2500 }}
        loop
        spaceBetween={20}
        slidesPerView={1.2}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
        className="px-6"
      >

        {gallery.map((img, i) => (
          <SwiperSlide key={i}>

            <div className="
              h-[350px]
              rounded-3xl
              overflow-hidden
              shadow-xl
            ">
              <img
                src={img}
                alt="gallery"
                className="
                  w-full h-full
                  object-cover
                  hover:scale-110
                  transition duration-700
                "
              />
            </div>

          </SwiperSlide>
        ))}

      </Swiper>

    </section>
  );
}

/* ================= HOME ================= */

export default function Home() {

  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get("/products")
      .then(res => setProducts(res.data));
  }, []);

  return (

    /* ✅ GLOBAL PINK PATTERN BACKGROUND */
    <div className="
      min-h-screen
      bg-gradient-to-b
      from-pink-50
      via-white
      to-rose-50
      bg-[radial-gradient(circle_at_1px_1px,#f9a8d4_1px,transparent_0)]
      [background-size:26px_26px]
    ">

      <HeroCarousel />

      <DiscountBanner />

      <FashionVideo />

      <Categories />

      {/* ================= PRODUCTS ================= */}
      <section className="px-6 md:px-12 py-16">

        <h2 className="
          text-3xl md:text-4xl
          font-bold
          text-pink-600
          mb-10
        ">
          Trending Collection
        </h2>

        <div className="
          grid
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          gap-8
        ">
          {products.map(p => (
            <ProductCard key={p._id} product={p}/>
          ))}
        </div>

      </section>

      <GalleryCarousel />

    </div>
  );
}