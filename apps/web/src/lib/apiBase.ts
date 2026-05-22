/** API origin — empty string uses same-origin (Netlify redirect or Vite proxy). */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
