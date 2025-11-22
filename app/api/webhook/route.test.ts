import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhook/route'

// Create hoisted mocks
const mockConstructEvent = vi.hoisted(() => vi.fn())
const mockRetrieveSubscription = vi.hoisted(() => vi.fn())
const mockPrismaCreate = vi.hoisted(() => vi.fn())
const mockPrismaUpdate = vi.hoisted(() => vi.fn())
const mockHeadersGet = vi.hoisted(() => vi.fn())

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: mockHeadersGet
  }))
}))

// Mock Next.js server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: any
    status: number
    
    constructor(body: any, init?: { status?: number }) {
      this.body = body
      this.status = init?.status || 200
    }
  }
  
  return { NextResponse: MockNextResponse }
})

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription
    }
  }
}))

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    userSubscription: {
      create: mockPrismaCreate,
      update: mockPrismaUpdate
    }
  }
}))

describe('Stripe Webhook API Route', () => {
  const mockRequest = (body: string) => ({
    text: vi.fn().mockResolvedValue(body)
  }) as unknown as Request

  const mockSubscription = {
    id: 'sub_123',
    customer: 'cus_123',
    items: {
      data: [
        {
          price: {
            id: 'price_123'
          }
        }
      ]
    },
    current_period_end: 1735689600 // Jan 1, 2025
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    mockHeadersGet.mockReturnValue('test_signature')
  })

  describe('Webhook signature verification', () => {
    it('returns 400 if signature is invalid', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const req = mockRequest('test body')
      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Webhook Error: Invalid signature')
    })

    it('verifies webhook signature with correct parameters', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            subscription: 'sub_123',
            metadata: { userId: 'user_123' }
          }
        }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)
      mockPrismaCreate.mockResolvedValue({})

      const requestBody = 'webhook_payload'
      const req = mockRequest(requestBody)

      await POST(req)

      expect(mockConstructEvent).toHaveBeenCalledWith(
        requestBody,
        'test_signature',
        'whsec_test_secret'
      )
    })

    it('returns 400 if webhook secret is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No webhook secret')
      })

      const req = mockRequest('test body')
      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toContain('Webhook Error')
    })
  })

  describe('checkout.session.completed event', () => {
    it('creates new subscription in database', async () => {
      const sessionData = {
        subscription: 'sub_123',
        metadata: { userId: 'user_123' }
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)
      mockPrismaCreate.mockResolvedValue({})

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(mockRetrieveSubscription).toHaveBeenCalledWith('sub_123')
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          stripePriceId: 'price_123',
          stripeCurrentPeriodEnd: new Date(1735689600 * 1000)
        }
      })
      expect(response.status).toBe(200)
    })

    it('returns 400 if userId is missing in metadata', async () => {
      const sessionData = {
        subscription: 'sub_123',
        metadata: {}
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('User is is required')
      expect(mockPrismaCreate).not.toHaveBeenCalled()
    })

    it('returns 400 if metadata is missing', async () => {
      const sessionData = {
        subscription: 'sub_123'
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('User is is required')
      expect(mockPrismaCreate).not.toHaveBeenCalled()
    })

    it('handles database creation errors', async () => {
      const sessionData = {
        subscription: 'sub_123',
        metadata: { userId: 'user_123' }
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)
      mockPrismaCreate.mockRejectedValue(new Error('Database error'))

      const req = mockRequest('webhook_payload')

      // Should throw the error since there's no try-catch for Prisma operations
      await expect(POST(req)).rejects.toThrow('Database error')
    })
  })

  describe('invoice.payment_succeeded event', () => {
    it('updates existing subscription in database', async () => {
      const sessionData = {
        subscription: 'sub_123'
      }

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)
      mockPrismaUpdate.mockResolvedValue({})

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(mockRetrieveSubscription).toHaveBeenCalledWith('sub_123')
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'sub_123'
        },
        data: {
          stripePriceId: 'price_123',
          stripeCurrentPeriodEnd: new Date(1735689600 * 1000)
        }
      })
      expect(response.status).toBe(200)
    })

    it('handles subscription with different price', async () => {
      const updatedSubscription = {
        ...mockSubscription,
        items: {
          data: [
            {
              price: {
                id: 'price_456_new'
              }
            }
          ]
        },
        current_period_end: 1738368000 // Feb 1, 2025
      }

      const sessionData = {
        subscription: 'sub_123'
      }

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(updatedSubscription)
      mockPrismaUpdate.mockResolvedValue({})

      const req = mockRequest('webhook_payload')
      await POST(req)

      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'sub_123'
        },
        data: {
          stripePriceId: 'price_456_new',
          stripeCurrentPeriodEnd: new Date(1738368000 * 1000)
        }
      })
    })

    it('handles database update errors', async () => {
      const sessionData = {
        subscription: 'sub_123'
      }

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(mockSubscription)
      mockPrismaUpdate.mockRejectedValue(new Error('Update failed'))

      const req = mockRequest('webhook_payload')

      await expect(POST(req)).rejects.toThrow('Update failed')
    })
  })

  describe('Other event types', () => {
    it('returns 200 for unhandled event types', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.created',
        data: { object: {} }
      })

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(response.status).toBe(200)
      expect(mockPrismaCreate).not.toHaveBeenCalled()
      expect(mockPrismaUpdate).not.toHaveBeenCalled()
    })

    it('returns 200 for customer.subscription.updated event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: {} }
      })

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(response.status).toBe(200)
      expect(mockPrismaCreate).not.toHaveBeenCalled()
      expect(mockPrismaUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Stripe API errors', () => {
    it('handles subscription retrieval error for checkout event', async () => {
      const sessionData = {
        subscription: 'sub_123',
        metadata: { userId: 'user_123' }
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockRejectedValue(new Error('Subscription not found'))

      const req = mockRequest('webhook_payload')

      await expect(POST(req)).rejects.toThrow('Subscription not found')
    })

    it('handles subscription retrieval error for invoice event', async () => {
      const sessionData = {
        subscription: 'sub_123'
      }

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockRejectedValue(new Error('Subscription not found'))

      const req = mockRequest('webhook_payload')

      await expect(POST(req)).rejects.toThrow('Subscription not found')
    })
  })

  describe('Edge cases', () => {
    it('handles missing Stripe signature header', async () => {
      mockHeadersGet.mockReturnValue(null)
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signature provided')
      })

      const req = mockRequest('webhook_payload')
      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toContain('Webhook Error')
    })

    it('correctly converts Unix timestamp to Date', async () => {
      const sessionData = {
        subscription: 'sub_123',
        metadata: { userId: 'user_123' }
      }

      const subscriptionWithTimestamp = {
        ...mockSubscription,
        current_period_end: 1609459200 // Jan 1, 2021, 00:00:00 UTC
      }

      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: sessionData }
      })
      mockRetrieveSubscription.mockResolvedValue(subscriptionWithTimestamp)
      mockPrismaCreate.mockResolvedValue({})

      const req = mockRequest('webhook_payload')
      await POST(req)

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stripeCurrentPeriodEnd: new Date(1609459200 * 1000)
        })
      })
    })
  })
})