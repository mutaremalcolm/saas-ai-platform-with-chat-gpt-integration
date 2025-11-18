import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Navbar from '@/components/navbar'

// Mock Clerk UserButton
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>
}))

// Mock MobileSidebar component
vi.mock('@/components/mobile-sidebar', () => ({
  default: ({ apiLimitCount, isPro }: { apiLimitCount: number; isPro: boolean }) => (
    <div data-testid="mobile-sidebar" data-api-limit={apiLimitCount} data-is-pro={isPro}>
      Mobile Sidebar
    </div>
  )
}))

// Mock api-limit and subscription functions
vi.mock('@/lib/api-limit', () => ({
  getApiLimitCount: vi.fn()
}))

vi.mock('@/lib/subscription', () => ({
  checkSubscription: vi.fn()
}))

import { getApiLimitCount } from '@/lib/api-limit'
import { checkSubscription } from '@/lib/subscription'

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with UserButton and MobileSidebar', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(0)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    render(NavbarResolved)

    expect(screen.getByTestId('user-button')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-sidebar')).toBeInTheDocument()
  })

  it('passes correct props to MobileSidebar for free user', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(3)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    render(NavbarResolved)

    const mobileSidebar = screen.getByTestId('mobile-sidebar')
    expect(mobileSidebar).toHaveAttribute('data-api-limit', '3')
    expect(mobileSidebar).toHaveAttribute('data-is-pro', 'false')
  })

  it('passes correct props to MobileSidebar for pro user', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(10)
    vi.mocked(checkSubscription).mockResolvedValue(true)

    const NavbarResolved = await Navbar()
    render(NavbarResolved)

    const mobileSidebar = screen.getByTestId('mobile-sidebar')
    expect(mobileSidebar).toHaveAttribute('data-api-limit', '10')
    expect(mobileSidebar).toHaveAttribute('data-is-pro', 'true')
  })

  it('applies correct wrapper styling', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(0)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    const { container } = render(NavbarResolved)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'items-center', 'p-4')
  })

  it('positions UserButton on the right', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(0)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    const { container } = render(NavbarResolved)

    const userButtonContainer = container.querySelector('.flex.w-full.justify-end')
    expect(userButtonContainer).toBeInTheDocument()
  })

  it('calls getApiLimitCount and checkSubscription', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(5)
    vi.mocked(checkSubscription).mockResolvedValue(true)

    await Navbar()

    expect(getApiLimitCount).toHaveBeenCalledTimes(1)
    expect(checkSubscription).toHaveBeenCalledTimes(1)
  })

  it('handles zero API limit count', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(0)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    render(NavbarResolved)

    const mobileSidebar = screen.getByTestId('mobile-sidebar')
    expect(mobileSidebar).toHaveAttribute('data-api-limit', '0')
  })

  it('matches snapshot for free user', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(3)
    vi.mocked(checkSubscription).mockResolvedValue(false)

    const NavbarResolved = await Navbar()
    const { container } = render(NavbarResolved)

    expect(container).toMatchSnapshot()
  })

  it('matches snapshot for pro user', async () => {
    vi.mocked(getApiLimitCount).mockResolvedValue(10)
    vi.mocked(checkSubscription).mockResolvedValue(true)

    const NavbarResolved = await Navbar()
    const { container } = render(NavbarResolved)

    expect(container).toMatchSnapshot()
  })
})