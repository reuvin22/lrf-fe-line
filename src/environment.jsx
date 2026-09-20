const environment = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  VITE_LIFF_KEY: import.meta.env.VITE_LIFF_KEY,
  // Set to "en" for English or "ja" for Japanese (default). Omit or leave empty to default to Japanese.
  VITE_LANG: import.meta.env.VITE_LANG,
};

export default environment;
