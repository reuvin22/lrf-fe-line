const environment = {
  VITE_API_URL: import.meta.env.API_URL || 'http://127.0.0.1:8000',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  VITE_LIFF_KEY: import.meta.env.VITE_LIFF_KEY,
  VITE_LIFF_ENABLED: "true",
};

export default environment;