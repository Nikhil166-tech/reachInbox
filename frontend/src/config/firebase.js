// --- Global Constants (Simulated Firebase Environment Variables) ---
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
export const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;