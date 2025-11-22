import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Loader } from '@/components/loader'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img 
      data-testid="loader-image" 
      src={src} 
      alt={alt}
      data-fill={fill}
      {...props} 
    />
  )
}))

describe('Loader', () => {
  it('renders loader with logo image', () => {
    render(<Loader />)

    const image = screen.getByTestId('loader-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/logo.png')
    expect(image).toHaveAttribute('alt', 'logo')
    expect(image).toHaveAttribute('data-fill', 'true')
  })

  it('renders loading text', () => {
    render(<Loader />)

    expect(screen.getByText('Genius is thinking...')).toBeInTheDocument()
  })

  it('applies animation to image container', () => {
    const { container } = render(<Loader />)

    const imageContainer = container.querySelector('.animate-spin')
    expect(imageContainer).toBeInTheDocument()
    expect(imageContainer).toHaveClass('w-10', 'h-10', 'relative')
  })

  it('applies correct wrapper styling', () => {
    const { container } = render(<Loader />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('h-full', 'flex', 'flex-col', 'gap-y-4', 'items-center', 'justify-center')
  })

  it('applies correct text styling', () => {
    render(<Loader />)

    const text = screen.getByText('Genius is thinking...')
    expect(text.tagName).toBe('P')
    expect(text).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('matches snapshot', () => {
    const { container } = render(<Loader />)

    expect(container).toMatchSnapshot()
  })
})