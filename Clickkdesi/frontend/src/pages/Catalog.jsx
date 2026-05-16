import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

export default function Catalog() {

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [searchParams] = useSearchParams();

  const category = searchParams.get("category");

  /* ================= FETCH PRODUCTS ================= */

  useEffect(() => {
    API.get("/products")
      .then(res => {
        setProducts(res.data);
      });
  }, []);

  /* ================= APPLY FILTER ================= */

  useEffect(() => {

    if (!category) {
      // ✅ HOME CLICK → SHOW ALL
      setFilteredProducts(products);
      return;
    }

    // ✅ CATEGORY CLICK → FILTER
    const filtered = products.filter(
      p =>
        p.category?.toLowerCase() ===
        category.toLowerCase()
    );

    setFilteredProducts(filtered);

  }, [products, category]);

  return (

    <div className="px-4 md:px-12 py-12">

      <h1 className="text-3xl font-bold mb-10">

        {category
          ? `${category} Collection`
          : "All Products"}

      </h1>

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-8
      ">

        {filteredProducts.map(product => (
          <ProductCard
            key={product._id}
            product={product}
          />
        ))}

      </div>

    </div>
  );
}