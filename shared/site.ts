export const productionOrigin = 'https://creda.ng'

export function isProductionHost(hostname: string): boolean {
  return hostname === 'creda.ng' || hostname === 'www.creda.ng'
}
