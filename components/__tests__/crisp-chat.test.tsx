import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CrispChat } from '@/components/crisp-chat'

// Mock Crisp SDK
vi.mock('crisp-sdk-web', () => ({
  Crisp: {
    configure: vi.fn()
  }
}))

import { Crisp } from 'crisp-sdk-web'

describe('CrispChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing (returns null)', () => {
    const { container } = render(<CrispChat />)
    
    expect(container.firstChild).toBeNull()
  })

  it('configures Crisp with correct website ID on mount', () => {
    render(<CrispChat />)
    
    expect(Crisp.configure).toHaveBeenCalledWith('64a75d5e-ac7a-4e35-911a-ec7897740e2a')
    expect(Crisp.configure).toHaveBeenCalledTimes(1)
  })

  it('only configures Crisp once even with multiple renders', () => {
    const { rerender } = render(<CrispChat />)
    
    expect(Crisp.configure).toHaveBeenCalledTimes(1)
    
    rerender(<CrispChat />)
    
    // Should still only be called once due to empty dependency array
    expect(Crisp.configure).toHaveBeenCalledTimes(1)
  })

  it('configures Crisp on each new component mount', () => {
    const { unmount } = render(<CrispChat />)
    
    expect(Crisp.configure).toHaveBeenCalledTimes(1)
    
    unmount()
    
    render(<CrispChat />)
    
    // Should be called again on new mount
    expect(Crisp.configure).toHaveBeenCalledTimes(2)
  })
})