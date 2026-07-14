/**
 * Formats a price with the appropriate currency symbol.
 * @param {number} price - The price to format.
 * @param {string} currencyCode - The ISO 4217 currency code (e.g., 'USD', 'EUR').
 * @returns {string} The formatted price string (e.g., '$49.00').
 */
export const formatPrice = (price, currencyCode = 'USD') => {
  if (price === null || price === undefined || isNaN(price)) {
    // Return a default for free courses or invalid prices
    return currencyCode === 'USD' ? '$0.00' : `0.00 ${currencyCode}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  } catch (error) {
    // Fallback for invalid currency codes
    return `$${Number(price).toFixed(2)}`;
  }
};