'use client'

import { useEffect } from 'react'

export default function VSCodeClassCleaner() {
  useEffect(() => {
    const cleanVSCodeClasses = () => {
      try {
        const body = document.body
        const html = document.documentElement

        if (body && body.className) {
          const cleanClassName = body.className
            .replace(/\bvsc-[^\s]*\b/g, '')
            .replace(/\bvsc-initialized\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          if (body.className !== cleanClassName) {
            body.className = cleanClassName
          }
        }

        if (html && html.className) {
          const cleanClassName = html.className
            .replace(/\bvsc-[^\s]*\b/g, '')
            .replace(/\bvsc-initialized\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          if (html.className !== cleanClassName) {
            html.className = cleanClassName
          }
        }
      } catch (e) {
        // Silent fail
      }
    }

    // Clean immediately on mount
    cleanVSCodeClasses()

    // Set up a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as Element
          if (target === document.body || target === document.documentElement) {
            if (target.className && /\bvsc-/.test(target.className)) {
              cleanVSCodeClasses()
            }
          }
        }
      }
    })

    // Observe both body and html for class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
