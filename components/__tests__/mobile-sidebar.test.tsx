import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MobileSidebar from '@/components/mobile-sidebar'

// Mock Menu icon from lucide-react
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>
}))

// Mock Sheet components
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet">{children}</div>
  ),
  SheetContent: ({ children, side, className }: any) => (
    <div data-testid="sheet-content" data-side={side} className={className}>
      {children}
    </div>
  ),
  SheetTrigger: ({ children, asChild }: any) => (
    <div data-testid="sheet-trigger" data-as-child={asChild}>
      {children}
    </div>
  )
}))

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, ...props }: any) => (
    <button
      data-testid="mobile-menu-button"
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

// Mock Sidebar component
vi.mock('@/components/sidebar', () => ({
  default: ({ apiLimitCount, isPro }: { apiLimitCount: number; isPro: boolean }) => (
    <div data-testid="sidebar" data-api-limit={apiLimitCount} data-is-pro={isPro}>
      Sidebar Content
    </div>
  )
}))

describe('MobileSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders mobile sidebar with menu button', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument()
  })

  it('renders button with ghost variant and icon size', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    const button = screen.getByTestId('mobile-menu-button')
    expect(button).toHaveAttribute('data-variant', 'ghost')
    expect(button).toHaveAttribute('data-size', 'icon')
  })

  it('applies md:hidden class to button for mobile-only display', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    const button = screen.getByTestId('mobile-menu-button')
    expect(button).toHaveClass('md:hidden')
  })

  it('renders sheet components', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    expect(screen.getByTestId('sheet')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument()
  })

  it('renders SheetContent with left side', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    const sheetContent = screen.getByTestId('sheet-content')
    expect(sheetContent).toHaveAttribute('data-side', 'left')
  })

  it('applies p-0 class to SheetContent', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    const sheetContent = screen.getByTestId('sheet-content')
    expect(sheetContent).toHaveClass('p-0')
  })

  it('passes correct props to Sidebar for free user', () => {
    render(<MobileSidebar apiLimitCount={3} isPro={false} />)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveAttribute('data-api-limit', '3')
    expect(sidebar).toHaveAttribute('data-is-pro', 'false')
  })

  it('passes correct props to Sidebar for pro user', () => {
    render(<MobileSidebar apiLimitCount={10} isPro={true} />)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveAttribute('data-api-limit', '10')
    expect(sidebar).toHaveAttribute('data-is-pro', 'true')
  })

  it('uses default values when props are undefined', () => {
    render(<MobileSidebar apiLimitCount={undefined as any} isPro={undefined as any} />)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveAttribute('data-api-limit', '0')
    expect(sidebar).toHaveAttribute('data-is-pro', 'false')
  })

  it('renders SheetTrigger with asChild prop', () => {
    render(<MobileSidebar apiLimitCount={0} isPro={false} />)

    const sheetTrigger = screen.getByTestId('sheet-trigger')
    expect(sheetTrigger).toHaveAttribute('data-as-child', 'true')
  })

  it('matches snapshot', () => {
    const { container } = render(<MobileSidebar apiLimitCount={5} isPro={false} />)

    expect(container).toMatchSnapshot()
  })
})