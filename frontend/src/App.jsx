import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import router from '@/routes';
import { initSocket, getSocket } from '@/services/socket.service';
import NotificationPermissionCard from '@/features/notifications/components/NotificationPermissionCard';

function App() {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Apply language
    const lang = user?.settings?.preferences?.language || 'en';
    window.document.documentElement.setAttribute('lang', lang);

    if (user) {
      const socket = initSocket();

      const joinUserRoom = () => {
        const userId = user.id || user._id;
        if (userId) {
          socket.emit("joinRoom", userId);
        }
      };

      if (socket.connected) {
        joinUserRoom();
      }

      socket.on("connect", joinUserRoom);

      const handleDeactivated = () => {
        logout()
          .catch((err) => console.error("Logout error on deactivation:", err))
          .finally(() => {
            window.location.href = "/";
          });
      };

      socket.on("accountDeactivated", handleDeactivated);

      return () => {
        socket.off("connect", joinUserRoom);
        socket.off("accountDeactivated", handleDeactivated);
      };
    }
  }, [user]);

  return (
    <>
      <RouterProvider router={router} />
      {user && <NotificationPermissionCard />}
    </>
  );
}

export default App;