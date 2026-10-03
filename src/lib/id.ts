let fallbackCounter = 0

export function newId(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') {
    try { return cryptoApi.randomUUID() } catch { /* fall through to byte generation */ }
  }
  if (typeof cryptoApi?.getRandomValues === 'function') {
    try {
      const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    } catch { /* fall through when crypto APIs are unavailable */ }
  }
  fallbackCounter += 1
  const seed = `${Date.now().toString(16)}${fallbackCounter.toString(16)}${Math.random().toString(16).slice(2)}`
  const hex = Array.from({ length: 32 }, (_, index) => seed[index % seed.length] ?? '0')
  hex[12] = '4'
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
