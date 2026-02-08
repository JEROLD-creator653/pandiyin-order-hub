import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import { CartReminderPopup } from '@/components/CartReminderPopup';
import { useCartReminder } from '@/hooks/useCartReminder';

export default function CustomerLayout() {
  const {
    showReminder,
    cartCount,
    userName,
    closeReminder,
    handleCheckout,
  } = useCartReminder();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />

      {/* Cart Reminder Popup */}
      <AnimatePresence>
        {showReminder && (
          <CartReminderPopup
            cartCount={cartCount}
            userName={userName}
            onClose={closeReminder}
            onCheckout={handleCheckout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
