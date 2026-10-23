/** Accept the North American country code supplied by paste or phone autofill. */
export function formatSellerPhone(value: string): string {
  const raw = value.replace(/\D/g, '')
  const digits = (raw.length === 11 && raw.startsWith('1') ? raw.slice(1) : raw).slice(0, 10)
  if (digits.length >= 7) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length >= 4) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return digits ? `(${digits}` : ''
}
