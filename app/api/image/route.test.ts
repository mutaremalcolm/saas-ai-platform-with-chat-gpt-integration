import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create hoisted mock for OpenAI that always has apiKey
const mockCreateImage = vi.hoisted(() => vi.fn())
const mockConfiguration = vi.hoisted(() => ({
  apiKey: 'test_openai_key' // Always return a valid key in the mock
}))

// Mock OpenAI BEFORE setting env and importing route
vi.mock('openai', () => {
  class MockConfiguration {
    apiKey: string | undefined
    constructor(config: { apiKey?: string }) {
      // In the mock, we always set apiKey to make tests work
      // unless explicitly testing the missing key scenario
      this.apiKey = config.apiKey || 'test_openai_key'
    }
  }
  
  class MockOpenAIApi {
    createImage = mockCreateImage
    constructor(config: any) {}
  }
  
  return {
    Configuration: MockConfiguration,
    OpenAIApi: MockOpenAIApi
  }
})

// Set environment variable
process.env.OPENAI_API_KEY = 'test_openai_key'

import { POST } from '@/app/api/image/route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
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
    
    static json(data: any) {
      return {
        data,
        status: 200,
        _isNextResponseJson: true
      }
    }
  }
  
  return { NextResponse: MockNextResponse }
})

// Mock API limit functions
vi.mock('@/lib/api-limit', () => ({
  increaseAPILimit: vi.fn(),
  checkApiLimit: vi.fn()
}))

// Mock subscription check
vi.mock('@/lib/subscription', () => ({
  checkSubscription: vi.fn()
}))

import { auth } from '@clerk/nextjs/server'
import { increaseAPILimit, checkApiLimit } from '@/lib/api-limit'
import { checkSubscription } from '@/lib/subscription'

describe('Image API Route', () => {
  const mockRequest = (body: any) => ({
    json: vi.fn().mockResolvedValue(body)
  }) as unknown as Request

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)
      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(response.status).toBe(401)
      expect(response.body).toBe('Unauthorized')
    })
  })

  describe('Configuration', () => {
    it('returns 500 if OpenAI API key is not configured', async () => {
      // This test requires special handling - we need to reimport with no API key
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      // Reset modules and reimport to get new Configuration instance
      vi.resetModules()
      
      // Re-mock with undefined apiKey
      vi.doMock('openai', () => {
        const mockCreateImageLocal = vi.fn()
        class MockConfiguration {
          apiKey: string | undefined
          constructor(config: { apiKey?: string }) {
            this.apiKey = config.apiKey // Will be undefined
          }
        }
        
        class MockOpenAIApi {
          createImage = mockCreateImageLocal
          constructor(config: any) {}
        }
        
        return {
          Configuration: MockConfiguration,
          OpenAIApi: MockOpenAIApi
        }
      })
      
      const { POST: POST_NO_KEY } = await import('@/app/api/image/route')
      
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST_NO_KEY(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Open API Key not configured')
      
      // Restore
      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    })

    it('returns 400 if prompt is missing', async () => {
      const req = mockRequest({})

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Prompt is required')
    })

    it('returns 400 if prompt is empty string', async () => {
      const req = mockRequest({ prompt: '' })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Prompt is required')
    })

    it('returns 400 if amount is explicitly set to 0', async () => {
      const req = mockRequest({ prompt: 'test prompt', amount: 0 })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Amount is required')
    })

    it('returns 400 if resolution is empty string', async () => {
      const req = mockRequest({ prompt: 'test prompt', resolution: '' })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Resolution is required')
    })

    it('uses default values for amount and resolution when not provided', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({ prompt: 'test prompt' })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'test prompt',
        n: 1,
        size: '512x512'
      })
    })
  })

  describe('Free trial and subscription checks', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    })

    it('returns 403 if free trial expired and user is not pro', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(false)

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(response.status).toBe(403)
      expect(response.body).toBe('Free trial has expired.')
      expect(mockCreateImage).not.toHaveBeenCalled()
    })

    it('allows request if user has free trial remaining', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockCreateImage).toHaveBeenCalled()
      expect(response.data).toEqual([{ url: 'https://example.com/image.png' }])
    })

    it('allows request if user is pro even without free trial', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(true)
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockCreateImage).toHaveBeenCalled()
      expect(response.data).toEqual([{ url: 'https://example.com/image.png' }])
    })
  })

  describe('OpenAI API call', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('calls OpenAI with correct default parameters', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({ prompt: 'a cat playing piano' })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'a cat playing piano',
        n: 1,
        size: '512x512'
      })
    })

    it('calls OpenAI with custom amount parameter', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          data: [
            { url: 'https://example.com/image1.png' },
            { url: 'https://example.com/image2.png' }
          ]
        }
      })

      const req = mockRequest({
        prompt: 'test prompt',
        amount: 2
      })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'test prompt',
        n: 2,
        size: '512x512'
      })
    })

    it('calls OpenAI with custom resolution parameter', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({
        prompt: 'test prompt',
        resolution: '1024x1024'
      })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'test prompt',
        n: 1,
        size: '1024x1024'
      })
    })

    it('calls OpenAI with all custom parameters', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          data: [
            { url: 'https://example.com/image1.png' },
            { url: 'https://example.com/image2.png' },
            { url: 'https://example.com/image3.png' }
          ]
        }
      })

      const req = mockRequest({
        prompt: 'test prompt',
        amount: 3,
        resolution: '256x256'
      })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'test prompt',
        n: 3,
        size: '256x256'
      })
    })

    it('parses amount as integer when passed as string', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })

      const req = mockRequest({
        prompt: 'test prompt',
        amount: '2'
      })

      await POST(req)

      expect(mockCreateImage).toHaveBeenCalledWith({
        prompt: 'test prompt',
        n: 2,
        size: '512x512'
      })
    })
  })

  describe('Response handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('returns image data from OpenAI response', async () => {
      const mockImageData = [
        { url: 'https://example.com/image1.png' },
        { url: 'https://example.com/image2.png' }
      ]

      mockCreateImage.mockResolvedValue({
        data: {
          data: mockImageData
        }
      })

      const req = mockRequest({ prompt: 'test prompt', amount: 2 })
      const response = await POST(req) as any

      expect(response.data).toEqual(mockImageData)
    })
  })

  describe('API limit management', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      mockCreateImage.mockResolvedValue({
        data: {
          data: [{ url: 'https://example.com/image.png' }]
        }
      })
    })

    it('increases API limit for non-pro users', async () => {
      vi.mocked(checkSubscription).mockResolvedValue(false)

      const req = mockRequest({ prompt: 'test prompt' })
      await POST(req)

      expect(increaseAPILimit).toHaveBeenCalledTimes(1)
    })

    it('does not increase API limit for pro users', async () => {
      vi.mocked(checkSubscription).mockResolvedValue(true)

      const req = mockRequest({ prompt: 'test prompt' })
      await POST(req)

      expect(increaseAPILimit).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('returns 500 on internal error', async () => {
      vi.mocked(auth).mockImplementation(() => {
        throw new Error('Internal error')
      })

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('handles OpenAI API error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateImage.mockRejectedValue(new Error('OpenAI API error'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('handles checkApiLimit error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockRejectedValue(new Error('Database error'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })
  })
})