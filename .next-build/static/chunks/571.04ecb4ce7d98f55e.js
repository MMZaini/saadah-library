'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [571],
  {
    952: (e, t, r) => {
      ;(r.r(t), r.d(t, { default: () => u }))
      var s = r(5155),
        n = r(2115),
        a = r(63),
        l = r(9445),
        o = r(3243),
        i = r(5016),
        c = r(9057)
      function d(e) {
        var t
        let { bookId: r, bookName: d, volumes: u, baseRoute: h, className: m } = e,
          x = (0, a.useRouter)(),
          p = (0, o.c)(),
          [f, g] = (0, n.useState)(() => (u && 0 !== u.length ? u[0] : 'all')),
          [v, b] = (0, n.useState)({}),
          [j, N] = (0, n.useState)(new Set()),
          [w, y] = (0, n.useState)(!1),
          [k, C] = (0, n.useState)(null),
          [I, S] = (0, n.useState)(null),
          z = (0, n.useRef)(null),
          T = (0, n.useRef)(null),
          L = (0, n.useRef)(!1),
          M = (0, n.useRef)(null),
          A = (0, n.useRef)(null),
          E = (0, n.useRef)(!1),
          [B, O] = (0, n.useState)(null),
          [, P] = (0, n.useState)(null),
          R = (0, n.useRef)(null),
          V = (0, c.l)(u)
        ;((0, n.useEffect)(() => {
          ;(async () => {
            ;(y(!0), C(null), N(new Set()))
            try {
              let e
              if ('all' === f)
                e = r.includes('Al-Kafi')
                  ? (await Promise.all(u.map((e) => l.lH.getVolumeHadiths(Number(e))))).flat()
                  : (
                      await Promise.all((u || []).map((e) => l.C$.searchBook(String(e), '')))
                    ).flatMap((e) => (e && e.results ? e.results : []))
              else if (r.includes('Al-Kafi')) e = await l.lH.getVolumeHadiths(Number(f))
              else {
                let t = String(f)
                e = (await l.C$.searchBook(t, '')).results || []
              }
              if (!e || 0 === e.length) return void C('No hadiths found for this selection')
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
                }))
              let s = {}
              ;(Object.entries(t)
                .sort((e, t) => {
                  let [r] = e,
                    [s] = t,
                    n = (e) => e.toLowerCase().trim(),
                    a = n(r),
                    l = n(s)
                  return a.includes('introduction') && !l.includes('introduction')
                    ? -1
                    : !a.includes('introduction') && l.includes('introduction')
                      ? 1
                      : !a.includes('content') ||
                          l.includes('content') ||
                          l.includes('introduction')
                        ? !a.includes('content') &&
                          l.includes('content') &&
                          !a.includes('introduction')
                          ? 1
                          : a.localeCompare(l)
                        : -1
                })
                .forEach((e) => {
                  let [t, r] = e
                  s[t] = r
                }),
                b(s))
            } catch (e) {
              C('Failed to load structure for selected volume(s)')
            } finally {
              y(!1)
            }
          })()
        }, [f, r, u]),
          (0, n.useEffect)(
            () => () => {
              ;(z.current && window.clearTimeout(z.current),
                T.current && window.clearTimeout(T.current),
                R.current && window.clearTimeout(R.current))
            },
            [],
          ))
        let H = (e, t) => {
            let s
            if ((p.saveScrollPosition(window.scrollY), 'all' === f)) s = u && u.length ? u[0] : 1
            else {
              let e = String(f),
                t = e.match(/-Volume-(\d+)-/)
              s = t ? Number(t[1]) : isNaN(Number(e)) ? f : Number(e)
            }
            h &&
              (r.includes('Al_Kafi') || r.includes('Al-Kafi')
                ? x.push(''.concat(h, '/volume/').concat(s, '/chapter/').concat(e, '/').concat(t))
                : x.push(''.concat(h, '/chapter/').concat(e, '/').concat(t)))
          },
          K = () => {
            z.current && (window.clearTimeout(z.current), (z.current = null))
          },
          D = () => {
            ;(T.current && (window.clearTimeout(T.current), (T.current = null)),
              (T.current = window.setTimeout(() => {
                S(null)
              }, 1600)))
          },
          W = () => Object.values(v).reduce((e, t) => e + t.totalHadiths, 0)
        return (0, s.jsxs)('div', {
          className: (0, i.cn)('space-y-6', m),
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
                            (0, s.jsxs)('h3', {
                              className: 'text-primary mb-1 text-lg font-bold',
                              children: [d, ' Volume Explorer'],
                            }),
                            (0, s.jsxs)('p', {
                              className: 'text-secondary text-sm',
                              children: [
                                d,
                                ' consists of ',
                                u.length,
                                ' volume',
                                1 === u.length ? '' : 's',
                                '. Browse volumes individually or view the complete collection structure',
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsx)('div', {
                      className: 'flex items-center gap-4',
                      children:
                        u.length > 1
                          ? (0, s.jsxs)('div', {
                              className: 'relative',
                              children: [
                                (0, s.jsx)('select', {
                                  value: f,
                                  onChange: (e) => {
                                    let t = e.target.value
                                    g('all' === t ? 'all' : isNaN(Number(t)) ? t : Number(t))
                                  },
                                  disabled: w,
                                  className: (0, i.cn)(
                                    'border-theme bg-card appearance-none border',
                                    'text-primary rounded-xl px-4 py-3 pr-12 text-lg font-semibold',
                                    'hover:shadow-medium shadow-soft transition-all duration-200',
                                    'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                                    'min-w-[200px] max-w-[300px] cursor-pointer hover:border-zinc-600/50',
                                    w && 'cursor-not-allowed opacity-50',
                                  ),
                                  children: V.map((e) =>
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
                            })
                          : (0, s.jsx)('div', {
                              className: 'text-sm font-semibold',
                              children: (0, c.P)(u, null == (t = V[0]) ? void 0 : t.value),
                            }),
                    }),
                  ],
                }),
                !w &&
                  W() > 0 &&
                  (0, s.jsxs)('div', {
                    children: [
                      (0, s.jsxs)('div', {
                        className: 'border-theme flex flex-wrap items-center gap-4 border-t pt-4',
                        children: [
                          (0, s.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, s.jsx)('div', { className: 'h-3 w-3 rounded-full bg-accent' }),
                              (0, s.jsxs)('span', {
                                className: 'text-primary text-sm font-semibold',
                                children: [W().toLocaleString(), ' hadiths'],
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
                                children: [Object.keys(v).length, ' categories'],
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
                                  'all' === f
                                    ? r.includes('Al-Kafi')
                                      ? 'All Al-Kāfi Volumes'
                                      : 'All Volumes'
                                    : (0, c.P)(u, f),
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
              ],
            }),
            w &&
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
            k &&
              (0, s.jsx)('div', {
                className:
                  'shadow-soft rounded-xl border border-red-200/60 bg-red-50/80 p-6 dark:border-red-800/30 dark:bg-red-900/20',
                children: (0, s.jsx)('p', {
                  className: 'text-red-800 dark:text-red-300',
                  children: k,
                }),
              }),
            !w &&
              !k &&
              Object.keys(v).length > 0 &&
              (0, s.jsx)('div', {
                className: 'space-y-6',
                children: Object.entries(v).map((e) => {
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
                              let t = new Set(j)
                              ;(t.has(e) ? t.delete(e) : t.add(e), N(t))
                            })(t),
                          className:
                            'hover:bg-card-hover group flex w-full items-center justify-between px-6 py-5 transition-all duration-200',
                          children: [
                            (0, s.jsxs)('div', {
                              className: 'flex items-center gap-4',
                              children: [
                                (0, s.jsx)('div', {
                                  className: 'transition-transform duration-200 '.concat(
                                    j.has(t) ? 'rotate-90' : 'rotate-0',
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
                        j.has(t) &&
                          (0, s.jsx)('div', {
                            className:
                              'border-theme from-card/50 to-card/30 border-t bg-gradient-to-r p-4 duration-300 animate-in slide-in-from-top-2 sm:p-6',
                            children: (0, s.jsx)('div', {
                              className:
                                'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4',
                              children: Object.entries(r.chapters).map((e) => {
                                let t,
                                  n,
                                  a,
                                  [l, o] = e,
                                  c =
                                    ((t = r.categoryId),
                                    (n = o.chapterInCategoryId),
                                    ''.concat(t, '-').concat(n)),
                                  d = I === c
                                return (0, s.jsxs)(
                                  'button',
                                  {
                                    onClick: (e) => {
                                      if (L.current) {
                                        ;(e.preventDefault(), e.stopPropagation(), (L.current = !1))
                                        return
                                      }
                                      H(r.categoryId, o.chapterInCategoryId)
                                    },
                                    ...((a = () => H(r.categoryId, o.chapterInCategoryId)),
                                    {
                                      onTouchStart: (e) => {
                                        let t = e.touches && e.touches[0]
                                        ;(t && (M.current = { x: t.clientX, y: t.clientY }),
                                          (A.current = Date.now()),
                                          (E.current = !1),
                                          K(),
                                          (z.current = window.setTimeout(() => {
                                            ;((E.current = !0), S(c), D())
                                          }, 250)))
                                      },
                                      onTouchMove: (e) => {
                                        let t = M.current,
                                          r = e.touches && e.touches[0]
                                        if (!t || !r) return
                                        let s = Math.abs(r.clientX - t.x),
                                          n = Math.abs(r.clientY - t.y)
                                        ;(s > 20 || n > 20) && (L.current = !0)
                                      },
                                      onTouchEnd: (e) => {
                                        let t = A.current || Date.now(),
                                          r = Date.now() - t
                                        if (
                                          (K(),
                                          (M.current = null),
                                          (A.current = null),
                                          !E.current && r < 250)
                                        ) {
                                          ;(e.preventDefault(),
                                            e.stopPropagation(),
                                            (L.current = !0),
                                            a())
                                          return
                                        }
                                        I === c && D()
                                      },
                                      onTouchCancel: () => {
                                        ;(K(),
                                          (M.current = null),
                                          (A.current = null),
                                          I === c && D())
                                      },
                                    }),
                                    'aria-expanded': d,
                                    onMouseEnter: () => {
                                      ;(P(null), O(c))
                                    },
                                    onMouseLeave: () => {
                                      ;(O(null),
                                        P(c),
                                        R.current && window.clearTimeout(R.current),
                                        (R.current = window.setTimeout(() => {
                                          P(null)
                                        }, 900)))
                                    },
                                    onMouseMove: (e) => {
                                      let t = e.currentTarget,
                                        r = t.getBoundingClientRect(),
                                        s = e.clientX - r.left,
                                        n = e.clientY - r.top
                                      ;(t.style.setProperty('--mx', ''.concat(s, 'px')),
                                        t.style.setProperty('--my', ''.concat(n, 'px')))
                                    },
                                    className: (0, i.cn)(
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
                                            className: (0, i.cn)(
                                              'absolute inset-0 bg-zinc-900/40',
                                              'transition-opacity duration-500 ease-in-out',
                                              B === c && 'opacity-100',
                                              B !== c && 'opacity-0',
                                              d && 'opacity-100',
                                            ),
                                          }),
                                          (0, s.jsx)('div', {
                                            className: (0, i.cn)(
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
                                        children: o.chapterInCategoryId,
                                      }),
                                      (0, s.jsxs)('div', {
                                        className: (0, i.cn)(
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
                                            className: (0, i.cn)(
                                              'text-primary mb-3 font-semibold leading-snug transition-colors',
                                              'group-hover:text-foreground',
                                              d && 'text-foreground',
                                              'line-clamp-2',
                                              'md:group-hover:line-clamp-none',
                                              d && 'line-clamp-none',
                                            ),
                                            children: o.chapter,
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
                                                      o.hadithCount,
                                                      ' ',
                                                      1 === o.hadithCount ? 'hadith' : 'hadiths',
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
                                  l,
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
            !w &&
              !k &&
              0 === Object.keys(v).length &&
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
      function u(e) {
        let { bookId: t, bookName: r, volumes: n, baseRoute: a, className: l } = e
        return (0, s.jsx)(d, {
          bookId: t,
          bookName: r || t,
          volumes: n,
          baseRoute: a,
          className: l,
        })
      }
    },
    9057: (e, t, r) => {
      function s(e) {
        let t = Array.isArray(e) && e.length > 0 ? e : []
        if (0 === t.length) return [{ value: 1, label: 'Volume 1' }]
        let r = t.map((e, t) => ({ value: e, label: 'Volume '.concat(t + 1) }))
        return (t.length > 1 && r.push({ value: 'all', label: 'All Volumes' }), r)
      }
      function n(e, t) {
        var r
        let n = s(e),
          a = n.find((e) => String(e.value) === String(t))
        return a ? a.label : (null == (r = n[0]) ? void 0 : r.label) || 'Volume 1'
      }
      r.d(t, { P: () => n, l: () => s })
    },
  },
])
