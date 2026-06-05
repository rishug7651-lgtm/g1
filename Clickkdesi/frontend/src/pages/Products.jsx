import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/products";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    let alive = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await getProducts({ category, limit: 24 });

        if (alive) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      alive = false;
    };
  }, [category]);

  return (
    <div className="px-4 md:px-12 py-12">
      <h1 className="text-3xl font-bold mb-10">
        {category ? `${category} Collection` : "All Products"}
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              imageWidths={[240, 320, 480, 640]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
