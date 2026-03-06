/**
 * Cart Reminder Popup Component
 * Shows when user logs in with items in their cart
 * Features:
 * - Professional, non-intrusive design
 * - Random message selection
 * - Quick action buttons
 * - Smooth animations
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getCartReminderMessage } from '@/lib/cartReminderMessages';

interface CartReminderPopupProps {
  cartCount: number;
  userName?: string;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartReminderPopup({
  cartCount,
  userName,
  onClose,
  onCheckout,
}: CartReminderPopupProps) {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Generate message only on mount
    const reminderMessage = getCartReminderMessage(cartCount, userName);
    setMessage(reminderMessage);
  }, [cartCount, userName]);

  const handleCheckout = () => {
    onCheckout();
    navigate('/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed z-50 md:top-20 md:right-6 md:max-w-md md:left-auto md:bottom-auto md:translate-x-0 bottom-20 left-3 right-3"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Compact layout */}
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Cart Reminder</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-3 md:px-6 md:pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 h-8 text-xs md:text-sm rounded-full"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleCheckout}
            className="flex-1 h-8 text-xs md:text-sm bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Checkout
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
