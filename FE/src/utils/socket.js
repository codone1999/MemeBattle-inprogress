import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND || "http://localhost:3000";

// Get the user ID from localStorage (set after successful login)
const getUserId = () => {
  try {
    return localStorage.getItem('userId');
  } catch (error) {
    console.error('Error getting userId:', error);
    return null;
  }
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
    const userId = getUserId();
    cb({ userId });
  }
});

export default socket;