import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/stripe/route'

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(),
  currentUser: vi.fn()
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

// Create hoisted mocks for Prisma and Stripe
const mockPrismaFindUnique = vi.hoisted(() => vi.fn())
const mockStripeBillingPortalCreate = vi.hoisted(() => vi.fn())
const mockStripeCheckoutCreate = vi.hoisted(() => vi.fn())

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    userSubscription: {
      findUnique: mockPrismaFindUnique
    }
  }
}))

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: mockStripeBillingPortalCreate
      }
    },
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate
      }
    }
  }
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  absoluteUrl: vi.fn((path: string) => `https://example.com${path}`)
}))

import { auth, currentUser } from '@clerk/nextjs'

describe('Stripe API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)
      vi.mocked(currentUser).mockResolvedValue(null)

      const response = await GET() as any

      expect(response.status).toBe(401)
      expect(response.body).toBe('Unauthorised')
    })

    it('returns 401 if userId exists but currentUser is null', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue(null)

      const response = await GET() as any

      expect(response.status).toBe(401)
      expect(response.body).toBe('Unauthorised')
    })

    it('returns 401 if currentUser exists but userId is null', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)

      const response = await GET() as any

      expect(response.status).toBe(401)
      expect(response.body).toBe('Unauthorised')
    })
  })

  describe('Existing subscription', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)
    })

    it('creates billing portal session for existing customer', async () => {
      const mockSubscription = {
        userId: 'user-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_123',
        stripeCurrentPeriodEnd: new Date()
      }

      mockPrismaFindUnique.mockResolvedValue(mockSubscription)
      mockStripeBillingPortalCreate.mockResolvedValue({
        url: 'https://billing.stripe.com/session/portal_123'
      })

      const response = await GET() as any

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })

      expect(mockStripeBillingPortalCreate).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'https://example.com/settings'
      })

      expect(mockStripeCheckoutCreate).not.toHaveBeenCalled()

      const responseBody = JSON.parse(response.body)
      expect(responseBody).toEqual({
        url: 'https://billing.stripe.com/session/portal_123'
      })
    })

    it('skips billing portal if subscription exists but no stripeCustomerId', async () => {
      const mockSubscription = {
        userId: 'user-123',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null
      }

      mockPrismaFindUnique.mockResolvedValue(mockSubscription)
      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/checkout_123'
      })

      const response = await GET() as any

      expect(mockStripeBillingPortalCreate).not.toHaveBeenCalled()
      expect(mockStripeCheckoutCreate).toHaveBeenCalled()

      const responseBody = JSON.parse(response.body)
      expect(responseBody).toEqual({
        url: 'https://checkout.stripe.com/session/checkout_123'
      })
    })
  })

  describe('New subscription', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)
      mockPrismaFindUnique.mockResolvedValue(null)
    })

    it('creates checkout session for new customer', async () => {
      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/checkout_123'
      })

      const response = await GET() as any

      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith({
        success_url: 'https://example.com/settings',
        cancel_url: 'https://example.com/settings',
        payment_method_types: ['card'],
        mode: 'subscription',
        billing_address_collection: 'auto',
        customer_email: 'test@example.com',
        line_items: [
          {
            price_data: {
              currency: 'USD',
              product_data: {
                name: 'Inception Pro',
                description: 'Unlimited AI Generations'
              },
              unit_amount: 2000,
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1
          }
        ],
        metadata: {
          userId: 'user-123'
        }
      })

      expect(mockStripeBillingPortalCreate).not.toHaveBeenCalled()

      const responseBody = JSON.parse(response.body)
      expect(responseBody).toEqual({
        url: 'https://checkout.stripe.com/session/checkout_123'
      })
    })

    it('uses correct customer email from user object', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'newemail@example.com' }]
      } as any)

      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/checkout_456'
      })

      await GET()

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'newemail@example.com'
        })
      )
    })
  })

  describe('Error handling', () => {
    it('returns 500 on auth error', async () => {
      vi.mocked(auth).mockImplementation(() => {
        throw new Error('Auth error')
      })

      const response = await GET() as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('returns 500 on database error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)
      mockPrismaFindUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET() as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('returns 500 on Stripe billing portal error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)
      mockPrismaFindUnique.mockResolvedValue({
        userId: 'user-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_123',
        stripeCurrentPeriodEnd: new Date()
      })
      mockStripeBillingPortalCreate.mockRejectedValue(new Error('Stripe error'))

      const response = await GET() as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('returns 500 on Stripe checkout error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(currentUser).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      } as any)
      mockPrismaFindUnique.mockResolvedValue(null)
      mockStripeCheckoutCreate.mockRejectedValue(new Error('Stripe error'))

      const response = await GET() as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })
  })
})