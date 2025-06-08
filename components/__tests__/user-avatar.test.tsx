import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserAvatar } from '@/components/user-avatar'

// Mock the Clerk useUser hook
const mockUseUser = vi.fn()
vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser()
}))

// Mock the Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src }: { src?: string }) => (
    <img data-testid="avatar-image" src={src} alt="user avatar" />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">
      {children}
    </div>
  )
}))

describe('UserAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders avatar with user image when user has imageUrl', () => {
    const mockUser = {
      imageUrl: 'https://example.com/user-image.jpg',
      firstName: 'John',
      lastName: 'Doe'
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    expect(screen.getByTestId('avatar')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toHaveClass('h-8 w-8')
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', mockUser.imageUrl)
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
  })

  it('renders fallback with user initials when user has firstName and lastName', () => {
    const mockUser = {
      firstName: 'Jane',
      lastName: 'Smith',
      imageUrl: undefined
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('JS')
  })

  it('renders fallback with single initial when user has only firstName', () => {
    const mockUser = {
      firstName: 'Alice',
      lastName: undefined,
      imageUrl: undefined
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('A')
  })

  it('renders fallback with single initial when user has only lastName', () => {
    const mockUser = {
      firstName: undefined,
      lastName: 'Brown',
      imageUrl: undefined
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('B')
  })

  it('renders empty fallback when user has no name information', () => {
    const mockUser = {
      firstName: undefined,
      lastName: undefined,
      imageUrl: undefined
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('')
  })

  it('handles edge case with empty string names', () => {
    const mockUser = {
      firstName: '',
      lastName: '',
      imageUrl: 'https://example.com/image.jpg'
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('')
  })

  it('handles names with special characters', () => {
    const mockUser = {
      firstName: 'José',
      lastName: 'García',
      imageUrl: undefined
    }
    
    mockUseUser.mockReturnValue({ user: mockUser })

    render(<UserAvatar />)

    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('JG')
  })
})