import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LandingContent } from '@/components/landing-content'

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  )
}))

describe('LandingContent', () => {
  it('renders the testimonials heading', () => {
    render(<LandingContent />)

    const heading = screen.getByText('Testimonionals')
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H2')
  })

  it('applies correct heading styling', () => {
    render(<LandingContent />)

    const heading = screen.getByText('Testimonionals')
    expect(heading).toHaveClass('text-center', 'text-4xl', 'text-white', 'font-extrabold', 'mb-10')
  })

  it('renders all three testimonial cards', () => {
    render(<LandingContent />)

    const cards = screen.getAllByTestId('card')
    expect(cards).toHaveLength(3)
  })

  it('applies correct card styling', () => {
    render(<LandingContent />)

    const cards = screen.getAllByTestId('card')
    cards.forEach(card => {
      expect(card).toHaveClass('bg-[#192339]', 'border-none', 'text-white')
    })
  })

  it('renders testimonial names correctly', () => {
    render(<LandingContent />)

    expect(screen.getByText('Tendai')).toBeInTheDocument()
    expect(screen.getByText('Rebotile')).toBeInTheDocument()
    expect(screen.getByText('Modika')).toBeInTheDocument()
  })

  it('renders testimonial titles correctly', () => {
    render(<LandingContent />)

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Quality Assurance')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Engineer')).toBeInTheDocument()
  })

  it('renders testimonial descriptions', () => {
    render(<LandingContent />)

    const descriptions = screen.getAllByText("This is the best application I've used!")
    expect(descriptions).toHaveLength(3)
  })

  it('applies correct wrapper styling', () => {
    const { container } = render(<LandingContent />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('px-10', 'pb-20')
  })

  it('applies correct grid styling', () => {
    const { container } = render(<LandingContent />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-3', 'gap-4')
  })

  it('renders name with correct text size', () => {
    const { container } = render(<LandingContent />)

    const names = container.querySelectorAll('.text-lg')
    expect(names).toHaveLength(3)
  })

  it('applies correct styling to job titles', () => {
    const { container } = render(<LandingContent />)

    const title = screen.getByText('Software Engineer')
    expect(title).toHaveClass('text-zinc-400', 'text-sm')
  })

  it('applies correct CardTitle styling', () => {
    render(<LandingContent />)

    const cardTitles = screen.getAllByTestId('card-title')
    cardTitles.forEach(title => {
      expect(title).toHaveClass('flex', 'items-center', 'gap-x-2')
    })
  })

  it('applies correct CardContent styling', () => {
    render(<LandingContent />)

    const cardContents = screen.getAllByTestId('card-content')
    cardContents.forEach(content => {
      expect(content).toHaveClass('pt-4', 'px-0')
    })
  })

  it('matches snapshot', () => {
    const { container } = render(<LandingContent />)

    expect(container).toMatchSnapshot()
  })
})