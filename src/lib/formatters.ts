export const formatPrice = (price: number | string) => {
  return `Rs. ${Number(price).toFixed(2)}`;
};