import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:5000/api";
const PRODUCTION_API_BASE_URL = "https://g1-x5ol.onrender.com/api";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL);

export default axios.create({
  baseURL,
  timeout: 15000,
});
