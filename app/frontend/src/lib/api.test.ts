import { describe, expect, it } from 'vitest'
import { api } from './api'

describe('api client', () => {
  it('exposes the expected endpoints', () => {
    expect(typeof api.stats).toBe('function')
    expect(typeof api.search).toBe('function')
    expect(typeof api.paper).toBe('function')
    expect(typeof api.entity).toBe('function')
    expect(typeof api.subgraph).toBe('function')
  })
})
