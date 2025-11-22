import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/video/route'

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
    
    static json(data: any, init?: { status?: number }) {
      return {
        data,
        status: init?.status || 200,
        _isNextResponseJson: true
      }
    }
  }
  
  return { NextResponse: MockNextResponse }
})

// Create hoisted mock that can be used in vi.mock
const mockRun = vi.hoisted(() => vi.fn())

// Mock Replicate - ALL instances share the same mock
vi.mock('replicate', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      run: mockRun
    }))
  }
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

describe('Video API Route', () => {
  const mockRequest = (body: any) => ({
    json: vi.fn().mockResolvedValue(body)
  }) as unknown as Request

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.REPLICATE_API_TOKEN = 'test_replicate_token'
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

  describe('Validation', () => {
    it('returns 400 if prompt is missing', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({})

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Prompt is required')
    })

    it('returns 400 if prompt is empty string', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({ prompt: '' })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Prompt is required')
    })

    it('returns 400 if first_frame_image URL is invalid', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({
        prompt: 'test prompt',
        first_frame_image: 'not-a-valid-url'
      })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Invalid first frame image URL')
    })

    it('returns 400 if subject_reference URL is invalid', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({
        prompt: 'test prompt',
        subject_reference: 'invalid-url'
      })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Invalid subject reference URL')
    })

    it('accepts valid first_frame_image URL', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({
        prompt: 'test prompt',
        first_frame_image: 'https://example.com/image.jpg'
      })

      await POST(req)

      expect(mockRun).toHaveBeenCalledWith(
        'minimax/video-01',
        {
          input: {
            prompt: 'test prompt',
            prompt_optimizer: true,
            first_frame_image: 'https://example.com/image.jpg'
          }
        }
      )
    })

    it('accepts valid subject_reference URL', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({
        prompt: 'test prompt',
        subject_reference: 'https://example.com/subject.jpg'
      })

      await POST(req)

      expect(mockRun).toHaveBeenCalledWith(
        'minimax/video-01',
        {
          input: {
            prompt: 'test prompt',
            prompt_optimizer: true,
            subject_reference: 'https://example.com/subject.jpg'
          }
        }
      )
    })
  })

  describe('Free trial and subscription checks', () => {
    it('returns 403 if free trial expired and user is not pro', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(false)

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(response.status).toBe(403)
      expect(response.body).toBe('Free trial has expired.')
      expect(mockRun).not.toHaveBeenCalled()
    })

    it('allows request if user has free trial remaining', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockRun).toHaveBeenCalled()
      expect(response.data).toEqual({ url: 'https://output.com/video.mp4' })
    })

    it('allows request if user is pro even without free trial', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(true)
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockRun).toHaveBeenCalled()
      expect(response.data).toEqual({ url: 'https://output.com/video.mp4' })
    })
  })

  describe('Replicate API call', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('calls Replicate with correct parameters', async () => {
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({ prompt: 'generate a video of a cat' })

      await POST(req)

      expect(mockRun).toHaveBeenCalledWith(
        'minimax/video-01',
        {
          input: {
            prompt: 'generate a video of a cat',
            prompt_optimizer: true
          }
        }
      )
    })

    it('includes prompt_optimizer when set to false', async () => {
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({
        prompt: 'test prompt',
        prompt_optimizer: false
      })

      await POST(req)

      expect(mockRun).toHaveBeenCalledWith(
        'minimax/video-01',
        {
          input: {
            prompt: 'test prompt',
            prompt_optimizer: false
          }
        }
      )
    })

    it('includes all optional parameters when provided', async () => {
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({
        prompt: 'test prompt',
        first_frame_image: 'https://example.com/frame.jpg',
        subject_reference: 'https://example.com/subject.jpg',
        prompt_optimizer: false
      })

      await POST(req)

      expect(mockRun).toHaveBeenCalledWith(
        'minimax/video-01',
        {
          input: {
            prompt: 'test prompt',
            prompt_optimizer: false,
            first_frame_image: 'https://example.com/frame.jpg',
            subject_reference: 'https://example.com/subject.jpg'
          }
        }
      )
    })
  })

  describe('Response handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('handles string URL response', async () => {
      mockRun.mockResolvedValue('https://output.com/video.mp4')

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.data).toEqual({ url: 'https://output.com/video.mp4' })
    })

    it('handles ReadableStream response', async () => {
      const mockStream = new ReadableStream()
      mockRun.mockResolvedValue(mockStream)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.body).toBe(mockStream)
    })

    it('handles object with url property', async () => {
      mockRun.mockResolvedValue({ url: 'https://output.com/video.mp4' })

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.data).toEqual({ url: 'https://output.com/video.mp4' })
    })

    it('throws error for unexpected response format', async () => {
      mockRun.mockResolvedValue({ unexpected: 'format' })

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })
  })

  describe('API limit management', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      mockRun.mockResolvedValue('https://output.com/video.mp4')
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

    it('handles Replicate API error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockRun.mockRejectedValue(new Error('Replicate API error'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })
  })
})