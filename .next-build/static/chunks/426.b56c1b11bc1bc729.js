'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [426],
  {
    3426: (e, l, r) => {
      ;(r.r(l), r.d(l, { default: () => i }))
      var s = r(5155),
        t = r(2115),
        o = r(9445),
        n = r(3962),
        a = r(5016),
        d = r(9057)
      function i(e) {
        var l, r
        let { bookConfig: i, className: c } = e,
          [u, m] = (0, t.useState)(() => {
            var e, l, r, s, t
            return (null == i ? void 0 : i.hasMultipleVolumes)
              ? null != (r = null == i || null == (e = i.volumes) ? void 0 : e[0])
                ? r
                : 'all'
              : null !=
                  (t =
                    null != (s = null == i || null == (l = i.volumes) ? void 0 : l[0])
                      ? s
                      : null == i
                        ? void 0
                        : i.bookId)
                ? t
                : 'all'
          }),
          [h, x] = (0, t.useState)(null),
          [v, f] = (0, t.useState)(!1),
          [b, g] = (0, t.useState)(null),
          p = (null == i ? void 0 : i.hasMultipleVolumes)
            ? null != (r = i.volumes)
              ? r
              : []
            : [null == i ? void 0 : i.bookId].filter((e) => !!e),
          j = !!(null == i ? void 0 : i.hasMultipleVolumes),
          N = (0, d.l)(p),
          w =
            (null == i ? void 0 : i.englishName) || (null == i ? void 0 : i.bookId) || 'This Book',
          k = (Array.isArray(p) && p.length) || 1,
          y = async (e) => {
            ;(f(!0), g(null), x(null))
            try {
              let l = null
              if ('all' === e) {
                let e = (p || []).filter(Boolean)
                if (0 === e.length) throw Error('No volumes available')
                let r = e[Math.floor(Math.random() * e.length)]
                l = await o.C$.getRandomHadithFromBook(r)
              } else l = await o.C$.getRandomHadithFromBook(e)
              x(l)
            } catch (e) {
              g('Failed to load hadith from this volume')
            } finally {
              f(!1)
            }
          }
        return (
          (0, t.useEffect)(() => {
            y(u)
          }, []),
          (0, s.jsxs)('div', {
            className: (0, a.cn)('space-y-6', c),
            children: [
              (0, s.jsxs)('div', {
                className: 'rounded-xl border border-border bg-surface-1 p-6',
                children: [
                  (0, s.jsxs)('div', {
                    className: 'mb-4 flex items-center gap-4',
                    children: [
                      (0, s.jsx)('div', {
                        className:
                          'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2',
                        children: (0, s.jsx)('svg', {
                          className: 'h-5 w-5 text-foreground-muted',
                          fill: 'none',
                          stroke: 'currentColor',
                          viewBox: '0 0 24 24',
                          children: (0, s.jsx)('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                          }),
                        }),
                      }),
                      (0, s.jsxs)('div', {
                        children: [
                          (0, s.jsxs)('h3', {
                            className: 'mb-1 text-lg font-bold text-foreground',
                            children: [w, ' Volume Explorer'],
                          }),
                          (0, s.jsxs)('p', {
                            className: 'text-sm text-foreground-muted',
                            children: [
                              w,
                              ' consists of ',
                              k,
                              ' volume',
                              1 === k ? '' : 's',
                              '. Select a specific volume or "All Volumes" to explore random hadiths.',
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, s.jsxs)('div', {
                    className:
                      'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
                    children: [
                      (0, s.jsx)('div', {
                        className: 'flex items-center gap-3',
                        children: j
                          ? (0, s.jsxs)(s.Fragment, {
                              children: [
                                (0, s.jsx)('label', {
                                  htmlFor: 'volume-select',
                                  className:
                                    'whitespace-nowrap text-sm font-semibold text-foreground-muted',
                                  children: 'Volume:',
                                }),
                                (0, s.jsxs)('div', {
                                  className: 'relative',
                                  children: [
                                    (0, s.jsx)('select', {
                                      id: 'volume-select',
                                      value: u,
                                      onChange: (e) => {
                                        var l
                                        ;(m(
                                          (l = 'all' === e.target.value ? 'all' : e.target.value),
                                        ),
                                          y(l))
                                      },
                                      disabled: v,
                                      className: (0, a.cn)(
                                        'appearance-none border border-border bg-background',
                                        'rounded-lg px-4 py-2.5 pr-12 font-semibold text-foreground',
                                        'transition-colors duration-200',
                                        'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                                        'min-w-[130px] cursor-pointer hover:border-zinc-600/50',
                                        v && 'cursor-not-allowed opacity-50',
                                      ),
                                      children: N.map((e) =>
                                        (0, s.jsx)(
                                          'option',
                                          { value: e.value, children: e.label },
                                          e.value,
                                        ),
                                      ),
                                    }),
                                    (0, s.jsx)('div', {
                                      className:
                                        'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
                                      children: (0, s.jsx)('svg', {
                                        className: 'h-4 w-4 text-foreground-muted',
                                        fill: 'none',
                                        stroke: 'currentColor',
                                        viewBox: '0 0 24 24',
                                        children: (0, s.jsx)('path', {
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
                            })
                          : (0, s.jsxs)('div', {
                              className: 'text-sm font-semibold text-foreground-muted',
                              children: [
                                'Volume:',
                                ' ',
                                (0, s.jsx)('span', {
                                  className: 'font-medium',
                                  children: (0, d.P)(p, null == (l = N[0]) ? void 0 : l.value),
                                }),
                              ],
                            }),
                      }),
                      (0, s.jsx)('button', {
                        onClick: () => y(u),
                        disabled: v,
                        className: (0, a.cn)(
                          'rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-foreground',
                          'hover:bg-accent/90 transition-colors duration-200',
                          v && 'cursor-not-allowed opacity-50',
                        ),
                        children: v
                          ? (0, s.jsxs)('div', {
                              className: 'flex items-center gap-2',
                              children: [
                                (0, s.jsx)('div', {
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
              b &&
                (0, s.jsx)('div', {
                  className:
                    'rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20',
                  children: (0, s.jsx)('p', {
                    className: 'text-sm text-red-800 dark:text-red-300',
                    children: b,
                  }),
                }),
              v &&
                (0, s.jsx)('div', {
                  className: 'border-theme bg-card shadow-soft rounded-xl border p-12',
                  children: (0, s.jsxs)('div', {
                    className: 'flex items-center justify-center',
                    children: [
                      (0, s.jsx)('div', {
                        className: 'border-primary h-8 w-8 animate-spin rounded-full border-b-2',
                      }),
                      (0, s.jsx)('span', {
                        className: 'text-muted ml-3',
                        children: 'Loading hadith...',
                      }),
                    ],
                  }),
                }),
              !v &&
                !b &&
                h &&
                (0, s.jsxs)(s.Fragment, {
                  children: [
                    (0, s.jsxs)('div', {
                      className:
                        'flex items-center justify-center gap-2 text-sm text-foreground-muted',
                      children: [
                        (0, s.jsx)('div', { className: 'bg-accent/60 h-2 w-2 rounded-full' }),
                        (0, s.jsxs)('span', {
                          children: [
                            'Random hadith from',
                            ' ',
                            'all' === u
                              ? 'All '.concat(w, ' Volumes')
                              : ''.concat(w, ' ').concat((0, d.P)(p, u)),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsx)(n.A, { hadith: h }),
                  ],
                }),
            ],
          })
        )
      }
    },
    9057: (e, l, r) => {
      function s(e) {
        let l = Array.isArray(e) && e.length > 0 ? e : []
        if (0 === l.length) return [{ value: 1, label: 'Volume 1' }]
        let r = l.map((e, l) => ({ value: e, label: 'Volume '.concat(l + 1) }))
        return (l.length > 1 && r.push({ value: 'all', label: 'All Volumes' }), r)
      }
      function t(e, l) {
        var r
        let t = s(e),
          o = t.find((e) => String(e.value) === String(l))
        return o ? o.label : (null == (r = t[0]) ? void 0 : r.label) || 'Volume 1'
      }
      r.d(l, { P: () => t, l: () => s })
    },
  },
])
