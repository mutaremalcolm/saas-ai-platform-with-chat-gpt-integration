import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkSubscription } from '@/lib/subscription'

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn()
}))

// Mock Prisma client
vi.mock('@/lib/prismadb', () => ({
  default: {
    userSubscription: {
      findUnique: vi.fn()
    }
  }
}))

import { auth } from '@clerk/nextjs'
import prismadb from '@/lib/prismadb'

describe('checkSubscription', () => {
  const DAY_IN_MS = 86_400_000
  let originalDateNow: typeof Date.now

  beforeEach(() => {
    vi.clearAllMocks()
    originalDateNow = Date.now
    // Mock Date.now to return a consistent timestamp
    Date.now = vi.fn(() => new Date('2024-01-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    Date.now = originalDateNow
  })

  it('returns false if userId is not present', async () => {
    vi.mocked(auth).mockReturnValue({ userId: null } as any)

    const result = await checkSubscription()

    expect(result).toBe(false)
    expect(prismadb.userSubscription.findUnique).not.toHaveBeenCalled()
  })

  it('returns false if userSubscription does not exist', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue(null)

    const result = await checkSubscription()

    expect(result).toBe(false)
    expect(prismadb.userSubscription.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripeCustomerId: true,
        stripePriceId: true
      }
    })
  })

  it('returns false if subscription has no stripePriceId', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_1',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: new Date('2024-02-01T12:00:00Z'),
      stripeCustomerId: 'cus_123',
      stripePriceId: null
    })

    const result = await checkSubscription()

    expect(result).toBe(false)
  })

  it('returns false if subscription is expired (beyond grace period)', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    // Subscription ended 2 days ago (beyond 1 day grace period)
    const expiredDate = new Date('2024-01-13T12:00:00Z')
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_2',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: expiredDate,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(false)
  })

  it('returns true if subscription is valid (future date)', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    // Subscription ends in the future
    const futureDate = new Date('2024-02-01T12:00:00Z')
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_3',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: futureDate,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(true)
  })

  it('returns true if subscription is within grace period (1 day)', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    // Subscription ended today (within 1 day grace period)
    const todayDate = new Date('2024-01-15T11:00:00Z')
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_4',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: todayDate,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(true)
  })

  it('returns false if subscription just ended (at boundary)', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    // Set current time
    const currentTime = new Date('2024-01-15T12:00:00Z').getTime()
    Date.now = vi.fn(() => currentTime)
    
    // Subscription ends exactly 1 day ago (at the boundary)
    const boundaryDate = new Date(currentTime - DAY_IN_MS)
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_5',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: boundaryDate,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(false)
  })

  it('returns false if subscription has no stripeCurrentPeriodEnd', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_6',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: null,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(false)
  })

  it('queries database with correct parameters', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-456' } as any)
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue(null)

    await checkSubscription()

    expect(prismadb.userSubscription.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-456' },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        stripeCustomerId: true,
        stripePriceId: true
      }
    })
  })

  it('returns true for subscription ending in 10 days', async () => {
    vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    const futureDate = new Date('2024-01-25T12:00:00Z')
    vi.mocked(prismadb.userSubscription.findUnique).mockResolvedValue({
      id: 'sub_record_7',
      userId: 'user-123',
      stripeSubscriptionId: 'sub_123',
      stripeCurrentPeriodEnd: futureDate,
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_123'
    })

    const result = await checkSubscription()

    expect(result).toBe(true)
  })
})