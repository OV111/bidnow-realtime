export function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function parsePrice(input: string) {
  const clean = input.trim().replace(/[\s,$€£]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [whole, fraction = ''] = clean.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function toPriceInput(cents: number) {
  return (cents / 100).toFixed(2);
}
