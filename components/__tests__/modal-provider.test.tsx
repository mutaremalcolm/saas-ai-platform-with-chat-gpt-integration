import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ModalProvider } from '@/components/modal-provider'

// Mock ProModal component
vi.mock('@/components/pro-modal', () => ({
  ProModal: () => <div data-testid="pro-modal">Pro Modal</div>
}))

describe('ModalProvider', () => {
  it('renders ProModal component', () => {
    render(<ModalProvider />)

    expect(screen.getByTestId('pro-modal')).toBeInTheDocument()
  })

  it('renders ProModal after mounting', () => {
    const { container } = render(<ModalProvider />)

    expect(screen.getByTestId('pro-modal')).toBeInTheDocument()
    expect(container.firstChild).not.toBeNull()
  })

  it('wraps ProModal in Fragment', () => {
    const { container } = render(<ModalProvider />)

    // Fragment doesn't create a DOM node, so we check that ProModal is direct child
    expect(container.firstChild).toBe(screen.getByTestId('pro-modal'))
  })

  it('matches snapshot', () => {
    const { container } = render(<ModalProvider />)

    expect(container).toMatchSnapshot()
  })
})