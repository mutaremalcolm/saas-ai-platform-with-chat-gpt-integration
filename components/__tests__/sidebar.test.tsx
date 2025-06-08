import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '@/components/sidebar'

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img src={src} alt={alt} data-fill={fill} {...props} />
  )
}))

// Mock Next.js font
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    className: 'font-montserrat'
  })
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Mock FreeCounter component
vi.mock('@/components/free-counter', () => ({
  FreeCounter: ({ apiLimitCount, isPro }: { apiLimitCount: number; isPro: boolean }) => (
    <div data-testid="free-counter" data-api-limit={apiLimitCount} data-is-pro={isPro}>
      Free Counter Component
    </div>
  )
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Code: ({ className }: { className?: string }) => (
    <div data-testid="code-icon" className={className}>Code</div>
  ),
  ImageIcon: ({ className }: { className?: string }) => (
    <div data-testid="image-icon" className={className}>Image</div>
  ),
  LayoutDashboard: ({ className }: { className?: string }) => (
    <div data-testid="dashboard-icon" className={className}>Dashboard</div>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <div data-testid="message-icon" className={className}>Message</div>
  ),
  Music: ({ className }: { className?: string }) => (
    <div data-testid="music-icon" className={className}>Music</div>
  ),
  Settings: ({ className }: { className?: string }) => (
    <div data-testid="settings-icon" className={className}>Settings</div>
  ),
  VideoIcon: ({ className }: { className?: string }) => (
    <div data-testid="video-icon" className={className}>Video</div>
  )
}))

// Import the usePathname mock
import { usePathname } from 'next/navigation'
const mockUsePathname = vi.mocked(usePathname)

describe('Sidebar Component Snapshots', () => {
  it('renders correctly with default props', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { container } = render(
      <Sidebar apiLimitCount={0} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly for free user with API limit', () => {
    mockUsePathname.mockReturnValue('/conversation')
    
    const { container } = render(
      <Sidebar apiLimitCount={3} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly for pro user', () => {
    mockUsePathname.mockReturnValue('/image')
    
    const { container } = render(
      <Sidebar apiLimitCount={10} isPro={true} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with different active routes', () => {
    mockUsePathname.mockReturnValue('/video')
    
    const { container } = render(
      <Sidebar apiLimitCount={5} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with music route active', () => {
    mockUsePathname.mockReturnValue('/music')
    
    const { container } = render(
      <Sidebar apiLimitCount={2} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with code route active', () => {
    mockUsePathname.mockReturnValue('/code')
    
    const { container } = render(
      <Sidebar apiLimitCount={7} isPro={true} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with settings route active', () => {
    mockUsePathname.mockReturnValue('/settings')
    
    const { container } = render(
      <Sidebar apiLimitCount={1} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with no active route (unknown path)', () => {
    mockUsePathname.mockReturnValue('/unknown')
    
    const { container } = render(
      <Sidebar apiLimitCount={0} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with maximum API limit count', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { container } = render(
      <Sidebar apiLimitCount={999} isPro={false} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders correctly with pro user and high API count', () => {
    mockUsePathname.mockReturnValue('/conversation')
    
    const { container } = render(
      <Sidebar apiLimitCount={50} isPro={true} />
    )
    
    expect(container.firstChild).toMatchSnapshot()
  })
})

describe('Sidebar Component Structure Tests', () => {
  it('contains all expected navigation routes', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { container } = render(
      <Sidebar apiLimitCount={0} isPro={false} />
    )
    
    // Test that all route links are present
    const links = container.querySelectorAll('a[href]')
    const hrefs = Array.from(links).map(link => link.getAttribute('href'))
    
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/conversation')
    expect(hrefs).toContain('/image')
    expect(hrefs).toContain('/video')
    expect(hrefs).toContain('/music')
    expect(hrefs).toContain('/code')
    expect(hrefs).toContain('/settings')
  })

  it('displays correct icon colors for each route', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { getByTestId } = render(
      <Sidebar apiLimitCount={0} isPro={false} />
    )
    
    expect(getByTestId('dashboard-icon')).toHaveClass('text-sky-500')
    expect(getByTestId('message-icon')).toHaveClass('text-violet-500')
    expect(getByTestId('image-icon')).toHaveClass('text-pink-700')
    expect(getByTestId('video-icon')).toHaveClass('text-orange-700')
    expect(getByTestId('music-icon')).toHaveClass('text-emerald-500')
    expect(getByTestId('code-icon')).toHaveClass('text-green-700')
    // Settings icon has no specific color
  })

//   it('applies active route styling correctly', () => {
//     mockUsePathname.mockReturnValue('/conversation')
    
//     const { container } = render(
//       <Sidebar apiLimitCount={0} isPro={false} />
//     )
    
//     const conversationLink = container.querySelector('a[href="/conversation"]')
//     expect(conversationLink).toHaveClass('text-white', 'bg-white/10')
    
//     const dashboardLink = container.querySelector('a[href="/dashboard"]')
//     expect(dashboardLink).toHaveClass('text-zinc-400')
//     expect(dashboardLink).not.toHaveClass('text-white', 'bg-white/10')
//   })

  it('passes correct props to FreeCounter', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { getByTestId } = render(
      <Sidebar apiLimitCount={5} isPro={true} />
    )
    
    const freeCounter = getByTestId('free-counter')
    expect(freeCounter).toHaveAttribute('data-api-limit', '5')
    expect(freeCounter).toHaveAttribute('data-is-pro', 'true')
  })
})