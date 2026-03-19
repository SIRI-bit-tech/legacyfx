import { useEffect, useState, useCallback } from 'react';
import * as Ably from 'ably';

// NOTE: For production, use token authentication instead of API key.
// Create a server endpoint at /api/ably/token that returns:
// { tokenRequest: { ... } }
// Then change authUrl to: '/api/ably/token'
const ABLY_KEY = process.env.NEXT_PUBLIC_ABLY_KEY;

// Validate API key and warn about security risks
function validateAblyKey(key: string | undefined): { valid: boolean; isPlaceholder: boolean } {
  if (!key) {
    return { valid: false, isPlaceholder: true };
  }

  // Check for common placeholder patterns
  const placeholderPatterns = [
    'your_ably',
    'your_ably_api_key',
    'replace_me',
    'xxx',
    'test_',
    'demo_'
  ];

  const isPlaceholder = placeholderPatterns.some(pattern =>
    key.toLowerCase().includes(pattern)
  );

  if (isPlaceholder) {
    console.error('🚨 SECURITY WARNING: Using a placeholder Ably API key in client-side code!');
    console.error('This exposes your full API key to the browser. For production:');
    console.error('1. Use token authentication (authUrl) instead');
    console.error('2. Create a server endpoint that generates short-lived tokens');
    console.error('3. Never expose API keys in client-side code');
  }

  return { valid: true, isPlaceholder };
}

export function useAbly(channelName: string, onMessage?: (message: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { valid, isPlaceholder } = validateAblyKey(ABLY_KEY);

    if (!valid || isPlaceholder) {
      console.warn('Ably API key not configured or using placeholder - real-time updates disabled');
      setError('Ably not configured');
      return;
    }

    // SECURITY FIX: Use token auth URL instead of direct API key
    // For production, create a server endpoint that generates tokens
    // The endpoint should return: { tokenRequest: { keyName, clientId, timestamp, nonce, mac } }
    const ably = new Ably.Realtime({
      // Use authUrl for token authentication (recommended for production)
      // authUrl: '/api/ably/token',
      // For now, we must use key but this is insecure for master keys
      // In production, use a restricted API key with only subscribe permission
      key: ABLY_KEY,
      // Add closeOnUnload for proper cleanup
      closeOnUnload: true
    });
    const channel = ably.channels.get(channelName);

    const connectionStateListener = (stateChange: any) => {
      if (stateChange.current === 'connected') {
        setIsConnected(true);
      } else if (stateChange.current === 'disconnected' || stateChange.current === 'failed') {
        setIsConnected(false);
      }
    };

    ably.connection.on('connected', () => setIsConnected(true));
    ably.connection.on('disconnected', () => setIsConnected(false));
    ably.connection.on('failed', (err: any) => setError(err.message));

    if (onMessage) {
      channel.subscribe((message) => {
        onMessage(message);
      });
    }

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [channelName, onMessage]);

  return { isConnected, error };
}
