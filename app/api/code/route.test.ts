import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create hoisted mock for OpenAI that always has apiKey
const mockCreateChatCompletion = vi.hoisted(() => vi.fn())

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
    createChatCompletion = mockCreateChatCompletion
    constructor(config: any) {}
  }
  
  return {
    Configuration: MockConfiguration,
    OpenAIApi: MockOpenAIApi
  }
})

// Set environment variable
process.env.OPENAI_API_KEY = 'test_openai_key'

import { POST } from '@/app/api/code/route'

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

describe('Code API Route', () => {
  const mockRequest = (body: any) => ({
    json: vi.fn().mockResolvedValue(body)
  }) as unknown as Request

  const mockMessages = [
    { role: 'user', content: 'Write a function to reverse a string' }
  ]

  const instructionMessage = {
    role: "system",
    content: "You are a code generator. You must answer only in markdown code snippets. Use code comments for explanations."
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockReturnValue({ userId: null } as any)
      const req = mockRequest({ messages: mockMessages })

      const response = await POST(req) as any

      expect(response.status).toBe(401)
      expect(response.body).toBe('Unauthorized')
    })
  })

  describe('Configuration', () => {
    it('returns 500 if OpenAI API key is not configured', async () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      // Reset modules and reimport to get new Configuration instance
      vi.resetModules()
      
      // Re-mock with undefined apiKey
      vi.doMock('openai', () => {
        const mockCreateChatCompletionLocal = vi.fn()
        class MockConfiguration {
          apiKey: string | undefined
          constructor(config: { apiKey?: string }) {
            this.apiKey = config.apiKey // Will be undefined
          }
        }
        
        class MockOpenAIApi {
          createChatCompletion = mockCreateChatCompletionLocal
          constructor(config: any) {}
        }
        
        return {
          Configuration: MockConfiguration,
          OpenAIApi: MockOpenAIApi
        }
      })
      
      const { POST: POST_NO_KEY } = await import('@/app/api/code/route')
      
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      const req = mockRequest({ messages: mockMessages })

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

    it('returns 400 if messages are missing', async () => {
      const req = mockRequest({})

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Messages are required')
    })

    it('returns 400 if messages is null', async () => {
      const req = mockRequest({ messages: null })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Messages are required')
    })

    it('returns 400 if messages is undefined', async () => {
      const req = mockRequest({ messages: undefined })

      const response = await POST(req) as any

      expect(response.status).toBe(400)
      expect(response.body).toBe('Messages are required')
    })
  })

  describe('Free trial and subscription checks', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
    })

    it('returns 403 if free trial expired and user is not pro', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(false)

      const req = mockRequest({ messages: mockMessages })

      const response = await POST(req) as any

      expect(response.status).toBe(403)
      expect(response.body).toBe('Free trial has expired.')
      expect(mockCreateChatCompletion).not.toHaveBeenCalled()
    })

    it('allows request if user has free trial remaining', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```js\n// code\n```' } }]
        }
      })

      const req = mockRequest({ messages: mockMessages })

      const response = await POST(req) as any

      expect(mockCreateChatCompletion).toHaveBeenCalled()
      expect(response.data).toEqual({ role: 'assistant', content: '```js\n// code\n```' })
    })

    it('allows request if user is pro even without free trial', async () => {
      vi.mocked(checkApiLimit).mockResolvedValue(false)
      vi.mocked(checkSubscription).mockResolvedValue(true)
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```py\n# code\n```' } }]
        }
      })

      const req = mockRequest({ messages: mockMessages })

      const response = await POST(req) as any

      expect(mockCreateChatCompletion).toHaveBeenCalled()
      expect(response.data).toEqual({ role: 'assistant', content: '```py\n# code\n```' })
    })
  })

  describe('OpenAI API call', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('calls OpenAI with instruction message prepended to user messages', async () => {
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```js\nfunction reverse(str) { return str.split("").reverse().join(""); }\n```' } }]
        }
      })

      const req = mockRequest({ messages: mockMessages })

      await POST(req)

      expect(mockCreateChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [instructionMessage, ...mockMessages]
      })
    })

    it('includes instruction message with multi-turn conversation', async () => {
      const conversationMessages = [
        { role: 'user', content: 'Write a sorting function' },
        { role: 'assistant', content: '```js\nfunction sort(arr) { return arr.sort(); }\n```' },
        { role: 'user', content: 'Make it use bubble sort' }
      ]

      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```js\n// bubble sort implementation\n```' } }]
        }
      })

      const req = mockRequest({ messages: conversationMessages })

      await POST(req)

      expect(mockCreateChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [instructionMessage, ...conversationMessages]
      })
    })

    it('uses gpt-3.5-turbo model', async () => {
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```js\n// code\n```' } }]
        }
      })

      const req = mockRequest({ messages: mockMessages })

      await POST(req)

      expect(mockCreateChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo'
        })
      )
    })
  })

  describe('Response handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
    })

    it('returns the assistant message from OpenAI response', async () => {
      const mockMessage = { 
        role: 'assistant', 
        content: '```python\ndef hello_world():\n    print("Hello, World!")\n```' 
      }

      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: mockMessage }]
        }
      })

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.data).toEqual(mockMessage)
    })

    it('returns code with markdown formatting', async () => {
      const mockMessage = { 
        role: 'assistant', 
        content: '```javascript\n// Reverse a string\nfunction reverseString(str) {\n  return str.split("").reverse().join("");\n}\n```' 
      }

      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: mockMessage }]
        }
      })

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.data).toEqual(mockMessage)
      expect(response.data.content).toContain('```')
    })
  })

  describe('API limit management', () => {
    beforeEach(() => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { role: 'assistant', content: '```js\n// code\n```' } }]
        }
      })
    })

    it('increases API limit for non-pro users', async () => {
      vi.mocked(checkSubscription).mockResolvedValue(false)

      const req = mockRequest({ messages: mockMessages })
      await POST(req)

      expect(increaseAPILimit).toHaveBeenCalledTimes(1)
    })

    it('does not increase API limit for pro users', async () => {
      vi.mocked(checkSubscription).mockResolvedValue(true)

      const req = mockRequest({ messages: mockMessages })
      await POST(req)

      expect(increaseAPILimit).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('returns 500 on internal error', async () => {
      vi.mocked(auth).mockImplementation(() => {
        throw new Error('Internal error')
      })

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('handles OpenAI API error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateChatCompletion.mockRejectedValue(new Error('OpenAI API error'))

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('handles checkApiLimit error', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockRejectedValue(new Error('Database error'))

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })

    it('handles malformed OpenAI response', async () => {
      vi.mocked(auth).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(checkApiLimit).mockResolvedValue(true)
      vi.mocked(checkSubscription).mockResolvedValue(false)
      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [] // Empty choices array
        }
      })

      const req = mockRequest({ messages: mockMessages })
      const response = await POST(req) as any

      expect(response.status).toBe(500)
      expect(response.body).toBe('Internal error')
    })
  })
})