;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [532],
  {
    368: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('chevron-left', [['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }]])
    },
    2596: (e, t, r) => {
      'use strict'
      ;(r.r(t), r.d(t, { default: () => b }))
      var s = r(5155),
        l = r(2115),
        a = r(9445),
        n = r(1995),
        o = r(3243),
        c = r(2355),
        d = r(4787),
        i = r(5016),
        u = r(7812),
        x = r(6651),
        m = r(5299),
        h = r(6983)
      let f = (0, l.lazy)(() => r.e(785).then(r.bind(r, 3166))),
        p = (0, l.lazy)(() => r.e(987).then(r.bind(r, 987))),
        y = (0, l.lazy)(() => r.e(511).then(r.bind(r, 1511)))
      function b() {
        let {
            restoreScrollPosition: e,
            savePath: t,
            getSearchState: r,
            saveSearchState: b,
            saveScrollPosition: g,
          } = (0, o.c)(),
          k = (0, l.useRef)(null),
          { history: j, addToHistory: v, clearHistory: w } = (0, c.d)(k),
          [N, A] = (0, l.useState)(!1),
          [E, M] = (0, l.useState)(''),
          [S, C] = (0, l.useState)([]),
          [K, q] = (0, l.useState)(!1),
          [z, R] = (0, l.useState)(null),
          [_, D] = (0, l.useState)(null),
          [B, H] = (0, l.useState)('structure')
        ;((0, l.useEffect)(() => {
          a.C$.getAllBooks()
            .then((e) => {
              D(e.find((e) => 'Al-Kafi-Volume-1-Kulayni' === e.bookId) || null)
            })
            .catch(() => {})
        }, []),
          (0, l.useEffect)(() => {
            let s = e()
            ;(s > 0 && requestAnimationFrame(() => window.scrollTo(0, s)), t('/al-kafi'))
            let l = r()
            l && (M(l.query), C(l.results))
          }, [e, t, r]),
          (0, l.useEffect)(() => {
            let e = () => g(window.scrollY)
            return (
              window.addEventListener('beforeunload', e),
              () => {
                ;(window.removeEventListener('beforeunload', e), g(window.scrollY))
              }
            )
          }, [g]))
        let T = (0, l.useMemo)(
          () =>
            (0, d.sg)(async (e) => {
              if (!e.trim()) {
                ;(C([]), R(null), b(null))
                return
              }
              ;(q(!0), R(null))
              try {
                let t = a.lH.getAlKafiVolumes().join(','),
                  r = await fetch(
                    ''
                      .concat('/read', '/api/search?q=')
                      .concat(encodeURIComponent(e), '&book=')
                      .concat(t),
                  ),
                  s = await r.json()
                if (!r.ok || s.error) throw Error(s.error || 'Search failed')
                let l = s.results
                ;(C(l),
                  b({
                    query: e,
                    results: l,
                    page: 1,
                    filters: { grading: 'all', sort: 'relevance' },
                  }))
              } catch (e) {
                ;(C([]), R('Search failed. Please try again.'), b(null))
              } finally {
                q(!1)
              }
            }, 300),
          [b],
        )
        return (0, s.jsxs)('main', {
          className: 'min-h-screen',
          children: [
            (0, s.jsx)('div', {
              className: 'mx-auto max-w-2xl px-4 pt-6 sm:px-6',
              children: (0, s.jsxs)('div', {
                className: 'relative',
                children: [
                  (0, s.jsxs)('div', {
                    className:
                      'flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5',
                    children: [
                      (0, s.jsx)(x.A, { className: 'h-4 w-4 shrink-0 text-foreground-faint' }),
                      (0, s.jsx)('input', {
                        ref: k,
                        placeholder: 'Search across all Al-Kāfi volumes… (Ctrl+K)',
                        value: E,
                        onChange: (e) =>
                          ((e) => {
                            if ((M(e), A(!1), !e.trim())) {
                              ;(T.cancel(), C([]), R(null), b(null))
                              return
                            }
                            T(e)
                          })(e.target.value),
                        onFocus: () => {
                          !E && j.length > 0 && A(!0)
                        },
                        onBlur: () => setTimeout(() => A(!1), 200),
                        onKeyDown: (e) => {
                          if (
                            ('Enter' === e.key && (E.trim() && v(E.trim()), A(!1)),
                            'Escape' === e.key)
                          ) {
                            var t
                            ;(A(!1), null == (t = k.current) || t.blur())
                          }
                        },
                        className:
                          'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint',
                      }),
                      K &&
                        (0, s.jsx)(m.A, {
                          className: 'h-4 w-4 shrink-0 animate-spin text-foreground-muted',
                        }),
                      (0, s.jsx)('kbd', {
                        className:
                          'hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground-faint sm:inline-block',
                        children: '⌘K',
                      }),
                    ],
                  }),
                  N &&
                    j.length > 0 &&
                    (0, s.jsxs)('div', {
                      className:
                        'absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg',
                      children: [
                        (0, s.jsxs)('div', {
                          className: 'flex items-center justify-between px-3 py-1.5',
                          children: [
                            (0, s.jsx)('span', {
                              className: 'text-xs font-medium text-foreground-muted',
                              children: 'Recent searches',
                            }),
                            (0, s.jsx)('button', {
                              onMouseDown: (e) => e.preventDefault(),
                              onClick: w,
                              className:
                                'text-xs text-foreground-faint transition-colors hover:text-foreground-muted',
                              children: 'Clear',
                            }),
                          ],
                        }),
                        j.map((e, t) =>
                          (0, s.jsxs)(
                            'button',
                            {
                              onMouseDown: (e) => e.preventDefault(),
                              onClick: () => {
                                ;(M(e), A(!1), T(e))
                              },
                              className:
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2',
                              children: [
                                (0, s.jsx)(h.A, {
                                  className: 'h-3 w-3 shrink-0 text-foreground-faint',
                                }),
                                (0, s.jsx)('span', { className: 'truncate', children: e }),
                              ],
                            },
                            t,
                          ),
                        ),
                      ],
                    }),
                ],
              }),
            }),
            (0, s.jsx)('section', {
              className: 'mx-auto mt-6 max-w-5xl px-4 sm:px-6',
              children: (0, s.jsx)('div', {
                className: 'rounded-lg border border-border bg-surface-1 p-5 sm:p-6',
                children: (0, s.jsxs)('div', {
                  className: 'flex items-start gap-5',
                  children: [
                    (null == _ ? void 0 : _.bookCover) &&
                      (0, s.jsx)('img', {
                        src: _.bookCover,
                        alt: 'Al-Kāfi',
                        className: 'hidden w-32 shrink-0 rounded object-cover md:block',
                      }),
                    (0, s.jsxs)('div', {
                      className: 'min-w-0 flex-1',
                      children: [
                        (0, s.jsxs)('h1', {
                          className: 'text-2xl font-bold text-foreground sm:text-3xl',
                          children: [
                            'Al-Kāfi ',
                            (0, s.jsx)('span', {
                              className: 'font-arabic text-foreground-muted',
                              children: '(الكافي)',
                            }),
                          ],
                        }),
                        (0, s.jsx)('p', {
                          className: 'mt-1 text-sm text-foreground-muted',
                          children: 'By Shaykh Muḥammad b. Yaʿqūb al-Kulaynī',
                        }),
                        (0, s.jsx)('p', {
                          className: 'mt-3 text-sm leading-relaxed text-foreground-muted',
                          children:
                            'One of the most significant collections of Shīʿī Ḥadīth, compiled over twenty years. Eight volumes covering principles of belief, jurisprudence, and miscellaneous teachings.',
                        }),
                        (0, s.jsxs)('div', {
                          className: 'mt-3 flex flex-wrap gap-1.5',
                          children: [
                            (0, s.jsx)(u.E, { variant: 'secondary', children: '8 Volumes' }),
                            (0, s.jsx)(u.E, { variant: 'secondary', children: 'Four Major Books' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            }),
            (0, s.jsx)(n.A, {
              searchQuery: E,
              searchResults: S,
              isSearching: K,
              onSearch: T,
              onClearSearch: () => {
                ;(T.cancel(), M(''), C([]), R(null), b(null), A(!1))
              },
              searchContext: 'al-kafi',
              searchError: z,
            }),
            !E &&
              (0, s.jsxs)('section', {
                className: 'mx-auto mt-6 max-w-5xl px-4 pb-12 sm:px-6',
                children: [
                  (0, s.jsxs)('div', {
                    className: 'mb-4 flex items-center justify-between',
                    children: [
                      (0, s.jsx)('h2', {
                        className: 'text-lg font-semibold text-foreground',
                        children: 'Explore',
                      }),
                      (0, s.jsx)('div', {
                        className: 'flex rounded-md border border-border bg-surface-1 p-0.5',
                        children: [
                          { key: 'structure', label: 'Volume Explorer', short: 'Explorer' },
                          { key: 'chapters', label: 'Chapter Tree', short: 'Tree' },
                          { key: 'explorer', label: 'Random', short: 'Random' },
                        ].map((e) =>
                          (0, s.jsxs)(
                            'button',
                            {
                              onClick: () => H(e.key),
                              className: (0, i.cn)(
                                'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors',
                                B === e.key
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-foreground-muted hover:text-foreground',
                              ),
                              children: [
                                (0, s.jsx)('span', { className: 'sm:hidden', children: e.short }),
                                (0, s.jsx)('span', {
                                  className: 'hidden sm:inline',
                                  children: e.label,
                                }),
                              ],
                            },
                            e.key,
                          ),
                        ),
                      }),
                    ],
                  }),
                  (0, s.jsx)(l.Suspense, {
                    fallback: (0, s.jsx)('div', {
                      className: 'flex items-center justify-center py-12',
                      children: (0, s.jsx)(m.A, {
                        className: 'h-6 w-6 animate-spin text-foreground-muted',
                      }),
                    }),
                    children:
                      'structure' === B
                        ? (0, s.jsx)(p, {})
                        : 'chapters' === B
                          ? (0, s.jsx)(y, {})
                          : (0, s.jsx)(f, {}),
                  }),
                ],
              }),
          ],
        })
      }
    },
    5229: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('x', [
        ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
        ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
      ])
    },
    6132: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('circle-alert', [
        ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
        ['line', { x1: '12', x2: '12', y1: '8', y2: '12', key: '1pkeuh' }],
        ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16', key: '4dfq90' }],
      ])
    },
    6630: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('sliders-horizontal', [
        ['path', { d: 'M10 5H3', key: '1qgfaw' }],
        ['path', { d: 'M12 19H3', key: 'yhmn1j' }],
        ['path', { d: 'M14 3v4', key: '1sua03' }],
        ['path', { d: 'M16 17v4', key: '1q0r14' }],
        ['path', { d: 'M21 12h-9', key: '1o4lsq' }],
        ['path', { d: 'M21 19h-5', key: '1rlt1p' }],
        ['path', { d: 'M21 5h-7', key: '1oszz2' }],
        ['path', { d: 'M8 10v4', key: 'tgpxqk' }],
        ['path', { d: 'M8 12H3', key: 'a7s4jb' }],
      ])
    },
    6651: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('search', [
        ['path', { d: 'm21 21-4.34-4.34', key: '14j7rj' }],
        ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
      ])
    },
    6878: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 2596))
    },
    6983: (e, t, r) => {
      'use strict'
      r.d(t, { A: () => s })
      let s = (0, r(5121).A)('clock', [
        ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
        ['path', { d: 'M12 6v6l4 2', key: 'mmk7yg' }],
      ])
    },
  },
  (e) => {
    ;(e.O(0, [307, 346, 952, 579, 962, 665, 441, 255, 358], () => e((e.s = 6878))), (_N_E = e.O()))
  },
])
