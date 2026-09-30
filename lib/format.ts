const priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}
