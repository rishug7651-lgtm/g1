import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  // "https://g1-x5ol.onrender.com/api";
  "https://s4-backend-uyvz.onrender.com/api";

export default axios.create({
  baseURL,
  timeout: 15000,
});
