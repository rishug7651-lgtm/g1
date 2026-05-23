import { Link } from "react-router-dom";

const categories = [
  "Sleeveless Kurtis",
  "Full Sleeves Kurtis",
  
];

export default function Categories() {

  return (
    <div className="grid md:grid-cols-4 gap-6 px-6">

      {categories.map(cat => (

        <Link
          key={cat}
          to={`/products?category=${cat}`}
          className="p-6 shadow rounded-xl text-center hover:bg-pink-50"
        >
          {cat}
        </Link>

      ))}

    </div>
  );
}