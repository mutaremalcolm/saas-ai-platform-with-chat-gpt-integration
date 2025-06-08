import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SubscriptionButton } from '@/components/subscription-button'
import axios from 'axios'
import toast from 'react-hot-toast'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))
const mockedAxios = axios as any

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn()
  }
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Zap: ({ className }: { className?: string }) => (
    <div data-testid="zap-icon" className={className}>⚡</div>
  )
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ 
    children, 
    disabled, 
    variant, 
    onClick,
    ...props 
  }: {
    children: React.ReactNode
    disabled?: boolean
    variant?: string
    onClick?: () => void
  }) => (
    <button
      data-testid="subscription-button"
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}))

// Mock window.location.href
const mockLocationAssign = vi.fn()
delete (window as any).location
window.location = { href: '' } as any
const originalHref = window.location.href

// Override the href setter
Object.defineProperty(window.location, 'href', {
  set: mockLocationAssign,
  configurable: true
})

describe('SubscriptionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Pro User (isPro = true)', () => {
    it('renders manage subscription button for pro user', () => {
      render(<SubscriptionButton isPro={true} />)

      const button = screen.getByTestId('subscription-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Manage Subscription')
      expect(button).toHaveAttribute('data-variant', 'default')
      expect(button).not.toBeDisabled()
    })

    it('does not show Zap icon for pro user', () => {
      render(<SubscriptionButton isPro={true} />)

      expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument()
    })

    it('handles successful API call for pro user', async () => {
      const mockResponse = { data: { url: 'https://stripe.com/manage' } }
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      render(<SubscriptionButton isPro={true} />)

      const button = screen.getByTestId('subscription-button')
      fireEvent.click(button)

      expect(button).toBeDisabled()
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/stripe')
        expect(mockLocationAssign).toHaveBeenCalledWith('https://stripe.com/manage')
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Non-Pro User (isPro = false)', () => {
    it('renders upgrade button for non-pro user', () => {
      render(<SubscriptionButton isPro={false} />)

      const button = screen.getByTestId('subscription-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Upgrade')
      expect(button).toHaveAttribute('data-variant', 'premium')
      expect(button).not.toBeDisabled()
    })

    it('shows Zap icon for non-pro user', () => {
      render(<SubscriptionButton isPro={false} />)

      const zapIcon = screen.getByTestId('zap-icon')
      expect(zapIcon).toBeInTheDocument()
      expect(zapIcon).toHaveClass('w-4 h-4 ml-2 fill-white')
    })

    it('handles successful API call for non-pro user', async () => {
      const mockResponse = { data: { url: 'https://stripe.com/checkout' } }
      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      render(<SubscriptionButton isPro={false} />)

      const button = screen.getByTestId('subscription-button')
      fireEvent.click(button)

      expect(button).toBeDisabled()
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/stripe')
        expect(mockLocationAssign).toHaveBeenCalledWith('https://stripe.com/checkout')
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when API call fails', async () => {
      const mockError = new Error('Network error')
      mockedAxios.get.mockRejectedValueOnce(mockError)

      render(<SubscriptionButton isPro={false} />)

      const button = screen.getByTestId('subscription-button')
      fireEvent.click(button)

      expect(button).toBeDisabled()

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/stripe')
        expect(toast.error).toHaveBeenCalledWith('Something went wrong')
      })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('re-enables button after error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'))

      render(<SubscriptionButton isPro={true} />)

      const button = screen.getByTestId('subscription-button')
      fireEvent.click(button)

      expect(button).toBeDisabled()

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Loading State', () => {
    it('disables button during API call', async () => {
      // Create a promise that we can resolve manually
      let resolvePromise: (value: any) => void
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockedAxios.get.mockReturnValueOnce(mockPromise)

      render(<SubscriptionButton isPro={false} />)

      const button = screen.getByTestId('subscription-button')
      expect(button).not.toBeDisabled()

      fireEvent.click(button)
      expect(button).toBeDisabled()

      // Resolve the promise
      resolvePromise!({ data: { url: 'https://test.com' } })

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Multiple Clicks', () => {
    it('prevents multiple API calls when button is clicked rapidly', async () => {
      let resolvePromise: (value: any) => void
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockedAxios.get.mockReturnValueOnce(mockPromise)

      render(<SubscriptionButton isPro={false} />)

      const button = screen.getByTestId('subscription-button')
      
      // Click multiple times rapidly
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Should only be called once due to disabled state
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)

      resolvePromise!({ data: { url: 'https://test.com' } })
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })
})