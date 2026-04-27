// Hook for fetching and subscribing to open orders
import { useState, useEffect, useRef } from 'react';
import { useAblyClient } from './useAblyClient';
import { useAuth } from './useAuth';

export interface OpenOrder {
  id: string;
  symbol: string;
  type: string;
  side: string;
  price: number;
  quantity: number;
  filled: number;
  status: string;
  created_at: string;
}

interface OpenOrdersData {
  orders: OpenOrder[];
  loading: boolean;
  error: string | null;
}

export function useOpenOrders(userId?: string) {
  const [data, setData] = useState<OpenOrdersData>({
    orders: [],
    loading: true,
    error: null,
  });

  const { channel } = useAblyClient();
  const { user, isAuthenticated } = useAuth();
  const channelRef = useRef<any>(null);
  const effectiveUserId = userId || user?.id;
  const channelInitializedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to load before showing error
    if (!isAuthenticated && !effectiveUserId) {
      // Still loading auth state, keep loading true
      return;
    }

    if (!effectiveUserId) {
      setData({ orders: [], loading: false, error: 'User not authenticated' });
      return;
    }

    let mounted = true;

    // Initial fetch
    fetchOpenOrders();

    // Subscribe to Ably channel for real-time updates
    if (channel && !channelInitializedRef.current) {
      const channelName = `orders:${effectiveUserId}`;
      const ablyChannel = channel(channelName);

      if (ablyChannel) {
        channelRef.current = ablyChannel;
        channelInitializedRef.current = true;

        channelRef.current.subscribe('update', (message: any) => {
          if (!mounted) return;

          const orderUpdate = message.data;

          setData(prev => {
            // Find existing order
            const existingIndex = prev.orders.findIndex(o => o.id === orderUpdate.id);

            if (existingIndex >= 0) {
              // Update existing order
              const updatedOrders = [...prev.orders];

              // If order is no longer open, remove it
              if (orderUpdate.status !== 'OPEN' && orderUpdate.status !== 'PARTIAL' && orderUpdate.status !== 'PARTIALLY_FILLED') {
                updatedOrders.splice(existingIndex, 1);
              } else {
                updatedOrders[existingIndex] = { ...updatedOrders[existingIndex], ...orderUpdate };
              }

              return { ...prev, orders: updatedOrders };
            } else if (orderUpdate.status === 'OPEN' || orderUpdate.status === 'PARTIAL' || orderUpdate.status === 'PARTIALLY_FILLED') {
              // Add new open order
              return { ...prev, orders: [orderUpdate, ...prev.orders] };
            }

            return prev;
          });
        });
      }
    }

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
        channelInitializedRef.current = false;
      }
    };
  }, [effectiveUserId]);

  const fetchOpenOrders = async () => {
    if (!effectiveUserId) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/trading/orders/open`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch open orders');

      const orders = await response.json();

      setData({
        orders: orders || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching open orders:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load open orders',
      }));
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/trading/orders/${orderId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) throw new Error('Failed to cancel order');

      // Optimistically remove from list
      setData(prev => ({
        ...prev,
        orders: prev.orders.filter(o => o.id !== orderId),
      }));

      return true;
    } catch (err) {
      console.error('Error cancelling order:', err);
      return false;
    }
  };

  return { ...data, cancelOrder, refresh: fetchOpenOrders };
}
