// Hook for managing and searching users in the admin panel
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminUsersApi } from '@/lib/adminApi';

export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', status: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      
      const res = await adminUsersApi.list(params.toString());
      setUsers(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateStatus = async (userId: string, status: string) => {
    try {
      await adminUsersApi.updateStatus(userId, status);
      await fetchUsers();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to update user status');
      return false;
    }
  };

  return { users, loading, error, filters, setFilters, updateStatus, refresh: fetchUsers };
}
