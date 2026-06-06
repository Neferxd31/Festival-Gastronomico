// URL base del backend.
// En desarrollo, si no se define VITE_API_URL, usa el backend local.
// En producción, definir VITE_API_URL en Railway con la URL pública del backend (sin slash final).
const RAW = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
export const API_URL = RAW.replace(/\/$/, '')
