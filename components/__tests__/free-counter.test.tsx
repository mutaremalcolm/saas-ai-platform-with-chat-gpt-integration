import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FreeCounter } from '@/components/free-counter'

// Mock the useProModal hook
const mockOnOpen = vi.fn()
vi.mock('@/hooks/use-pro-modal', () => ({
  useProModal: () => ({
    onOpen: mockOnOpen,
    onClose: vi.fn(),
    isOpen: false
  })
}))

// Mock MAX_FREE_COUNTS constant
vi.mock('@/constants', () => ({
  MAX_FREE_COUNTS: 5
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  )
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className}>
      Progress: {value}%
    </div>
  )
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button
      data-testid="upgrade-button"
      data-variant={variant}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}))

// Mock Zap icon from lucide-react
vi.mock('lucide-react', () => ({
  Zap: ({ className }: { className?: string }) => (
    <div data-testid="zap-icon" className={className}>⚡</div>
  )
}))

describe('FreeCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Pro user behavior', () => {
    it('returns null for pro users', () => {
      const { container } = render(<FreeCounter apiLimitCount={3} isPro={true} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('does not render card for pro users regardless of API count', () => {
      render(<FreeCounter apiLimitCount={5} isPro={true} />)
      
      expect(screen.queryByTestId('card')).not.toBeInTheDocument()
    })

    it('returns null for pro users even with 0 API count', () => {
      const { container } = render(<FreeCounter apiLimitCount={0} isPro={true} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Free user rendering', () => {
    it('renders card with correct styling', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-white/10 border-0')
    })

    it('renders card content with correct styling', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const cardContent = screen.getByTestId('card-content')
      expect(cardContent).toBeInTheDocument()
      expect(cardContent).toHaveClass('py-6')
    })

    it('displays correct generation count text', () => {
      render(<FreeCounter apiLimitCount={3} isPro={false} />)
      
      expect(screen.getByText('3 / 5 Free Generations')).toBeInTheDocument()
    })

    it('displays generation count for 0 generations', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      expect(screen.getByText('0 / 5 Free Generations')).toBeInTheDocument()
    })

    it('displays generation count at max limit', () => {
      render(<FreeCounter apiLimitCount={5} isPro={false} />)
      
      expect(screen.getByText('5 / 5 Free Generations')).toBeInTheDocument()
    })

    it('displays different API counts correctly', () => {
      const { rerender } = render(<FreeCounter apiLimitCount={1} isPro={false} />)
      
      expect(screen.getByText('1 / 5 Free Generations')).toBeInTheDocument()

      rerender(<FreeCounter apiLimitCount={4} isPro={false} />)
      
      expect(screen.getByText('4 / 5 Free Generations')).toBeInTheDocument()
    })
  })

  describe('Progress bar', () => {
    it('renders progress bar with correct styling', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
      expect(progress).toHaveClass('h-3')
    })

    it('calculates correct progress value for 0 generations', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '0')
    })

    it('calculates correct progress value for 1 out of 5 generations', () => {
      render(<FreeCounter apiLimitCount={1} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '20')
    })

    it('calculates correct progress value for 3 out of 5 generations', () => {
      render(<FreeCounter apiLimitCount={3} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '60')
    })

    it('calculates correct progress value for max generations', () => {
      render(<FreeCounter apiLimitCount={5} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '100')
    })

    it('calculates correct progress value for 2 out of 5 generations', () => {
      render(<FreeCounter apiLimitCount={2} isPro={false} />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '40')
    })
  })

  describe('Upgrade button', () => {
    it('renders upgrade button with correct text', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const button = screen.getByTestId('upgrade-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Upgrade')
    })

    it('renders button with premium variant', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const button = screen.getByTestId('upgrade-button')
      expect(button).toHaveAttribute('data-variant', 'premium')
    })

    it('renders button with correct styling', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const button = screen.getByTestId('upgrade-button')
      expect(button).toHaveClass('w-full')
    })

    it('renders Zap icon with correct styling', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const zapIcon = screen.getByTestId('zap-icon')
      expect(zapIcon).toBeInTheDocument()
      expect(zapIcon).toHaveClass('w-4 h-4 ml-2 fill-light')
    })

    it('calls proModal.onOpen when clicked', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const button = screen.getByTestId('upgrade-button')
      fireEvent.click(button)

      expect(mockOnOpen).toHaveBeenCalledTimes(1)
    })

    it('calls proModal.onOpen multiple times for multiple clicks', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const button = screen.getByTestId('upgrade-button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(mockOnOpen).toHaveBeenCalledTimes(3)
    })
  })

  describe('Component structure', () => {
    it('wraps content in div with correct padding', () => {
      const { container } = render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const wrapper = container.querySelector('.px-3')
      expect(wrapper).toBeInTheDocument()
    })

    it('contains text with correct styling classes', () => {
      const { container } = render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      const textContainer = container.querySelector('.text-center.text-sm.text-white.mb-4.space-y-2')
      expect(textContainer).toBeInTheDocument()
    })

    it('matches snapshot for free user with no generations', () => {
      const { container } = render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for free user with partial generations', () => {
      const { container } = render(<FreeCounter apiLimitCount={3} isPro={false} />)
      
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for free user at limit', () => {
      const { container } = render(<FreeCounter apiLimitCount={5} isPro={false} />)
      
      expect(container).toMatchSnapshot()
    })
  })

  describe('Edge cases', () => {
    it('handles apiLimitCount of 0 correctly', () => {
      render(<FreeCounter apiLimitCount={0} isPro={false} />)
      
      expect(screen.getByText('0 / 5 Free Generations')).toBeInTheDocument()
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-value', '0')
    })

    it('renders for free user when isPro is explicitly false', () => {
      render(<FreeCounter apiLimitCount={2} isPro={false} />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })
})