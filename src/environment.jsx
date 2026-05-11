const environment = {
<<<<<<< HEAD
  VITE_API_BASE_URL: 'https://miraboes.com/lrf-be/public/api/v1/',
  VITE_PUSHER_APP_KEY: '68bcf13e240247effafd',
  VITE_PUSHER_APP_CLUSTER: 'ap3',
  VITE_LIFF_KEY: '2009308974-2bAhXIte'
};

export default environment;

// const environment = {
//   VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
//   VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
//   VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
//   VITE_LIFF_KEY: import.meta.env.VITE_LIFF_KEY
// };

// export default environment
=======
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  VITE_LIFF_KEY: import.meta.env.VITE_LIFF_KEY
};

export default environment
>>>>>>> 86ea2c35324079515dc82823d5a8795f32d801b4
