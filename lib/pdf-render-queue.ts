// Concurrency limiter for pdf.js page work (getPage + render).
//
// pdf.js runs on a *single* web worker, so firing dozens of renders at once —
// e.g. a screenful of sidebar thumbnails, or every selected page in the main
// viewer — floods that worker. Every canvas then stays blank until the backlog
// drains, which is the "pages load white for a few seconds" symptom. This
// scheduler caps how many renders run concurrently and always starts the
// highest-priority waiter next (the page nearest the viewport / the active page),
// so the visible work finishes first and the worker is never swamped.

interface Waiter {
  priority: number
  start: () => void
  reject: (reason: unknown) => void
  detach: () => void
}

function abortReason(signal: AbortSignal): unknown {
  // `signal.reason` exists in modern browsers; fall back for older engines.
  return signal.reason ?? new DOMException('Aborted', 'AbortError')
}

class RenderScheduler {
  private active = 0
  private readonly waiters: Waiter[] = []

  constructor(private readonly maxConcurrent: number) {}

  /**
   * Schedules `task` to run once a slot is free. Higher `priority` runs first.
   * If `signal` is provided, aborting it before the task starts removes it from
   * the queue (rejecting the returned promise); the same signal is passed to the
   * task so in-flight work can cancel its own render.
   */
  run<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    opts: { priority?: number; signal?: AbortSignal } = {},
  ): Promise<T> {
    const { priority = 0, signal } = opts
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortReason(signal))
        return
      }

      const onAbort = signal
        ? () => {
            const index = this.waiters.indexOf(waiter)
            if (index !== -1) {
              this.waiters.splice(index, 1)
              waiter.detach()
              reject(abortReason(signal))
            }
          }
        : null

      const waiter: Waiter = {
        priority,
        reject,
        detach: () => {
          if (signal && onAbort) signal.removeEventListener('abort', onAbort)
        },
        start: () => {
          waiter.detach()
          this.active++
          Promise.resolve()
            .then(() => task(signal))
            .then(resolve, reject)
            .finally(() => {
              this.active--
              this.pump()
            })
        },
      }

      if (signal && onAbort) signal.addEventListener('abort', onAbort)
      this.waiters.push(waiter)
      this.pump()
    })
  }

  private pump(): void {
    while (this.active < this.maxConcurrent && this.waiters.length > 0) {
      let bestIndex = 0
      for (let i = 1; i < this.waiters.length; i++) {
        if (this.waiters[i].priority > this.waiters[bestIndex].priority) bestIndex = i
      }
      const [waiter] = this.waiters.splice(bestIndex, 1)
      waiter.start()
    }
  }
}

// Shared across thumbnails and the main viewer because they contend for the one
// worker. 3 lets a couple of renders overlap their decode/IO without starving
// the higher-priority page the user is actually looking at.
export const pdfRenderScheduler = new RenderScheduler(3)

// Priority tiers (higher = sooner). Keep callers consistent.
export const RENDER_PRIORITY = {
  activePage: 100,
  visiblePage: 50,
  thumbnail: 10,
} as const
