import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

describe('prismadb', () => {
  let originalGlobalPrisma: any

  beforeEach(() => {
    // Save original global prisma
    originalGlobalPrisma = (globalThis as any).prisma

    // Clear module cache
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original global prisma
    if (originalGlobalPrisma === undefined) {
      delete (globalThis as any).prisma
    } else {
      (globalThis as any).prisma = originalGlobalPrisma
    }
  })

  it('exports a PrismaClient instance', async () => {
    const prismadb = (await import('@/lib/prismadb')).default

    expect(prismadb).toBeDefined()
    expect(prismadb).toBeInstanceOf(PrismaClient)
  })

  it('uses existing global prisma instance if available', async () => {
    const mockPrisma = new PrismaClient()
    ;(globalThis as any).prisma = mockPrisma

    const prismadb = (await import('@/lib/prismadb')).default

    expect(prismadb).toBe(mockPrisma)
  })

  it('creates new PrismaClient if global prisma does not exist', async () => {
    delete (globalThis as any).prisma

    const prismadb = (await import('@/lib/prismadb')).default

    expect(prismadb).toBeInstanceOf(PrismaClient)
  })

  it('returns same instance on multiple imports when global is set', async () => {
    delete (globalThis as any).prisma

    const prismadb1 = (await import('@/lib/prismadb')).default
    const prismadb2 = (await import('@/lib/prismadb')).default

    expect(prismadb1).toBe(prismadb2)
  })
})