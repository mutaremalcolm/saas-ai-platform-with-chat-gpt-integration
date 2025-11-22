import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, absoluteUrl } from '@/lib/utils'

// Mock clsx
vi.mock('clsx', () => ({
  clsx: vi.fn((...inputs) => inputs.flat().filter(Boolean).join(' '))
}))

// Mock tailwind-merge
vi.mock('tailwind-merge', () => ({
  twMerge: vi.fn((classes) => classes)
}))

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

describe('utils', () => {
  describe('cn', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('combines class names using clsx and twMerge', () => {
      const result = cn('class1', 'class2')

      expect(clsx).toHaveBeenCalledWith(['class1', 'class2'])
      expect(twMerge).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('handles single class name', () => {
      const result = cn('single-class')

      expect(clsx).toHaveBeenCalledWith(['single-class'])
      expect(result).toBe('single-class')
    })

    it('handles multiple class names', () => {
      const result = cn('class1', 'class2', 'class3')

      expect(clsx).toHaveBeenCalledWith(['class1', 'class2', 'class3'])
      expect(result).toBe('class1 class2 class3')
    })

    it('handles conditional class names', () => {
      const result = cn('base', false && 'hidden', true && 'visible')

      expect(clsx).toHaveBeenCalled()
      expect(result).toBe('base visible')
    })

    it('handles empty input', () => {
      const result = cn()

      expect(clsx).toHaveBeenCalledWith([])
      expect(result).toBe('')
    })

    it('handles undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')

      expect(clsx).toHaveBeenCalled()
      expect(result).toBe('class1 class2')
    })

    it('handles object syntax', () => {
      const result = cn({ 'active': true, 'disabled': false })

      expect(clsx).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('handles array of classes', () => {
      const result = cn(['class1', 'class2'])

      expect(clsx).toHaveBeenCalled()
      expect(twMerge).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('absoluteUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL

    afterEach(() => {
      if (originalEnv) {
        process.env.NEXT_PUBLIC_APP_URL = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL
      }
    })

    it('constructs absolute URL with base URL and path', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('/dashboard')

      expect(result).toBe('https://example.com/dashboard')
    })

    it('handles root path', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('/')

      expect(result).toBe('https://example.com/')
    })

    it('handles path without leading slash', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('dashboard')

      expect(result).toBe('https://example.comdashboard')
    })

    it('handles nested paths', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('/api/users/123')

      expect(result).toBe('https://example.com/api/users/123')
    })

    it('handles paths with query parameters', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('/search?q=test')

      expect(result).toBe('https://example.com/search?q=test')
    })

    it('handles paths with hash fragments', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('/page#section')

      expect(result).toBe('https://example.com/page#section')
    })

    it('handles localhost URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

      const result = absoluteUrl('/dashboard')

      expect(result).toBe('http://localhost:3000/dashboard')
    })

    it('handles empty path', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      const result = absoluteUrl('')

      expect(result).toBe('https://example.com')
    })

    it('handles undefined environment variable', () => {
      delete process.env.NEXT_PUBLIC_APP_URL

      const result = absoluteUrl('/dashboard')

      expect(result).toBe('undefined/dashboard')
    })
  })
})