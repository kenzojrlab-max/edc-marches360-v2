import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9998] text-center py-2 px-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
        isOffline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff size={14} /> Hors connexion — Les modifications ne seront pas sauvegardées
        </>
      ) : (
        <>
          <Wifi size={14} /> Connexion rétablie
        </>
      )}
    </div>
  );
};
