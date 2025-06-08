import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Simple component for testing
function TestComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

describe('Sample Test', () => {
  it('renders component with text', () => {
    render(<TestComponent>Hello World</TestComponent>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})