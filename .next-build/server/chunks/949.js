'use strict'
;((exports.id = 949),
  (exports.ids = [949]),
  (exports.modules = {
    76949: (a, b, c) => {
      ;(c.r(b), c.d(b, { default: () => i }))
      var d = c(21124),
        e = c(38301),
        f = c(94348),
        g = c(36818),
        h = c(15514)
      function i({ className: a }) {
        let [b, c] = (0, e.useState)(1),
          [i, j] = (0, e.useState)(null),
          [k, l] = (0, e.useState)(!1),
          [m, n] = (0, e.useState)(null),
          o = [
            ...Array.from({ length: 8 }, (a, b) => b + 1).map((a) => ({
              value: a,
              label: `Volume ${a}`,
            })),
            { value: 'all', label: 'All Volumes' },
          ],
          p = async (a) => {
            ;(l(!0), n(null))
            try {
              let b
              if ('all' === a) {
                let a = Math.floor(8 * Math.random()) + 1
                b = await f.lH.getRandomHadithFromVolume(a)
              } else b = await f.lH.getRandomHadithFromVolume(a)
              j(b)
            } catch {
              n('Failed to load hadith from this volume')
            } finally {
              l(!1)
            }
          }
        return (0, d.jsxs)('div', {
          className: (0, h.cn)('space-y-6', a),
          children: [
            (0, d.jsxs)('div', {
              className: 'rounded-xl border border-border bg-surface-1 p-6',
              children: [
                (0, d.jsxs)('div', {
                  className: 'mb-4 flex items-center gap-4',
                  children: [
                    (0, d.jsx)('div', {
                      className:
                        'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2',
                      children: (0, d.jsx)('svg', {
                        className: 'h-5 w-5 text-foreground-muted',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24',
                        children: (0, d.jsx)('path', {
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          strokeWidth: 2,
                          d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                        }),
                      }),
                    }),
                    (0, d.jsxs)('div', {
                      children: [
                        (0, d.jsx)('h3', {
                          className: 'mb-1 text-lg font-bold text-foreground',
                          children: 'Al-Kāfi Volume Explorer',
                        }),
                        (0, d.jsx)('p', {
                          className: 'text-sm text-foreground-muted',
                          children:
                            'Al-Kāfi consists of 8 volumes. Select a specific volume or "All Volumes" to explore random hadiths.',
                        }),
                      ],
                    }),
                  ],
                }),
                (0, d.jsxs)('div', {
                  className:
                    'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
                  children: [
                    (0, d.jsxs)('div', {
                      className: 'flex items-center gap-3',
                      children: [
                        (0, d.jsx)('label', {
                          htmlFor: 'volume-select',
                          className:
                            'whitespace-nowrap text-sm font-semibold text-foreground-muted',
                          children: 'Volume:',
                        }),
                        (0, d.jsxs)('div', {
                          className: 'relative',
                          children: [
                            (0, d.jsx)('select', {
                              id: 'volume-select',
                              value: b,
                              onChange: (a) => {
                                var b
                                ;(c(
                                  (b = 'all' === a.target.value ? 'all' : Number(a.target.value)),
                                ),
                                  p(b))
                              },
                              disabled: k,
                              className: (0, h.cn)(
                                'appearance-none border border-border bg-background',
                                'rounded-lg px-4 py-2.5 pr-12 font-semibold text-foreground',
                                'transition-colors duration-200',
                                'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                                'min-w-[130px] cursor-pointer hover:border-zinc-600/50',
                                k && 'cursor-not-allowed opacity-50',
                              ),
                              children: o.map((a) =>
                                (0, d.jsx)(
                                  'option',
                                  { value: a.value, children: a.label },
                                  a.value,
                                ),
                              ),
                            }),
                            (0, d.jsx)('div', {
                              className:
                                'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
                              children: (0, d.jsx)('svg', {
                                className: 'h-4 w-4 text-foreground-muted',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24',
                                children: (0, d.jsx)('path', {
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                  strokeWidth: 2,
                                  d: 'M19 9l-7 7-7-7',
                                }),
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, d.jsx)('button', {
                      onClick: () => p(b),
                      disabled: k,
                      className: (0, h.cn)(
                        'rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-foreground',
                        'hover:bg-accent/90 transition-colors duration-200',
                        k && 'cursor-not-allowed opacity-50',
                      ),
                      children: k
                        ? (0, d.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, d.jsx)('div', {
                                className:
                                  'h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white',
                              }),
                              'Loading...',
                            ],
                          })
                        : 'New Hadith',
                    }),
                  ],
                }),
              ],
            }),
            m &&
              (0, d.jsx)('div', {
                className:
                  'rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20',
                children: (0, d.jsx)('p', {
                  className: 'text-sm text-red-800 dark:text-red-300',
                  children: m,
                }),
              }),
            k &&
              (0, d.jsx)('div', {
                className: 'border-theme bg-card shadow-soft rounded-xl border p-12',
                children: (0, d.jsxs)('div', {
                  className: 'flex items-center justify-center',
                  children: [
                    (0, d.jsx)('div', {
                      className: 'border-primary h-8 w-8 animate-spin rounded-full border-b-2',
                    }),
                    (0, d.jsxs)('span', {
                      className: 'text-muted ml-3',
                      children: [
                        'Loading hadith from',
                        ' ',
                        'all' === b ? 'All Al-Kāfi Volumes' : `Volume ${b}`,
                        '...',
                      ],
                    }),
                  ],
                }),
              }),
            !k &&
              !m &&
              i &&
              (0, d.jsxs)(d.Fragment, {
                children: [
                  (0, d.jsxs)('div', {
                    className:
                      'flex items-center justify-center gap-2 text-sm text-foreground-muted',
                    children: [
                      (0, d.jsx)('div', { className: 'bg-accent/60 h-2 w-2 rounded-full' }),
                      (0, d.jsxs)('span', {
                        children: [
                          'Random hadith from',
                          ' ',
                          'all' === b ? 'All Al-Kāfi Volumes' : `Al-Kāfi Volume ${b}`,
                        ],
                      }),
                    ],
                  }),
                  (0, d.jsx)(g.A, { hadith: i }),
                ],
              }),
          ],
        })
      }
    },
  }))
