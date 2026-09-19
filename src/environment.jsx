const environment = {
  API_URL: '',
  VITE_API_BASE_URL: '/lrf-be/public/api/v1/',
  VITE_PUSHER_APP_KEY: '68bcf13e240247effafd',
  VITE_PUSHER_APP_CLUSTER: 'ap3',
  VITE_LIFF_KEY: '2009308974-2bAhXIte',
  // Automatically false during `npm run dev`, true in production builds
  VITE_LIFF_ENABLED: !import.meta.env.DEV,
  VITE_LIFF_MOCK_USER_ID: 'local-test-user',
  VITE_LIFF_MOCK_DISPLAY_NAME: 'Local Test',
};

export default environment;
