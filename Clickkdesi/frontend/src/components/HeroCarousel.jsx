import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectFade,
  Pagination
} from "swiper/modules";

import { motion as Motion } from "framer-motion";
import ResponsiveImage from "./ResponsiveImage";
import { productMediaPath } from "../utils/media";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export default function HeroCarousel() {

  const slides = [
    {
      type: "image",
      publicId: productMediaPath("p1.jpg"),
      title: "Elegance Redefined",
      subtitle: "Designed for Modern Women"
    },
    {
      type: "image",
      publicId: productMediaPath("p3.jpg"),
      title: "Clickkdesi Collection",
      subtitle: "Fashion That Speaks You"
    }
  ];

  return (
    <section className="relative w-full overflow-hidden">

      {/* SOFT BACKGROUND GLOW */}
      <div className="
        absolute inset-0
        bg-gradient-to-r
        from-pink-200/20
        via-transparent
        to-rose-200/20
        z-10
        pointer-events-none
      "/>

      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={{
          delay: 4500,
          disableOnInteraction: false
        }}
        pagination={{ clickable: true }}
        loop
        className="w-full h-[70vh] md:h-[92vh]"
      >

        {slides.map((slide, i) => (

          <SwiperSlide key={i}>

            <div className="relative w-full h-full">

              {/* MEDIA */}
              {slide.type === "video" ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="
                    absolute inset-0
                    w-full h-full
                    object-cover
                    scale-105
                  "
                >
                  <source src={slide.src} type="video/mp4"/>
                </video>
              ) : (
                <Motion.div
                  className="
                    absolute inset-0
                    w-full h-full
                  "
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.08 }}
                  transition={{ duration: 8 }}
                >
                  <ResponsiveImage
                    publicId={slide.publicId}
                    alt={slide.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover"
                    sizes="100vw"
                    widths={[640, 960]}
                  />
                </Motion.div>
              )}

              {/* DARK + PINK OVERLAY */}
              <div className="
                absolute inset-0
                bg-gradient-to-t
                from-black/70
                via-black/20
                to-pink-200/10
              "/>

              {/* HERO CONTENT */}
              <div className="
                absolute inset-0
                flex items-center
                px-6 md:px-16
                z-20
              ">

                <Motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="text-white max-w-xl"
                >

                  <h1 className="
                    text-3xl
                    sm:text-5xl
                    md:text-6xl
                    font-bold
                    leading-tight
                    mb-6
                  ">
                    {slide.title}
                  </h1>

                  <p className="
                    text-base
                    md:text-lg
                    opacity-90
                    mb-8
                  ">
                    {slide.subtitle}
                  </p>

                  {/* CTA BUTTON */}
                  <button className="
                    px-8 py-3
                    rounded-full
                    backdrop-blur-md
                    bg-white/90
                    text-black
                    font-medium
                    shadow-xl
                    hover:bg-pink-500
                    hover:text-white
                    transition-all duration-300
                  ">
                    Shop Now
                  </button>

                </Motion.div>

              </div>

            </div>

          </SwiperSlide>

        ))}

      </Swiper>

    </section>
  );
}
