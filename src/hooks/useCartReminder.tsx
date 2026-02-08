/**
 * useCartReminder Hook
 * Manages cart reminder popup logic after user login
 * Features:
 * - Shows popup only once per session
 * - Only shows if user has items in cart
 * - Respects user dismissal
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useCart } from './useCart';

interface UseCartReminderReturn {
  showReminder: boolean;
  cartCount: number;
  userName?: string;
  closeReminder: () => void;
  handleCheckout: () => void;
}

const REMINDER_SHOWN_KEY = 'cart_reminder_shown_session';

export function useCartReminder(): UseCartReminderReturn {
  const { user, loading: authLoading } = useAuth();
  const { items: cartItems } = useCart();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderShown, setReminderShown] = useState(false);

  // Check if reminder was already shown in this session
  useEffect(() => {
    const wasShown = sessionStorage.getItem(REMINDER_SHOWN_KEY) === 'true';
    setReminderShown(wasShown);
  }, []);

  // Show reminder when user logs in with cart items
  useEffect(() => {
    if (authLoading) return;

    // Only show if:
    // 1. User is authenticated
    // 2. User has items in cart
    // 3. Reminder hasn't been shown in this session
    if (user && cartItems && cartItems.length > 0 && !reminderShown) {
      setShowReminder(true);
      sessionStorage.setItem(REMINDER_SHOWN_KEY, 'true');
      setReminderShown(true);
    }
  }, [user, cartItems, authLoading, reminderShown]);

  const closeReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  const handleCheckout = useCallback(() => {
    setShowReminder(false);
  }, []);

  return {
    showReminder,
    cartCount: cartItems ? cartItems.length : 0,
    userName: user?.email?.split('@')[0] || user?.user_metadata?.full_name,
    closeReminder,
    handleCheckout,
  };
}
