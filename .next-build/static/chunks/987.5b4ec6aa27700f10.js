'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [987],
  {
    63: (e, t, r) => {
      var s = r(7260)
      ;(r.o(s, 'useParams') &&
        r.d(t, {
          useParams: function () {
            return s.useParams
          },
        }),
        r.o(s, 'usePathname') &&
          r.d(t, {
            usePathname: function () {
              return s.usePathname
            },
          }),
        r.o(s, 'useRouter') &&
          r.d(t, {
            useRouter: function () {
              return s.useRouter
            },
          }))
    },
    987: (e, t, r) => {
      ;(r.r(t), r.d(t, { default: () => i }))
      var s = r(5155),
        a = r(2115),
        n = r(63),
        o = r(9445),
        l = r(3243),
        c = r(5016)
      function i(e) {
        let { className: t } = e,
          r = (0, n.useRouter)(),
          i = (0, l.c)(),
          [d, u] = (0, a.useState)(1),
          [h, m] = (0, a.useState)({}),
          [x, p] = (0, a.useState)(new Set()),
          [f, g] = (0, a.useState)(!1),
          [v, b] = (0, a.useState)(null),
          [j, y] = (0, a.useState)(null),
          w = (0, a.useRef)(null),
          N = (0, a.useRef)(null),
          k = (0, a.useRef)(!1),
          C = (0, a.useRef)(null),
          z = (0, a.useRef)(null),
          I = (0, a.useRef)(!1),
          [S, T] = (0, a.useState)(null),
          [, L] = (0, a.useState)(null),
          M = (0, a.useRef)(null),
          P = Array.from({ length: 8 }, (e, t) => t + 1),
          R = [
            ...P.map((e) => ({ value: e, label: 'Volume '.concat(e) })),
            { value: 'all', label: 'All Volumes' },
          ]
        ;((0, a.useEffect)(() => {
          ;(async () => {
            ;(g(!0), b(null), p(new Set()))
            try {
              let e
              if (
                !(e =
                  'all' === d
                    ? (await Promise.all(P.map((e) => o.lH.getVolumeHadiths(e)))).flat()
                    : await o.lH.getVolumeHadiths(Number(d))) ||
                0 === e.length
              )
                return void b('No hadiths found for this selection')
              let t = {}
              ;(e.forEach((e) => {
                let r = e.category || 'Uncategorized',
                  s = e.chapter || 'No Chapter'
                ;(t[r] ||
                  (t[r] = {
                    category: r,
                    categoryId: e.categoryId || '',
                    chapters: {},
                    totalHadiths: 0,
                  }),
                  t[r].chapters[s] ||
                    (t[r].chapters[s] = {
                      chapter: s,
                      chapterInCategoryId: e.chapterInCategoryId || 0,
                      hadithCount: 0,
                    }),
                  t[r].chapters[s].hadithCount++,
                  t[r].totalHadiths++)
              }),
                Object.values(t).forEach((e) => {
                  let t = {}
                  ;(Object.entries(e.chapters)
                    .sort((e, t) => {
                      let [, r] = e,
                        [, s] = t
                      return r.chapterInCategoryId - s.chapterInCategoryId
                    })
                    .forEach((e) => {
                      let [r, s] = e
                      t[r] = s
                    }),
                    (e.chapters = t))
                }),
                m(t))
            } catch (e) {
              b('Failed to load structure for selected volume(s)')
            } finally {
              g(!1)
            }
          })()
        }, [d]),
          (0, a.useEffect)(
            () => () => {
              ;(w.current && window.clearTimeout(w.current),
                N.current && window.clearTimeout(N.current),
                M.current && window.clearTimeout(M.current))
            },
            [],
          ))
        let E = (e, t) => {
            i.saveScrollPosition(window.scrollY)
            let s = 'all' === d ? 1 : d
            r.push('/al-kafi/volume/'.concat(s, '/chapter/').concat(e, '/').concat(t))
          },
          H = () => {
            w.current && (window.clearTimeout(w.current), (w.current = null))
          },
          O = () => {
            ;(N.current && (window.clearTimeout(N.current), (N.current = null)),
              (N.current = window.setTimeout(() => {
                y(null)
              }, 1600)))
          },
          B = () => Object.values(h).reduce((e, t) => e + t.totalHadiths, 0)
        return (0, s.jsxs)('div', {
          className: (0, c.cn)('space-y-6', t),
          children: [
            (0, s.jsxs)('div', {
              className: 'rounded-xl border border-border bg-surface-1 p-6',
              children: [
                (0, s.jsxs)('div', {
                  className: 'mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center',
                  children: [
                    (0, s.jsxs)('div', {
                      className: 'flex items-center gap-4',
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
                            (0, s.jsx)('h3', {
                              className: 'text-primary mb-1 text-lg font-bold',
                              children: 'Al-Kāfi Volume Explorer',
                            }),
                            (0, s.jsx)('p', {
                              className: 'text-secondary text-sm',
                              children:
                                'Browse Al-Kāfi volumes individually or view the complete collection structure',
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsx)('div', {
                      className: 'flex items-center gap-4',
                      children: (0, s.jsxs)('div', {
                        className: 'relative',
                        children: [
                          (0, s.jsx)('select', {
                            value: d,
                            onChange: (e) => {
                              let t = e.target.value
                              u('all' === t ? 'all' : isNaN(Number(t)) ? t : Number(t))
                            },
                            disabled: f,
                            className: (0, c.cn)(
                              'border-theme bg-card appearance-none border',
                              'text-primary rounded-xl px-4 py-3 pr-12 text-lg font-semibold',
                              'hover:shadow-medium shadow-soft transition-all duration-200',
                              'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                              'min-w-[200px] max-w-[300px] cursor-pointer hover:border-zinc-600/50',
                              f && 'cursor-not-allowed opacity-50',
                            ),
                            children: R.map((e) =>
                              (0, s.jsx)(
                                'option',
                                { value: e.value, children: e.label },
                                String(e.value),
                              ),
                            ),
                          }),
                          (0, s.jsx)('div', {
                            className:
                              'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
                            children: (0, s.jsx)('svg', {
                              className: 'text-secondary h-5 w-5',
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
                    }),
                  ],
                }),
                !f &&
                  B() > 0 &&
                  (0, s.jsxs)('div', {
                    className: 'border-theme flex flex-wrap items-center gap-4 border-t pt-4',
                    children: [
                      (0, s.jsxs)('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, s.jsx)('div', { className: 'h-3 w-3 rounded-full bg-accent' }),
                          (0, s.jsxs)('span', {
                            className: 'text-primary text-sm font-semibold',
                            children: [B().toLocaleString(), ' hadiths'],
                          }),
                        ],
                      }),
                      (0, s.jsxs)('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, s.jsx)('div', {
                            className: 'h-3 w-3 rounded-full bg-foreground-faint',
                          }),
                          (0, s.jsxs)('span', {
                            className: 'text-primary text-sm font-semibold',
                            children: [Object.keys(h).length, ' categories'],
                          }),
                        ],
                      }),
                      (0, s.jsxs)('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, s.jsx)('div', {
                            className: 'h-3 w-3 rounded-full bg-foreground-faint',
                          }),
                          (0, s.jsx)('span', {
                            className: 'text-primary text-sm font-semibold',
                            children:
                              'all' === d ? 'All Al-Kāfi Volumes' : 'Al-Kāfi Volume '.concat(d),
                          }),
                        ],
                      }),
                    ],
                  }),
                (0, s.jsx)('p', {
                  className: 'text-secondary mt-4 text-sm',
                  children:
                    'Browse the complete structure of the selected book. Click on categories to expand them and view chapters. Click on any chapter to read all hadiths in that chapter.',
                }),
              ],
            }),
            f &&
              (0, s.jsx)('div', {
                className: 'border-theme bg-card shadow-soft rounded-xl border p-12',
                children: (0, s.jsxs)('div', {
                  className: 'flex items-center justify-center',
                  children: [
                    (0, s.jsx)('div', {
                      className: 'h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-400',
                    }),
                    (0, s.jsx)('span', {
                      className: 'text-secondary ml-3',
                      children: 'Loading book structure...',
                    }),
                  ],
                }),
              }),
            v &&
              (0, s.jsx)('div', {
                className:
                  'shadow-soft rounded-xl border border-red-200/60 bg-red-50/80 p-6 dark:border-red-800/30 dark:bg-red-900/20',
                children: (0, s.jsx)('p', {
                  className: 'text-red-800 dark:text-red-300',
                  children: v,
                }),
              }),
            !f &&
              !v &&
              Object.keys(h).length > 0 &&
              (0, s.jsx)('div', {
                className: 'space-y-6',
                children: Object.entries(h).map((e) => {
                  let [t, r] = e
                  return (0, s.jsxs)(
                    'div',
                    {
                      className:
                        'border-theme hover:shadow-medium bg-card shadow-soft overflow-y-hidden overflow-x-visible rounded-2xl border transition-all duration-200',
                      children: [
                        (0, s.jsxs)('button', {
                          onClick: () =>
                            ((e) => {
                              let t = new Set(x)
                              ;(t.has(e) ? t.delete(e) : t.add(e), p(t))
                            })(t),
                          className:
                            'hover:bg-card-hover group flex w-full items-center justify-between px-6 py-5 transition-all duration-200',
                          children: [
                            (0, s.jsxs)('div', {
                              className: 'flex items-center gap-4',
                              children: [
                                (0, s.jsx)('div', {
                                  className: 'transition-transform duration-200 '.concat(
                                    x.has(t) ? 'rotate-90' : 'rotate-0',
                                  ),
                                  children: (0, s.jsx)('div', {
                                    className:
                                      'flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 transition-all duration-200 group-hover:bg-zinc-700',
                                    children: (0, s.jsx)('svg', {
                                      className: 'h-4 w-4 text-zinc-400',
                                      fill: 'none',
                                      stroke: 'currentColor',
                                      viewBox: '0 0 24 24',
                                      children: (0, s.jsx)('path', {
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        strokeWidth: 2,
                                        d: 'M9 5l7 7-7 7',
                                      }),
                                    }),
                                  }),
                                }),
                                (0, s.jsx)('h3', {
                                  className:
                                    'text-primary text-left text-lg font-bold transition-colors group-hover:text-foreground',
                                  children: r.category,
                                }),
                              ],
                            }),
                            (0, s.jsxs)('div', {
                              className: 'flex items-center gap-4',
                              children: [
                                (0, s.jsxs)('div', {
                                  className: 'text-right',
                                  children: [
                                    (0, s.jsxs)('div', {
                                      className: 'text-primary text-sm font-semibold',
                                      children: [r.totalHadiths, ' hadiths'],
                                    }),
                                    (0, s.jsxs)('div', {
                                      className: 'text-secondary text-xs',
                                      children: [Object.keys(r.chapters).length, ' chapters'],
                                    }),
                                  ],
                                }),
                                (0, s.jsx)('div', {
                                  className: 'h-12 w-1 rounded-full bg-zinc-700',
                                }),
                              ],
                            }),
                          ],
                        }),
                        x.has(t) &&
                          (0, s.jsx)('div', {
                            className:
                              'border-theme from-card/50 to-card/30 border-t bg-gradient-to-r p-4 duration-300 animate-in slide-in-from-top-2 sm:p-6',
                            children: (0, s.jsx)('div', {
                              className:
                                'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4',
                              children: Object.entries(r.chapters).map((e) => {
                                let t,
                                  a,
                                  n,
                                  [o, l] = e,
                                  i =
                                    ((t = r.categoryId),
                                    (a = l.chapterInCategoryId),
                                    ''.concat(t, '-').concat(a)),
                                  d = j === i
                                return (0, s.jsxs)(
                                  'button',
                                  {
                                    onClick: (e) => {
                                      if (k.current) {
                                        ;(e.preventDefault(), e.stopPropagation(), (k.current = !1))
                                        return
                                      }
                                      E(r.categoryId, l.chapterInCategoryId)
                                    },
                                    ...((n = () => E(r.categoryId, l.chapterInCategoryId)),
                                    {
                                      onTouchStart: (e) => {
                                        let t = e.touches && e.touches[0]
                                        ;(t && (C.current = { x: t.clientX, y: t.clientY }),
                                          (z.current = Date.now()),
                                          (I.current = !1),
                                          H(),
                                          (w.current = window.setTimeout(() => {
                                            ;((I.current = !0), y(i), O())
                                          }, 250)))
                                      },
                                      onTouchMove: (e) => {
                                        let t = C.current,
                                          r = e.touches && e.touches[0]
                                        if (!t || !r) return
                                        let s = Math.abs(r.clientX - t.x),
                                          a = Math.abs(r.clientY - t.y)
                                        ;(s > 20 || a > 20) && (k.current = !0)
                                      },
                                      onTouchEnd: (e) => {
                                        let t = z.current || Date.now(),
                                          r = Date.now() - t
                                        if (
                                          (H(),
                                          (C.current = null),
                                          (z.current = null),
                                          !I.current && r < 250)
                                        ) {
                                          ;(e.preventDefault(),
                                            e.stopPropagation(),
                                            (k.current = !0),
                                            n())
                                          return
                                        }
                                        j === i && O()
                                      },
                                      onTouchCancel: () => {
                                        ;(H(),
                                          (C.current = null),
                                          (z.current = null),
                                          j === i && O())
                                      },
                                    }),
                                    'aria-expanded': d,
                                    onMouseEnter: () => {
                                      ;(L(null), T(i))
                                    },
                                    onMouseLeave: () => {
                                      ;(T(null),
                                        L(i),
                                        M.current && window.clearTimeout(M.current),
                                        (M.current = window.setTimeout(() => {
                                          L(null)
                                        }, 900)))
                                    },
                                    onMouseMove: (e) => {
                                      let t = e.currentTarget,
                                        r = t.getBoundingClientRect(),
                                        s = e.clientX - r.left,
                                        a = e.clientY - r.top
                                      ;(t.style.setProperty('--mx', ''.concat(s, 'px')),
                                        t.style.setProperty('--my', ''.concat(a, 'px')))
                                    },
                                    className: (0, c.cn)(
                                      'border-theme bg-card group relative rounded-xl border text-left',
                                      'p-4 transition-all duration-500 ease-out sm:p-5',
                                      'touch-manipulation select-none',
                                      'shadow-soft hover:shadow-md',
                                      'hover:border-zinc-600 md:hover:ring-1 md:hover:ring-zinc-700/30',
                                      'md:hover:translate-y-[-2px]',
                                      d &&
                                        'z-10 translate-y-[-2px] border-zinc-600 md:p-5 md:shadow-md md:ring-1 md:ring-zinc-700/30',
                                    ),
                                    style: { transform: d ? 'translateY(-2px)' : void 0 },
                                    children: [
                                      (0, s.jsxs)('div', {
                                        className:
                                          'pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl',
                                        children: [
                                          (0, s.jsx)('div', {
                                            className: (0, c.cn)(
                                              'absolute inset-0 bg-zinc-900/40',
                                              'transition-opacity duration-500 ease-in-out',
                                              S === i && 'opacity-100',
                                              S !== i && 'opacity-0',
                                              d && 'opacity-100',
                                            ),
                                          }),
                                          (0, s.jsx)('div', {
                                            className: (0, c.cn)(
                                              'absolute inset-0 opacity-0 transition-opacity duration-500 ease-out md:group-hover:opacity-40',
                                              d && 'md:opacity-40',
                                            ),
                                            style: {
                                              background:
                                                'radial-gradient(180px circle at var(--mx) var(--my), rgba(255, 255, 255, 0.035), rgba(0,0,0,0) 60%)',
                                            },
                                          }),
                                        ],
                                      }),
                                      (0, s.jsx)('div', {
                                        className:
                                          'absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200',
                                        children: l.chapterInCategoryId,
                                      }),
                                      (0, s.jsxs)('div', {
                                        className: (0, c.cn)(
                                          'overflow-hidden pr-4',
                                          'relative z-10 transition-[max-height] duration-700 ease-smooth-expand md:duration-1100',
                                          'max-h-24',
                                          'md:group-hover:max-h-[500px]',
                                        ),
                                        style: {
                                          willChange: 'max-height',
                                          maxHeight: d ? '500px' : void 0,
                                        },
                                        children: [
                                          (0, s.jsx)('h4', {
                                            className: (0, c.cn)(
                                              'text-primary mb-3 font-semibold leading-snug transition-colors',
                                              'group-hover:text-foreground',
                                              d && 'text-foreground',
                                              'line-clamp-2',
                                              'md:group-hover:line-clamp-none',
                                              d && 'line-clamp-none',
                                            ),
                                            children: l.chapter,
                                          }),
                                          (0, s.jsxs)('div', {
                                            className: 'flex items-center justify-between',
                                            children: [
                                              (0, s.jsxs)('div', {
                                                className: 'flex items-center gap-2',
                                                children: [
                                                  (0, s.jsx)('div', {
                                                    className: 'h-2 w-2 rounded-full bg-accent',
                                                  }),
                                                  (0, s.jsxs)('span', {
                                                    className: 'text-secondary text-sm font-medium',
                                                    children: [
                                                      l.hadithCount,
                                                      ' ',
                                                      1 === l.hadithCount ? 'hadith' : 'hadiths',
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              (0, s.jsx)('div', {
                                                className:
                                                  'text-secondary flex items-center gap-1 transition-colors group-hover:text-foreground-muted',
                                                children: (0, s.jsx)('svg', {
                                                  className: 'h-4 w-4',
                                                  fill: 'none',
                                                  stroke: 'currentColor',
                                                  viewBox: '0 0 24 24',
                                                  children: (0, s.jsx)('path', {
                                                    strokeLinecap: 'round',
                                                    strokeLinejoin: 'round',
                                                    strokeWidth: 2,
                                                    d: 'M9 5l7 7-7 7',
                                                  }),
                                                }),
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  },
                                  o,
                                )
                              }),
                            }),
                          }),
                      ],
                    },
                    t,
                  )
                }),
              }),
            !f &&
              !v &&
              0 === Object.keys(h).length &&
              (0, s.jsxs)('div', {
                className:
                  'border-theme from-card to-card/50 shadow-soft rounded-2xl border bg-gradient-to-br p-12 text-center',
                children: [
                  (0, s.jsx)('div', {
                    className:
                      'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800',
                    children: (0, s.jsx)('svg', {
                      className: 'h-8 w-8 text-zinc-500',
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24',
                      children: (0, s.jsx)('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 1.5,
                        d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                      }),
                    }),
                  }),
                  (0, s.jsx)('h3', {
                    className: 'text-primary mb-2 text-lg font-semibold',
                    children: 'No chapters found',
                  }),
                  (0, s.jsx)('p', {
                    className: 'text-secondary',
                    children: 'The selected book appears to be empty or still loading.',
                  }),
                ],
              }),
          ],
        })
      }
    },
  },
])
