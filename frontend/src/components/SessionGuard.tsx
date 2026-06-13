'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { api } from '@/lib/api';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 1 * 60 * 1000; // 1 minute before timeout
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function SessionGuard() {
  const { isAuthenticated, logout } = useAuthContext();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const lastActivityTime = useRef(Date.now());
  const lastPingTime = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    lastActivityTime.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setTimeLeft(60);
    }
  }, [showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => resetTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Main interval to check idle time and ping server
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      const idleTime = now - lastActivityTime.current;
      const timeSincePing = now - lastPingTime.current;

      if (idleTime >= IDLE_TIMEOUT_MS) {
        logout();
      } else if (idleTime >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        if (!showWarning) {
          setShowWarning(true);
          setTimeLeft(Math.ceil((IDLE_TIMEOUT_MS - idleTime) / 1000));
        }
      } else {
        // Keep the backend session alive by periodically pinging IF user is active
        if (timeSincePing >= PING_INTERVAL_MS) {
          lastPingTime.current = now;
          try {
            // Force token refresh or session check to keep backend aware we're alive
            await api.get('/auth/session');
          } catch (e) {
            // Error handled globally by interceptor
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, logout, resetTimer, showWarning]);

  useEffect(() => {
    if (showWarning) {
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, logout]);

  if (!showWarning || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="w-16 h-16 bg-color-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="pi pi-exclamation-triangle text-color-warning text-3xl"></i>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Session Expiring</h2>
        <p className="text-text-secondary text-sm mb-6">
          You have been inactive for a while. For your security, you will be automatically logged out in:
        </p>
        <div className="text-4xl font-black text-color-primary font-mono mb-6">
          {timeLeft}s
        </div>
        <button 
          onClick={resetTimer}
          className="w-full py-3 bg-color-primary text-bg-primary font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
}
