import { useEffect, useState } from 'react';

interface AblyMessage {
  event: string;
  data: any;
}

export function useAbly(channelName: string, onMessage?: (message: AblyMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const connectAbly = async () => {
      try {
        // Placeholder for Ably connection
        // In production, this would connect to Ably using the token
        setIsConnected(true);
      } catch (err: any) {
        setError(err.message);
      }
    };

    connectAbly();
  }, [channelName, onMessage]);

  return { isConnected, error };
}
