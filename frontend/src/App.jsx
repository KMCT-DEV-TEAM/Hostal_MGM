import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import router from '@/routes';
import { initSocket, getSocket } from '@/services/socket.service';

function App() {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Apply language
    const lang = user?.settings?.preferences?.language || 'en';
    window.document.documentElement.setAttribute('lang', lang);

    if (user) {
      const socket = initSocket();
      
      socket.emit("joinRoom", user._id);

      socket.on("accountDeactivated", () => {
        // You could also show a toast notification here
        logout();
        window.location.href = "/";
      });

      return () => {
        socket.off("accountDeactivated");
      };
    }
  }, [user]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;