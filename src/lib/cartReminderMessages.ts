/**
 * Professional Cart Reminder Popup Messages
 * Messages appear when user logs in with unpurchased items in cart
 * Supports placeholders: {cartCount}, {userName}
 */

export const CART_REMINDER_MESSAGES = [
  // Standard Reminders
  "🛒 Quick reminder: {cartCount} item(s) are still in your cart. Checkout now?",
  "📦 You left {cartCount} item(s) in your cart. Ready to place the order?",
  "💳 Checkout is one step away. {cartCount} item(s) are still in your cart.",
  "✅ Saved for you: {cartCount} item(s) in cart. Complete your order now.",
  "🔒 Secure checkout available. {cartCount} item(s) are ready to purchase.",
  "🎁 Your picks are saved. {cartCount} item(s) are ready for checkout.",
  "⭐ Great choice! {cartCount} item(s) are still in your cart. Proceed to checkout?",
  "🚚 Almost yours! {cartCount} item(s) are ready for order confirmation.",
  "📌 Quick reminder: {cartCount} item(s) are still waiting in your cart.",
  "🔔 Just a reminder: {cartCount} item(s) are pending checkout.",
  
  // Urgency & Scarcity-Based
  "⚡ Don't miss out. {cartCount} item(s) are still waiting in your cart.",
  "⏳ Items in your cart may sell out soon. Checkout {cartCount} item(s) now.",
  "🔥 Limited stock alert. Secure your {cartCount} item(s) before they're gone.",
  "📦 Almost sold out. Complete checkout for your {cartCount} item(s) now.",
  "📣 Stock is running low. Your {cartCount} item(s) are still in the cart.",
  "⭐ Popular items sell fast. Checkout your {cartCount} item(s) now.",
  "⚠ Limited availability. Confirm your {cartCount} item(s) with checkout.",
  "💳 Checkout now before it's gone. {cartCount} item(s) still pending.",
  "🔥 Trending picks in your cart. {cartCount} item(s) are waiting for checkout.",
  "⏱ Don't wait too long. {cartCount} item(s) may sell out anytime.",
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
