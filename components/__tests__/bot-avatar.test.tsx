import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BotAvatar } from '@/components/bot-avatar'

// Mock the Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, className }: { src?: string; className?: string }) => (
    <img data-testid="avatar-image" src={src} className={className} alt="bot avatar" />
  )
}))

describe('BotAvatar', () => {
  it('renders avatar with correct styling', () => {
    render(<BotAvatar />)

    const avatar = screen.getByTestId('avatar')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveClass('h-8 w-8')
  })

  it('renders avatar image with correct src', () => {
    render(<BotAvatar />)

    const image = screen.getByTestId('avatar-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/logo.png')
  })

  it('applies padding to avatar image', () => {
    render(<BotAvatar />)

    const image = screen.getByTestId('avatar-image')
    expect(image).toHaveClass('p-1')
  })

  it('renders complete component structure', () => {
    const { container } = render(<BotAvatar />)

    expect(screen.getByTestId('avatar')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
    expect(container.firstChild).toMatchSnapshot()
  })
})