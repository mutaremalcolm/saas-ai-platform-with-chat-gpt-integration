import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Stripe from 'stripe'

// Mock Stripe
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation((apiKey, config) => ({
    apiKey,
    config,
    customers: {},
    subscriptions: {},
    checkout: {}
  }))
  return {
    default: MockStripe
  }
})

describe('stripe', () => {
  const originalEnv = process.env.STRIPE_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.STRIPE_API_KEY = originalEnv
    } else {
      delete process.env.STRIPE_API_KEY
    }
  })

  it('exports a stripe instance', async () => {
    process.env.STRIPE_API_KEY = 'test_api_key_123'
    
    const { stripe } = await import('@/lib/stripe')

    expect(stripe).toBeDefined()
  })

  it('initializes Stripe with API key from environment', async () => {
    process.env.STRIPE_API_KEY = 'sk_test_12345'
    
    const MockStripe = (await import('stripe')).default
    const { stripe } = await import('@/lib/stripe')

    expect(MockStripe).toHaveBeenCalledWith(
      'sk_test_12345',
      expect.objectContaining({
        apiVersion: '2022-11-15',
        typescript: true
      })
    )
  })

  it('configures Stripe with correct API version', async () => {
    process.env.STRIPE_API_KEY = 'test_key'
    
    const MockStripe = (await import('stripe')).default
    await import('@/lib/stripe')

    expect(MockStripe).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        apiVersion: '2022-11-15'
      })
    )
  })

  it('enables TypeScript support', async () => {
    process.env.STRIPE_API_KEY = 'test_key'
    
    const MockStripe = (await import('stripe')).default
    await import('@/lib/stripe')

    expect(MockStripe).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        typescript: true
      })
    )
  })

  it('initializes with complete configuration', async () => {
    process.env.STRIPE_API_KEY = 'sk_test_complete'
    
    const MockStripe = (await import('stripe')).default
    await import('@/lib/stripe')

    expect(MockStripe).toHaveBeenCalledWith(
      'sk_test_complete',
      {
        apiVersion: '2022-11-15',
        typescript: true
      }
    )
  })
})