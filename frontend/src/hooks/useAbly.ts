'use client';

import { useEffect, useState, useRef } from 'react';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

/**
 * useAbly hook for real-time messaging
 * Refactored to use the central Singleton Ably Client and dynamic subscriptions
 */
export function useAbly(channelName: string, onMessage?: (message: any) => void) {
  const { channel, isConnected } = useAblyClient();
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const isSubscribedRef = useRef<boolean>(false);

  // Subscription Management Effect
  useEffect(() => {
    if (!channel || !isConnected || !isAuthenticated) {
        console.log('useAbly: Waiting for connection or auth to subscribe to:', channelName);
        return;
    }

    const ablyChannel = channel(channelName);
    if (!ablyChannel) {
        console.warn('useAbly: Failed to get channel instance for:', channelName);
        return;
    }

    const messageHandler = (message: any) => {
      if (onMessage) onMessage(message);
    };

    console.log('useAbly: Subscribing to channel:', channelName);
    ablyChannel.subscribe(messageHandler);
    isSubscribedRef.current = true;

    return () => {
      console.log('useAbly: Unsubscribing from channel:', channelName);
      ablyChannel.unsubscribe(messageHandler);
      isSubscribedRef.current = false;
    };
  }, [channelName, onMessage, isConnected, isAuthenticated]); // Re-subscribe if channel, handler, or connection changes

  return { isConnected, error, isSubscribed: isSubscribedRef.current };
}
