import { io } from "socket.io-client";
import { refreshAccessToken } from './tokenUtils.js';

const SOCKET_URL = import.meta.env.VITE_BACKEND || "http://localhost:3000";

// Get the token from cookie (backend stores it there)
const getAuthToken = () => {
  // Get token from cookie ONLY (backend sets it in httpOnly cookie)
  const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
  if (match) {
    const token = decodeURIComponent(match[2]);
    console.log('🔑 Retrieved token from cookie:', token ? 'Found' : 'Not found');
    return token;
  }

  console.log('⚠️ No accessToken cookie found');
  return null;
};

// [cite: 29, 50, 1615] - Config matches documentation requirements
const socket = io(SOCKET_URL , {
  autoConnect: false, // Prevent connection until we explicitly call .connect()
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  withCredentials: true, // IMPORTANT: Send cookies with the request
  auth: async (cb) => {
    // Since the cookie is httpOnly, we can't read it with JavaScript
    // The cookie will be sent automatically by the browser via withCredentials
    // But Socket.IO auth expects a token in the auth object
    // So we need to get it from a non-httpOnly cookie or let the backend read it from headers

    console.log('🔐 Socket auth callback - cookies will be sent via withCredentials');

    // Return empty auth for now - backend will read token from cookie header
    cb({});
  }
});

export default socket;