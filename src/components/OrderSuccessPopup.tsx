import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface OrderSuccessPopupProps {
  totalSaved: number;
  orderNumber: string;
  orderId: string;
  onClose: () => void;
}

export default function OrderSuccessPopup({
  totalSaved,
  orderNumber,
  orderId,
  onClose,
}: OrderSuccessPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti-like decoration background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute top-10 right-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <CheckCircle className="h-20 w-20 text-green-500" strokeWidth={1.5} />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0"
            >
              <CheckCircle className="h-20 w-20 text-green-400 opacity-20" strokeWidth={1.5} />
            </motion.div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Order Placed Successfully! 🎉
        </motion.h2>

        {/* Order Number */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-600 mb-6"
        >
          Order #{orderNumber}
        </motion.p>

        {/* Savings Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6"
        >
          <p className="text-gray-700 text-sm mb-1">You saved on this order</p>
          <p className="text-3xl font-bold text-green-700">₹{totalSaved.toFixed(0)}</p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-600 mb-8"
        >
          Thank you for shopping with us! Your order will be delivered soon.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={onClose}
            asChild
          >
            <Link to="/products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          <Button
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            onClick={onClose}
            asChild
          >
            <Link to={`/order-confirmation/${orderId}`}>
              View Order
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {/* Close hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-gray-400 mt-6"
        >
          Closes automatically in 5 seconds...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
