import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Empty } from '@/components/empty'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img 
      data-testid="empty-image" 
      src={src} 
      alt={alt}
      data-fill={fill}
      {...props} 
    />
  )
}))

describe('Empty', () => {
  it('renders with label text', () => {
    render(<Empty label="No conversation started." />)

    expect(screen.getByText('No conversation started.')).toBeInTheDocument()
  })

  it('renders empty state image with correct props', () => {
    render(<Empty label="No results." />)

    const image = screen.getByTestId('empty-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/empty.png')
    expect(image).toHaveAttribute('alt', 'Empty')
    expect(image).toHaveAttribute('data-fill', 'true')
  })

  it('applies correct wrapper styling', () => {
    const { container } = render(<Empty label="Empty state" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('h-full', 'p-20', 'flex', 'flex-col', 'items-center', 'justify-center')
  })

  it('applies correct label styling', () => {
    render(<Empty label="No data" />)

    const label = screen.getByText('No data')
    expect(label.tagName).toBe('P')
    expect(label).toHaveClass('text-muted-foreground', 'text-sm', 'text-center')
  })

  it('has correct image container structure', () => {
    const { container } = render(<Empty label="Test" />)

    const imageContainer = container.querySelector('.relative.h-72.w-72')
    expect(imageContainer).toBeInTheDocument()
  })

  it('renders different labels correctly', () => {
    const { rerender } = render(<Empty label="No images generated." />)
    expect(screen.getByText('No images generated.')).toBeInTheDocument()

    rerender(<Empty label="No music generated." />)
    expect(screen.getByText('No music generated.')).toBeInTheDocument()
  })

  it('matches snapshot', () => {
    const { container } = render(<Empty label="No conversation started." />)

    expect(container).toMatchSnapshot()
  })
})