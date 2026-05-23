import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function Footer() {

  return (
    <footer className="
      relative
      mt-20
      bg-gradient-to-b
      from-pink-50
      via-white
      to-rose-50
      border-t border-pink-100
    ">

      {/* SOFT BACKGROUND PATTERN */}
      <div className="
        absolute inset-0
        bg-[radial-gradient(circle_at_1px_1px,#fbcfe8_1px,transparent_0)]
        [background-size:26px_26px]
        opacity-40
        pointer-events-none
      "/>

      <div className="
        relative
        max-w-7xl
        mx-auto
        px-6
        py-16
        grid
        gap-12
        md:grid-cols-3
        items-start
      ">

        {/* ================= BRAND ================= */}
        <div>
          <h2 className="
            text-3xl font-bold
            text-pink-600 mb-4
          ">
            Clickkdesi
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Celebrating confidence, elegance and modern
            women fashion. Clickkdesi brings timeless
            styles crafted for everyday beauty.
          </p>
        </div>

        {/* ================= CONNECT ================= */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-5">
            Connect With Us
          </h3>

          <div className="space-y-4 text-gray-600">

            <div className="flex items-center gap-3">
              <Mail size={18}/>
              clickkdesi24@gmail.com
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18}/>
              +91 6392609860
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={18}/>
              India
            </div>

          </div>
        </div>

        {/* ================= SOCIAL ================= */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-5">
            Follow Our Fashion
          </h3>

          <div className="flex gap-5">

            <div className="
              p-3 rounded-full
              bg-white shadow-md
              hover:bg-pink-500
              hover:text-white
              transition cursor-pointer
            ">
              <Instagram/>
            </div>

            <div className="
              p-3 rounded-full
              bg-white shadow-md
              hover:bg-pink-500
              hover:text-white
              transition cursor-pointer
            ">
              <Facebook/>
            </div>

            <div className="
              p-3 rounded-full
              bg-white shadow-md
              hover:bg-pink-500
              hover:text-white
              transition cursor-pointer
            ">
              <Twitter/>
            </div>

          </div>

          {/* NEWSLETTER */}
          <div className="
            mt-6
            flex
            bg-white
            rounded-full
            overflow-hidden
            shadow-md
          ">
            <input
              type="email"
              placeholder="Join our newsletter"
              className="
                px-4 py-2
                flex-1
                outline-none
                text-sm
              "
            />

            <button className="
              bg-pink-500
              text-white
              px-5
              hover:bg-pink-600
              transition
            ">
              Subscribe
            </button>
          </div>

        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="
        text-center
        text-gray-600
        text-sm
        py-6
        border-t border-pink-100
      ">
        © 2026 Clickkdesi Fashion • Made with ❤️ for Women <br></br> Dev by Shaurya
      </div>

    </footer>
  );
}