import { useEffect, useState } from "react";
import { getProducts } from "../api/products";

import HeroCarousel from "../components/HeroCarousel";
import ProductCard from "../components/ProductCard";
import ResponsiveImage from "../components/ResponsiveImage";
import {
  getCloudinaryVideoUrl,
  productMediaPublicId,
  siteMediaPublicIds,
  videoMediaPublicIds,
} from "../utils/cloudinary";

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
              widths={[480, 640, 800, 1000]}
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
  const [active, setActive] = useState(false);
  const videoUrl = getCloudinaryVideoUrl(videoMediaPublicIds.homepage);

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

        {active && videoUrl ? (
          <video
            controls
            autoPlay
            muted
            playsInline
            preload="metadata"
            poster=""
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4"/>
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="absolute inset-0 block w-full h-full text-left"
            aria-label="Play fashion video"
          >
            <ResponsiveImage
              publicId={productMediaPublicId("p1.jpg")}
              alt="Fashion video preview"
              className="w-full h-full object-cover"
              sizes="100vw"
              widths={[640, 960, 1280]}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-white/90 px-6 py-3 font-semibold text-pink-600 shadow-xl">
                Play
              </span>
            </span>
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"/>

        <div className="absolute bottom-8 left-8 text-white pointer-events-none">
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
    productMediaPublicId("p1.jpg"),
    productMediaPublicId("p2.jpg"),
    productMediaPublicId("p3.jpg"),
    productMediaPublicId("p4.jpg")
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
              <ResponsiveImage
                publicId={img}
                alt="Style inspiration"
                loading="lazy"
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                widths={[360, 520, 720, 960]}
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
