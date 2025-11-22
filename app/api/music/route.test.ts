import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/music/route'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}))

// Mock Next.js server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: any
    status: number
    headers: any
    
    constructor(body: any, init?: { status?: number; headers?: any }) {
      this.body = body
      this.status = init?.status || 200
      this.headers = init?.headers || {}
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

// Hoist the mock functions so they're shared across all Replicate instances
const mockPredictionsCreate = vi.hoisted(() => vi.fn())
const mockWait = vi.hoisted(() => vi.fn())

// Mock Replicate
vi.mock('replicate', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      predictions: {
        create: mockPredictionsCreate
      },
      wait: mockWait
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

describe('Music API Route', () => {
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  const mockRequest = (body: any) => ({
    json: vi.fn().mockResolvedValue(body)
  }) as unknown as Request

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.REPLICATE_API_TOKEN = 'test_replicate_token'
  })

  afterEach(() => {
    consoleLogSpy.mockClear()
    consoleErrorSpy.mockClear()
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
      expect(mockPredictionsCreate).not.toHaveBeenCalled()
    })

    it('allows request if user has free trial remaining', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockPredictionsCreate).toHaveBeenCalled()
      expect(response.data).toEqual({ url: 'https://output.com/audio.mp3' })
    })

    it('allows request if user is pro even without free trial', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(true)
      
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })

      const response = await POST(req) as any

      expect(mockPredictionsCreate).toHaveBeenCalled()
      expect(response.data).toEqual({ url: 'https://output.com/audio.mp3' })
    })
  })

  describe('Replicate API call', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('creates prediction with default parameters', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'generate calm piano music' })

      await POST(req)

      expect(mockPredictionsCreate).toHaveBeenCalledWith({
        version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
        input: {
          prompt: 'generate calm piano music',
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak'
        }
      })
    })

    it('creates prediction with custom parameters', async () => {
      const mockPrediction = { id: 'pred_456' }
      const mockFinalPrediction = { output: 'https://output.com/audio.wav' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({
        prompt: 'epic orchestral music',
        model_version: 'stereo-melody',
        output_format: 'wav',
        normalization_strategy: 'loudness'
      })

      await POST(req)

      expect(mockPredictionsCreate).toHaveBeenCalledWith({
        version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
        input: {
          prompt: 'epic orchestral music',
          model_version: 'stereo-melody',
          output_format: 'wav',
          normalization_strategy: 'loudness'
        }
      })
    })

    it('waits for prediction to complete', async () => {
      const mockPrediction = { id: 'pred_789' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })

      await POST(req)

      expect(mockWait).toHaveBeenCalledWith(mockPrediction)
    })

    it('logs prediction creation and completion', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })

      await POST(req)

      expect(consoleLogSpy).toHaveBeenCalledWith('Request body:', expect.any(Object))
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting Replicate prediction...')
      expect(consoleLogSpy).toHaveBeenCalledWith('Prediction created:', mockPrediction)
      expect(consoleLogSpy).toHaveBeenCalledWith('Final prediction:', mockFinalPrediction)
    })
  })

  describe('Response handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('handles string URL response', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.data).toEqual({ url: 'https://output.com/audio.mp3' })
    })

    it('handles array response with single URL', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: ['https://output.com/audio.mp3'] }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.data).toEqual({ url: 'https://output.com/audio.mp3' })
    })

    it('handles array response with multiple URLs', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { 
        output: [
          'https://output.com/audio1.mp3',
          'https://output.com/audio2.mp3'
        ]
      }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.data).toEqual({ url: 'https://output.com/audio1.mp3' })
    })

    it('throws error for no valid output', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: null }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('No valid output URL received from Replicate')
    })

    it('throws error for empty array output', async () => {
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: [] }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('No valid output URL received from Replicate')
    })
  })

  describe('API limit management', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      
      const mockPrediction = { id: 'pred_123' }
      const mockFinalPrediction = { output: 'https://output.com/audio.mp3' }
      
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockResolvedValue(mockFinalPrediction)
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
    it('returns 500 on auth error', async () => {
      vi.mocked(auth).mockImplementation(() => {
        throw new Error('Auth error')
      })

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.headers['Content-Type']).toBe('application/json')
      
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Auth error')
    })

    it('returns 500 on Replicate prediction creation error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      mockPredictionsCreate.mockRejectedValue(new Error('Replicate API error'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Replicate API error')
    })

    it('returns 500 on Replicate wait error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      const mockPrediction = { id: 'pred_123' }
      mockPredictionsCreate.mockResolvedValue(mockPrediction)
      mockWait.mockRejectedValue(new Error('Prediction timeout'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Prediction timeout')
    })

    it('logs full error details', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      const mockError = new Error('Test error')
      mockPredictionsCreate.mockRejectedValue(mockError)

      const req = mockRequest({ prompt: 'test prompt' })
      await POST(req)

      expect(consoleErrorSpy).toHaveBeenCalledWith('[AUDIO_ERROR] Full error:', mockError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[AUDIO_ERROR] Error message:', 'Test error')
    })

    it('includes response data in error details when available', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      class ApiError extends Error {
        response: any
        constructor(message: string, responseData: any) {
          super(message)
          this.response = responseData
        }
      }
      
      const mockError = new ApiError('API error', { data: 'Additional error info' })
      mockPredictionsCreate.mockRejectedValue(mockError)

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      const body = JSON.parse(response.body)
      expect(body.error).toBe('API error')
      expect(body.details).toBe('Additional error info')
    })

    it('provides default details when no response data', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      
      mockPredictionsCreate.mockRejectedValue(new Error('Simple error'))

      const req = mockRequest({ prompt: 'test prompt' })
      const response = await POST(req) as any

      const body = JSON.parse(response.body)
      expect(body.details).toBe('No additional details')
    })
  })
})