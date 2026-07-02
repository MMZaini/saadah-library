import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, throttle } from '../lib/performance'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('only invokes the function once after the wait elapses', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)

    debounced('a')
    debounced('b')
    debounced('c')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('restarts the wait on every call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)

    debounced()
    vi.advanceTimersByTime(150)
    debounced()
    vi.advanceTimersByTime(150)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('supports cancel', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('throttle', () => {
  it('invokes immediately, then suppresses calls inside the window', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('first')
    throttled('second')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('first')

    vi.advanceTimersByTime(100)
    throttled('third')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('third')
  })
})
