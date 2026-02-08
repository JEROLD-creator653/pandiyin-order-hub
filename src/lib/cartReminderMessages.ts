/**
 * Professional Cart Reminder Popup Messages
 * Messages appear when user logs in with unpurchased items in cart
 * Supports placeholders: {cartCount}, {userName}
 */

export const CART_REMINDER_MESSAGES = [
  // Premium & Conversational
  "🛒 You have {cartCount} item(s) waiting. Shall we complete your order?",
  "✨ Great selections! {cartCount} item(s) are saved in your cart.",
  "📦 Your curated items are ready. {cartCount} item(s) pending checkout.",
  
  // Friendly Reminders
  "🔔 Welcome back! {cartCount} item(s) still in your cart from last time.",
  "📌 Quick reminder: {cartCount} item(s) are waiting for you in cart.",
  "⭐ Your cart hasn't forgotten. {cartCount} item(s) ready for purchase.",
  
  // Urgency-Based
  "⚡ Don't wait too long. {cartCount} item(s) are still pending in cart.",
  "⏳ Items are popular. {cartCount} item(s) in your cart—checkout now?",
  "🔥 Complete your purchase. {cartCount} item(s) are in your cart.",
  
  // Premium & Minimal
  "💳 One step away. {cartCount} item(s) ready to order.",
  "🚚 Your order is almost ready. {cartCount} item(s) pending.",
  "✅ Everything saved! {cartCount} item(s) in cart—ready when you are.",
  
  // Trust & Security
  "🔒 Secure checkout available. {cartCount} item(s) waiting in your cart.",
  "📍 Your items are reserved. {cartCount} item(s) ready for you.",
  
  // Action-Oriented
  "→ Finish what you started. {cartCount} item(s) in cart waiting.",
  "❯ Your cart is complete. {cartCount} item(s)—time to checkout?",
  "📣 Last chance! {cartCount} item(s) in your cart. Proceed now.",
  
  // Premium Experience
  "🎁 Curated for you. {cartCount} item(s) are in your cart.",
  "⭐ Premium items selected. {cartCount} item(s) ready for checkout.",
  "✨ Your selections are waiting. Complete your order with {cartCount} item(s).",
];

/**
 * Get a random cart reminder message
 * @param cartCount - Number of items in cart
 * @param userName - Optional user name for personalization
 * @returns Formatted message string
 */
export function getCartReminderMessage(
  cartCount: number,
  userName?: string
): string {
  const randomMessage =
    CART_REMINDER_MESSAGES[
      Math.floor(Math.random() * CART_REMINDER_MESSAGES.length)
    ];

  let message = randomMessage.replace("{cartCount}", cartCount.toString());

  if (userName) {
    message = message.replace("{userName}", userName);
  }

  return message;
}

/**
 * Get a specific cart reminder message by index
 * @param index - Message index (0 to CART_REMINDER_MESSAGES.length - 1)
 * @param cartCount - Number of items in cart
 * @param userName - Optional user name for personalization
 * @returns Formatted message string
 */
export function getCartReminderMessageByIndex(
  index: number,
  cartCount: number,
  userName?: string
): string {
  if (index < 0 || index >= CART_REMINDER_MESSAGES.length) {
    return getCartReminderMessage(cartCount, userName);
  }

  let message = CART_REMINDER_MESSAGES[index].replace(
    "{cartCount}",
    cartCount.toString()
  );

  if (userName) {
    message = message.replace("{userName}", userName);
  }

  return message;
}
