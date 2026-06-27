import { io } from "socket.io-client";

let socket;

const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "http://localhost:3001";

export const initSocket = (serverUrl = baseURL) => {
    if (!socket) {
        socket = io(serverUrl, {
            withCredentials: true,
        });

        socket.on("connect", () => {
            console.log("Connected to socket server");
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from socket server");
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};
