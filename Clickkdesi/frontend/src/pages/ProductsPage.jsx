export default function ProductsPage({ products }) {
  return (
    <div
      className="
        min-h-screen
        p-10
        bg-gradient-to-br
        from-[#fafafa]
        via-[#f5f5f5]
        to-[#eeeeee]
      "
    >
      <h1 className="text-4xl font-bold text-center mb-12">
        Our Collection
      </h1>

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-10
      ">
        {products.map((p) => (
          <ProductCard key={p._id} product={p}/>
        ))}
      </div>
    </div>
  );
}