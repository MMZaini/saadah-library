// Performance monitoring utilities

export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof performance !== 'undefined') {
    const start = performance.now()
    fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
  } else {
    fn()
  }
}

export const measureAsyncPerformance = async (name: string, fn: () => Promise<any>) => {
  if (typeof performance !== 'undefined') {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  } else {
    return await fn()
  }
}

// Debounce utility for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
