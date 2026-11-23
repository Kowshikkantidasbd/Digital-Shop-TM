/**
 * Currency and Money Formatting Helper for whole BDT values.
 * Uses the 'en-BD' locale with strictly zero decimal places.
 */

export const ELIGIBLE_REVENUE_STATUSES = ['delivered', 'shipped', 'processing', 'pending'] as const;
export const EXCLUDED_REVENUE_STATUSES = ['cancelled', 'returned', 'refunded'] as const;

export type OrderStatus = typeof ELIGIBLE_REVENUE_STATUSES[number] | typeof EXCLUDED_REVENUE_STATUSES[number] | string;

/**
 * Checks whether an order status counts towards official store revenue.
 * Non-cancelled and non-returned/refunded orders count.
 */
export const isRevenueEligible = (status: string | undefined | null): boolean => {
  if (!status) return false;
  const normalized = status.toLowerCase().trim();
  return !EXCLUDED_REVENUE_STATUSES.includes(normalized as any);
};

/**
 * Formats any amount into a whole BDT integer using the 'en-BD' locale.
 * Always rounds fractions to prevent decimals like "৳1,469.896".
 */
export const formatMoney = (amount: number | string | undefined | null): string => {
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numeric)) return '0';
  const rounded = Math.round(numeric);
  return rounded.toLocaleString('en-BD', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
};

/**
 * Alias for formatMoney for backwards compatibility.
 */
export const formatBDT = formatMoney;

/**
 * Validates whether an order's total is already a clean integer.
 */
export const isIntegerTotal = (total: any): boolean => {
  if (typeof total !== 'number') {
    const num = Number(total);
    return !isNaN(num) && Number.isInteger(num);
  }
  return Number.isInteger(total);
};
