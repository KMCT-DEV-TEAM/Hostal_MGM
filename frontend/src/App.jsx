import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import router from '@/routes';

function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Apply language
    const lang = user?.settings?.preferences?.language || 'en';
    window.document.documentElement.setAttribute('lang', lang);
  }, [user?.settings?.preferences?.language]);

  return (

    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;