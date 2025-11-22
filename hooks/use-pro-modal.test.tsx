import { describe, it, expect, beforeEach } from 'vitest'
import { useProModal } from '@/hooks/use-pro-modal'
import { renderHook, act } from '@testing-library/react'

describe('useProModal', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useProModal())
    act(() => {
      result.current.onClose()
    })
  })

  it('has correct initial state', () => {
    const { result } = renderHook(() => useProModal())

    expect(result.current.isOpen).toBe(false)
    expect(typeof result.current.onOpen).toBe('function')
    expect(typeof result.current.onClose).toBe('function')
  })

  it('opens modal when onOpen is called', () => {
    const { result } = renderHook(() => useProModal())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.onOpen()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('closes modal when onClose is called', () => {
    const { result } = renderHook(() => useProModal())

    // First open the modal
    act(() => {
      result.current.onOpen()
    })

    expect(result.current.isOpen).toBe(true)

    // Then close it
    act(() => {
      result.current.onClose()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('can toggle modal state multiple times', () => {
    const { result } = renderHook(() => useProModal())

    // Open
    act(() => {
      result.current.onOpen()
    })
    expect(result.current.isOpen).toBe(true)

    // Close
    act(() => {
      result.current.onClose()
    })
    expect(result.current.isOpen).toBe(false)

    // Open again
    act(() => {
      result.current.onOpen()
    })
    expect(result.current.isOpen).toBe(true)

    // Close again
    act(() => {
      result.current.onClose()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('calling onOpen multiple times keeps modal open', () => {
    const { result } = renderHook(() => useProModal())

    act(() => {
      result.current.onOpen()
      result.current.onOpen()
      result.current.onOpen()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('calling onClose multiple times keeps modal closed', () => {
    const { result } = renderHook(() => useProModal())

    act(() => {
      result.current.onOpen()
    })

    act(() => {
      result.current.onClose()
      result.current.onClose()
      result.current.onClose()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('maintains state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useProModal())
    const { result: result2 } = renderHook(() => useProModal())

    act(() => {
      result1.current.onOpen()
    })

    expect(result1.current.isOpen).toBe(true)
    expect(result2.current.isOpen).toBe(true)
  })
})