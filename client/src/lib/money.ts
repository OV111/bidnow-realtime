
export function formatPrice(cents: number, currency = 'USD', locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function parseAmountToCents(input: string): number | null {
  const clean = input.trim().replace(/[\s,$€£]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [whole, fraction = ''] = clean.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Used by the live screen
export function formatCents(cents: number):
  return formatPrice(cents, 'USD', 'en-US');
}

export function dollarsToCents(dollars: num
  return Math.round(dollars * 100);
}