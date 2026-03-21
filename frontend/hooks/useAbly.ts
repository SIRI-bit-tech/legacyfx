import { useEffect, useState, useCallback, useRef } from 'react';
import * as Ably from 'ably';

// Token-based authentication for Ably
// The API key is now only used on the backend to generate short-lived tokens
// This provides better security and fine-grained access control

export function useAbly(channelName: string, onMessage?: (message: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the message handler in a ref to prevent connection recreation
  const messageHandlerRef = useRef(onMessage);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<any>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Update the ref when onMessage changes
  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Initialize Ably with token-based authentication
    // The authUrl endpoint will generate short-lived tokens with appropriate permissions
    const ably = new Ably.Realtime({
      authUrl: '/api/ably/token',
      // Add closeOnUnload for proper cleanup
      closeOnUnload: true
    });

    const channel = ably.channels.get(channelName);

    // Store references for cleanup
    ablyRef.current = ably;
    channelRef.current = channel;

    // Define connection state listeners with proper references
    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleFailed = (err: any) => {
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    };

    // Register connection listeners
    ably.connection.on('connected', handleConnected);
    ably.connection.on('disconnected', handleDisconnected);
    ably.connection.on('failed', handleFailed);

    // Set up message subscription if handler is provided
    let unsubscribe: (() => void) | null = null;
    if (messageHandlerRef.current) {
      const messageHandler = (message: any) => {
        // Call the current handler from ref
        if (messageHandlerRef.current) {
          messageHandlerRef.current(message);
        }
      };

      channel.subscribe(messageHandler);

      // Store unsubscribe function for cleanup
      unsubscribe = () => {
        channel.unsubscribe(messageHandler);
      };
      subscriptionRef.current = unsubscribe;
    }

    return () => {
      // Clean up message subscription first
      if (unsubscribe) {
        unsubscribe();
        subscriptionRef.current = null;
      }

      // Remove connection listeners using the same references
      ably.connection.off('connected', handleConnected);
      ably.connection.off('disconnected', handleDisconnected);
      ably.connection.off('failed', handleFailed);

      // Close connection
      ably.close();

      // Clear refs
      ablyRef.current = null;
      channelRef.current = null;
    };
  }, [channelName]); // Only depend on channelName, not onMessage

  return { isConnected, error };
}
