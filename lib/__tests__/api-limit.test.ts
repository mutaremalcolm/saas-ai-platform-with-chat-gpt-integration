import { describe, it, expect, vi, beforeEach } from 'vitest'
import { increaseAPILimit, checkApiLimit, getApiLimitCount } from '@/lib/api-limit'

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn()
}))

// Mock Prisma client
vi.mock('@/lib/prismadb', () => ({
  default: {
    userApiLimit: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
}))

// Mock constants
vi.mock('@/constants', () => ({
  MAX_FREE_COUNTS: 5
}))

import { auth } from '@clerk/nextjs'
import prismadb from '@/lib/prismadb'

describe('api-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('increaseAPILimit', () => {
    it('returns early if userId is not present', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)

      await increaseAPILimit()

      expect(prismadb.userApiLimit.findUnique).not.toHaveBeenCalled()
    })

    it('creates new userApiLimit if none exists', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue(null)
      vi.mocked(prismadb.userApiLimit.create).mockResolvedValue({
        id: '1',
        userId: 'user-123',
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await increaseAPILimit()

      expect(prismadb.userApiLimit.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
      expect(prismadb.userApiLimit.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', count: 1 }
      })
      expect(prismadb.userApiLimit.update).not.toHaveBeenCalled()
    })

    it('updates existing userApiLimit by incrementing count', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-456' } as any)
      const existingLimit = {
        id: '2',
        userId: 'user-456',
        count: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue(existingLimit)
      vi.mocked(prismadb.userApiLimit.update).mockResolvedValue({
        ...existingLimit,
        count: 4
      })

      await increaseAPILimit()

      expect(prismadb.userApiLimit.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-456' }
      })
      expect(prismadb.userApiLimit.update).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        data: { count: 4 }
      })
      expect(prismadb.userApiLimit.create).not.toHaveBeenCalled()
    })
  })

  describe('checkApiLimit', () => {
    it('returns false if userId is not present', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)

      const result = await checkApiLimit()

      expect(result).toBe(false)
      expect(prismadb.userApiLimit.findUnique).not.toHaveBeenCalled()
    })

    it('returns true if userApiLimit does not exist', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue(null)

      const result = await checkApiLimit()

      expect(result).toBe(true)
      expect(prismadb.userApiLimit.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })

    it('returns true if count is below MAX_FREE_COUNTS', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '1',
        userId: 'user-123',
        count: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await checkApiLimit()

      expect(result).toBe(true)
    })

    it('returns true if count equals MAX_FREE_COUNTS - 1', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '1',
        userId: 'user-123',
        count: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await checkApiLimit()

      expect(result).toBe(true)
    })

    it('returns false if count equals MAX_FREE_COUNTS', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '1',
        userId: 'user-123',
        count: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await checkApiLimit()

      expect(result).toBe(false)
    })

    it('returns false if count exceeds MAX_FREE_COUNTS', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '1',
        userId: 'user-123',
        count: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await checkApiLimit()

      expect(result).toBe(false)
    })
  })

  describe('getApiLimitCount', () => {
    it('returns 0 if userId is not present', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)

      const result = await getApiLimitCount()

      expect(result).toBe(0)
      expect(prismadb.userApiLimit.findUnique).not.toHaveBeenCalled()
    })

    it('returns 0 if userApiLimit does not exist', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue(null)

      const result = await getApiLimitCount()

      expect(result).toBe(0)
      expect(prismadb.userApiLimit.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })

    it('returns the count if userApiLimit exists', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-456' } as any)
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '2',
        userId: 'user-456',
        count: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await getApiLimitCount()

      expect(result).toBe(7)
    })

    it('returns correct count for different values', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-789' } as any)
      
      // Test count = 0
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '3',
        userId: 'user-789',
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      let result = await getApiLimitCount()
      expect(result).toBe(0)

      // Test count = 5
      vi.mocked(prismadb.userApiLimit.findUnique).mockResolvedValue({
        id: '3',
        userId: 'user-789',
        count: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      result = await getApiLimitCount()
      expect(result).toBe(5)
    })
  })
})