// Hook for getting Ably client instance to create dynamic channels
'use client';

import { useEffect, useState, useRef } from 'react';
import * as Ably from 'ably';
import { API_BASE_URL } from '@/constants';
import { useAuth } from './useAuth';

// Singleton instance and shared state to prevent multiple connections and state desync
let globalAblyClient: Ably.Realtime | null = null;
let lastToken: string | null = null;
let globalIsConnected = false;
const statusSubscribers = new Set<(connected: boolean) => void>();

const notifySubscribers = (connected: boolean) => {
  globalIsConnected = connected;
  statusSubscribers.forEach(sub => sub(connected));
};

export function useAblyClient() {
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const { isAuthenticated } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    // Register this instance as a subscriber
    const sub = (connected: boolean) => setIsConnected(connected);
    statusSubscribers.add(sub);
    
    // Initial sync
    setIsConnected(globalIsConnected);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (!token || !isAuthenticated) {
      if (globalAblyClient) {
        console.log('useAblyClient: Closing singleton connection');
        globalAblyClient.close();
        globalAblyClient = null;
        lastToken = null;
        notifySubscribers(false);
      }
      return () => statusSubscribers.delete(sub);
    }

    // Reuse existing client if token is the same
    if (globalAblyClient && lastToken === token) {
      console.log('useAblyClient: Reusing existing Ably connection, current state:', globalAblyClient.connection.state);
      // Sync state if already connected
      if (globalAblyClient.connection.state === 'connected' && !globalIsConnected) {
        notifySubscribers(true);
      }
      return () => statusSubscribers.delete(sub);
    }

    // Replace existing client if token changed
    if (globalAblyClient) {
      console.log('useAblyClient: Replacing client due to token change');
      globalAblyClient.close();
      notifySubscribers(false);
    }

    console.log('useAblyClient: Creating NEW Singleton Ably connection');
    const ably = new Ably.Realtime({
      authUrl: `${API_BASE_URL}/ably/token`,
      authHeaders: {
        Authorization: `Bearer ${token}`
      },
      authMethod: 'GET',
      closeOnUnload: true
    });

    globalAblyClient = ably;
    lastToken = token;

    const StatusUpdate = () => {
      const connected = ably.connection.state === 'connected';
      console.log('useAblyClient: Connection state changed to:', ably.connection.state);
      notifySubscribers(connected);
    };

    ably.connection.on('connected', StatusUpdate);
    ably.connection.on('disconnected', StatusUpdate);
    ably.connection.on('failed', StatusUpdate);
    ably.connection.on('closed', StatusUpdate);

    return () => {
      // Cleanup listeners for THIS instance
      statusSubscribers.delete(sub);
      
      // We don't close the singleton on unmount to keep it alive for other hooks
      // The singleton closes only on logout (handled above)
    };
  }, [isAuthenticated]);

  const getChannel = (channelName: string) => {
    if (!globalAblyClient) return null;
    return globalAblyClient.channels.get(channelName);
  };

  return { 
    channel: getChannel, 
    isConnected, 
    client: globalAblyClient 
  };
}
