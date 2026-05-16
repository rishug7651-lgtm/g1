import {useEffect,useState} from "react";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

export default function Products(){

 const [products,setProducts]=useState([]);

 useEffect(()=>{
  API.get("/products")
  .then(res=>setProducts(res.data));
 },[]);

 return(
 <div className="grid md:grid-cols-3 gap-6 p-10">
  {products.map(p=>
   <ProductCard key={p._id} product={p}/>
  )}
 </div>
 );
}