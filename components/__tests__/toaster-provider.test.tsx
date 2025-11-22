import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToasterProvider } from '@/components/toaster-provider'

// Mock react-hot-toast Toaster component
vi.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}))

describe('ToasterProvider', () => {
  it('renders Toaster component', () => {
    render(<ToasterProvider />)

    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('renders Toaster as only child', () => {
    const { container } = render(<ToasterProvider />)

    expect(container.firstChild).toBe(screen.getByTestId('toaster'))
  })

  it('matches snapshot', () => {
    const { container } = render(<ToasterProvider />)

    expect(container).toMatchSnapshot()
  })
})