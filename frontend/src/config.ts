export const API_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:5000"
    : "https://pokemon-battle-calculator-1.onrender.com";
