import Echo from "laravel-echo";
import Pusher from "pusher-js";
import environment from "./environment";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: import.meta.env.PUSHER_APP_KEY,
  cluster: import.meta.env.PUSHER_APP_CLUSTER,
  forceTLS: true,
});

export default echo;