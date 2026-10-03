import { afterEach, describe, expect, it, vi } from 'vitest'
import { newId } from './id'

afterEach(() => vi.unstubAllGlobals())

describe('newId', () => {
  it('uses crypto.randomUUID when available', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' } as unknown as Crypto)
    expect(newId()).toBe('test-uuid')
  })

  it('builds a v4 UUID when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => { bytes.fill(0); return bytes } } as unknown as Crypto)
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()))
    expect(ids.size).toBe(100)
  })
})
