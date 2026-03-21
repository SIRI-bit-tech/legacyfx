'use client';

import { useEffect, useState, useRef } from 'react';
import * as Ably from 'ably';
import { API_BASE_URL } from '@/constants';

/**
 * useAbly hook for real-time messaging
 * Refactored for robust connection management and dynamic subscriptions
 */
export function useAbly(channelName: string, onMessage?: (message: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  // Connection Management Effect
  useEffect(() => {
    const ably = new Ably.Realtime({
      authUrl: `${API_BASE_URL}/ably/token`,
      authHeaders: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      },
      closeOnUnload: true
    });

    ablyRef.current = ably;

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => setIsConnected(false);
    const handleFailed = (err: any) => {
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    };

    ably.connection.on('connected', handleConnected);
    ably.connection.on('disconnected', handleDisconnected);
    ably.connection.on('failed', handleFailed);

    return () => {
      ably.connection.off('connected', handleConnected);
      ably.connection.off('disconnected', handleDisconnected);
      ably.connection.off('failed', handleFailed);
      ably.close();
      ablyRef.current = null;
    };
  }, []); // Run once for the lifecycle of the hook/page

  // Subscription Management Effect
  useEffect(() => {
    const ably = ablyRef.current;
    if (!ably || !onMessage) return;

    const channel = ably.channels.get(channelName);
    const messageHandler = (message: any) => {
      if (onMessage) onMessage(message);
    };

    channel.subscribe(messageHandler);

    return () => {
      channel.unsubscribe(messageHandler);
    };
  }, [channelName, onMessage, isConnected]); // Re-subscribe if channel, handler, or connection changes

  return { isConnected, error };
}
