/** Formatta un punteggio con separatore decimale italiano (es. 4,3) */
export function formatScore(n: number | string, decimals = 1): string {
  return Number(n).toFixed(decimals).replace('.', ',')
}

/** Formatta una percentuale intera */
export function formatPercent(n: number): string {
  return `${Math.round(n)}%`
}
