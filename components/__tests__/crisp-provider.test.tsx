import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CrispProvider } from '@/components/crisp-provider'

// Mock CrispChat component
vi.mock('@/components/crisp-chat', () => ({
  CrispChat: () => <div data-testid="crisp-chat">Crisp Chat</div>
}))

describe('CrispProvider', () => {
  it('renders CrispChat component', () => {
    render(<CrispProvider />)
    
    expect(screen.getByTestId('crisp-chat')).toBeInTheDocument()
  })

  it('renders nothing else besides CrispChat', () => {
    const { container } = render(<CrispProvider />)
    
    expect(screen.getByTestId('crisp-chat')).toBeInTheDocument()
    expect(container.firstChild).toBe(screen.getByTestId('crisp-chat'))
  })

  it('matches snapshot', () => {
    const { container } = render(<CrispProvider />)
    
    expect(container).toMatchSnapshot()
  })
})