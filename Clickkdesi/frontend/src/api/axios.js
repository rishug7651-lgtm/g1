import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:5000/api";
const PRODUCTION_API_BASE_URL = "https://clickkdesistore.in/api";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL);

export default axios.create({
  baseURL,
  timeout: 15000,
});
