const environment = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  VITE_LIFF_KEY: import.meta.env.VITE_LIFF_KEY,
  VITE_LIFF_ENABLED: "true",
  VITE_LIFF_MOCK_USER_ID: "local-test-user",
  VITE_LIFF_MOCK_DISPLAY_NAME: "Local Test",
};

export default environment;