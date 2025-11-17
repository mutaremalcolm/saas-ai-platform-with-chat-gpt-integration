import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LandingHero } from '@/components/landing-hero'

// Mock Clerk useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  )
}))

// Mock TypewriterComponent
vi.mock('typewriter-effect', () => ({
  default: ({ options }: { options: any }) => (
    <div data-testid="typewriter" data-options={JSON.stringify(options)}>
      Typewriter Effect
    </div>
  )
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className, ...props }: any) => (
    <button
      data-testid="cta-button"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

describe('LandingHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Signed out user', () => {
    it('renders with link to sign-up when user is not signed in', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const link = screen.getByTestId('link')
      expect(link).toHaveAttribute('href', '/sign-up')
    })

    it('renders all main content for signed out user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      expect(screen.getByText('The Best AI Tool for')).toBeInTheDocument()
      expect(screen.getByText('Create content using AI 10x faster.')).toBeInTheDocument()
      expect(screen.getByText('Start Generating For Free')).toBeInTheDocument()
      expect(screen.getByText('No credit card required.')).toBeInTheDocument()
    })
  })

  describe('Signed in user', () => {
    it('renders with link to dashboard when user is signed in', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true })

      render(<LandingHero />)

      const link = screen.getByTestId('link')
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('renders all main content for signed in user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true })

      render(<LandingHero />)

      expect(screen.getByText('The Best AI Tool for')).toBeInTheDocument()
      expect(screen.getByText('Create content using AI 10x faster.')).toBeInTheDocument()
    })
  })

  describe('TypewriterComponent', () => {
    it('renders TypewriterComponent with correct options', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const typewriter = screen.getByTestId('typewriter')
      expect(typewriter).toBeInTheDocument()

      const options = JSON.parse(typewriter.getAttribute('data-options') || '{}')
      expect(options.strings).toEqual([
        "Chatbot.",
        "Photo Generation.",
        "Music Generation.",
        "Code Generation.",
        "Video Generation.",
      ])
      expect(options.autoStart).toBe(true)
      expect(options.loop).toBe(true)
    })

    it('applies gradient styling to typewriter container', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingHero />)

      const gradientContainer = container.querySelector('.text-transparent.bg-clip-text.bg-gradient-to-r')
      expect(gradientContainer).toBeInTheDocument()
      expect(gradientContainer).toHaveClass('from-purple-400', 'to-pink-600')
    })
  })

  describe('Button', () => {
    it('renders button with premium variant', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const button = screen.getByTestId('cta-button')
      expect(button).toHaveAttribute('data-variant', 'premium')
    })

    it('applies correct button styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const button = screen.getByTestId('cta-button')
      expect(button).toHaveClass('md:text-lg', 'p-4', 'md:p-6', 'rounded-full', 'font-semibold')
    })
  })

  describe('Component structure and styling', () => {
    it('applies correct wrapper styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingHero />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('text-white', 'font-bold', 'py-36', 'text-center', 'space-y-5')
    })

    it('renders heading as h1 element', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const heading = screen.getByText('The Best AI Tool for')
      expect(heading.tagName).toBe('H1')
    })

    it('applies correct heading container styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingHero />)

      const headingContainer = container.querySelector('.text-4xl.sm\\:text-5xl.md\\:text-6xl.lg\\:text-7xl')
      expect(headingContainer).toBeInTheDocument()
      expect(headingContainer).toHaveClass('space-y-5', 'font-extrabold')
    })

    it('applies correct styling to subheading', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const subheading = screen.getByText('Create content using AI 10x faster.')
      expect(subheading).toHaveClass('text-sm', 'md:text-xl', 'font-light', 'text-zinc-400')
    })

    it('applies correct styling to footer text', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingHero />)

      const footer = screen.getByText('No credit card required.')
      expect(footer).toHaveClass('text-zinc-400', 'text-xs', 'md:text-sm', 'font-normal')
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot for signed out user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingHero />)

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for signed in user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true })

      const { container } = render(<LandingHero />)

      expect(container).toMatchSnapshot()
    })
  })
})