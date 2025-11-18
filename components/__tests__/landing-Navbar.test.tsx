import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LandingNavBar } from '@/components/landing-Navbar'

// Mock Clerk useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className} data-testid="link">
      {children}
    </a>
  )
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img 
      data-testid="logo-image" 
      src={src} 
      alt={alt}
      data-fill={fill}
      {...props} 
    />
  )
}))

// Mock Next.js font
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    className: 'font-montserrat'
  })
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className, ...props }: any) => (
    <button
      data-testid="get-started-button"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

describe('LandingNavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Signed out user', () => {
    it('renders with link to sign-up when user is not signed in', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const links = screen.getAllByTestId('link')
      const getStartedLink = links.find(link => link.getAttribute('href') === '/sign-up')
      expect(getStartedLink).toBeTruthy()
    })
  })

  describe('Signed in user', () => {
    it('renders with link to dashboard when user is signed in', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true })

      render(<LandingNavBar />)

      const links = screen.getAllByTestId('link')
      const getStartedLink = links.find(link => link.getAttribute('href') === '/dashboard')
      expect(getStartedLink).toBeTruthy()
    })
  })

  describe('Logo and branding', () => {
    it('renders logo image with correct props', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const logo = screen.getByTestId('logo-image')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/logo.png')
      expect(logo).toHaveAttribute('alt', 'logo')
      expect(logo).toHaveAttribute('data-fill', 'true')
    })

    it('renders Inception brand name', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const brandName = screen.getByText('Inception')
      expect(brandName).toBeInTheDocument()
      expect(brandName.tagName).toBe('H1')
    })

    it('applies correct brand name styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const brandName = screen.getByText('Inception')
      expect(brandName).toHaveClass('text-2xl', 'font-bold', 'text-white', 'font-montserrat')
    })

    it('links logo to home page', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const links = screen.getAllByTestId('link')
      const homeLink = links.find(link => link.getAttribute('href') === '/')
      expect(homeLink).toBeTruthy()
      expect(homeLink).toHaveClass('flex', 'items-center')
    })

    it('has logo container with correct dimensions', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingNavBar />)

      const logoContainer = container.querySelector('.relative.h-8.w-8.mr-4')
      expect(logoContainer).toBeInTheDocument()
    })
  })

  describe('Get Started button', () => {
    it('renders Get Started button', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const button = screen.getByTestId('get-started-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Get Started')
    })

    it('renders button with outline variant', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const button = screen.getByTestId('get-started-button')
      expect(button).toHaveAttribute('data-variant', 'outline')
    })

    it('applies rounded-full styling to button', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      render(<LandingNavBar />)

      const button = screen.getByTestId('get-started-button')
      expect(button).toHaveClass('rounded-full')
    })
  })

  describe('Component structure and styling', () => {
    it('applies correct nav styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingNavBar />)

      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveClass('p-4', 'bg-transparent', 'flex', 'items-center', 'justify-between')
    })

    it('has correct button container styling', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingNavBar />)

      const buttonContainer = container.querySelector('.flex.items-center.gap-x-2')
      expect(buttonContainer).toBeInTheDocument()
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot for signed out user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: false })

      const { container } = render(<LandingNavBar />)

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for signed in user', () => {
      mockUseAuth.mockReturnValue({ isSignedIn: true })

      const { container } = render(<LandingNavBar />)

      expect(container).toMatchSnapshot()
    })
  })
})