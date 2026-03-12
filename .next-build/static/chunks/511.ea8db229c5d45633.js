'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [511],
  {
    1511: (e, t, s) => {
      ;(s.r(t), s.d(t, { default: () => h }))
      var a = s(5155),
        r = s(2115),
        l = s(9445),
        d = s(3962),
        c = s(8446),
        i = s(4033),
        n = s(7937),
        o = s(5016)
      function h(e) {
        let { initialVolume: t = 1, className: s } = e,
          [h, m] = (0, r.useState)(t),
          [x, u] = (0, r.useState)({}),
          [p, g] = (0, r.useState)(new Set()),
          [b, f] = (0, r.useState)(null),
          [j, v] = (0, r.useState)([]),
          [N, y] = (0, r.useState)(!1),
          [w, k] = (0, r.useState)(!1),
          [C, S] = (0, r.useState)(null),
          A = Array.from({ length: 8 }, (e, t) => t + 1),
          H = [
            ...A.map((e) => ({ value: e, label: 'Volume '.concat(e) })),
            { value: 'all', label: 'All Volumes' },
          ]
        ;(0, r.useEffect)(() => {
          ;(async () => {
            ;(y(!0), S(null), f(null), v([]), g(new Set()))
            try {
              let e
              if (
                !(e =
                  'all' === h
                    ? (await Promise.all(A.map((e) => l.lH.getVolumeHadiths(e)))).flat()
                    : await l.lH.getVolumeHadiths(Number(h))) ||
                0 === e.length
              )
                return void S('No hadiths found for this selection')
              let t = {}
              ;(e.forEach((e) => {
                let s = e.category || 'Uncategorized',
                  a = e.chapter || 'No Chapter'
                ;(t[s] ||
                  (t[s] = {
                    category: s,
                    categoryId: e.categoryId || '',
                    chapters: {},
                    totalHadiths: 0,
                  }),
                  t[s].chapters[a] ||
                    (t[s].chapters[a] = {
                      chapter: a,
                      chapterInCategoryId: e.chapterInCategoryId || 0,
                      hadithCount: 0,
                    }),
                  t[s].chapters[a].hadithCount++,
                  t[s].totalHadiths++)
              }),
                Object.values(t).forEach((e) => {
                  let t = {}
                  ;(Object.entries(e.chapters)
                    .sort((e, t) => {
                      let [, s] = e,
                        [, a] = t
                      return s.chapterInCategoryId - a.chapterInCategoryId
                    })
                    .forEach((e) => {
                      let [s, a] = e
                      t[s] = a
                    }),
                    (e.chapters = t))
                }),
                u(t))
            } catch (e) {
              S('Failed to load structure for Volume '.concat(h))
            } finally {
              y(!1)
            }
          })()
        }, [h])
        let I = async (e, t, s, a) => {
            k(!0)
            try {
              let s = (
                'all' === h
                  ? (await Promise.all(A.map((e) => l.lH.getVolumeHadiths(e)))).flat()
                  : await l.lH.getVolumeHadiths(Number(h))
              ).filter((s) => s.category === e && s.chapter === t)
              v(s)
            } catch (e) {
              v([])
            } finally {
              k(!1)
            }
          },
          V = () => Object.values(x).reduce((e, t) => e + t.totalHadiths, 0)
        return (0, a.jsxs)('div', {
          className: (0, o.cn)('space-y-6', s),
          children: [
            (0, a.jsxs)('div', {
              className: 'rounded-xl border border-border bg-surface-1 p-6',
              children: [
                (0, a.jsxs)('div', {
                  className: 'mb-4 flex items-center gap-4',
                  children: [
                    (0, a.jsx)(c.A, { className: 'h-8 w-8 text-foreground-muted' }),
                    (0, a.jsxs)('div', {
                      children: [
                        (0, a.jsx)('h3', {
                          className: 'mb-1 text-xl font-bold text-foreground',
                          children: 'Al-Kāfi Complete Chapter Tree',
                        }),
                        (0, a.jsx)('p', {
                          className: 'text-sm text-foreground-muted',
                          children:
                            'Browse the complete structure of Al-Kāfi. Select a specific volume or "All Volumes", expand categories, and select chapters to read all hadiths with full details including gradings.',
                        }),
                      ],
                    }),
                  ],
                }),
                (0, a.jsxs)('div', {
                  className:
                    'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
                  children: [
                    (0, a.jsx)('div', {
                      className: 'flex items-center gap-3',
                      children: (0, a.jsxs)('div', {
                        className: 'relative',
                        children: [
                          (0, a.jsx)('select', {
                            id: 'volume-browser-select',
                            value: h,
                            onChange: (e) => {
                              let t = e.target.value
                              m('all' === t ? 'all' : isNaN(Number(t)) ? t : Number(t))
                            },
                            disabled: N,
                            className: (0, o.cn)(
                              'appearance-none border border-border bg-background',
                              'rounded-lg px-4 py-2.5 pr-12 font-semibold text-foreground',
                              'transition-colors duration-200',
                              'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                              'min-w-[130px] cursor-pointer hover:border-zinc-600/50',
                              N && 'cursor-not-allowed opacity-50',
                            ),
                            children: H.map((e) =>
                              (0, a.jsx)(
                                'option',
                                { value: e.value, children: e.label },
                                String(e.value),
                              ),
                            ),
                          }),
                          (0, a.jsx)('div', {
                            className:
                              'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
                            children: (0, a.jsx)('svg', {
                              className: 'h-4 w-4 text-foreground-muted',
                              fill: 'none',
                              stroke: 'currentColor',
                              viewBox: '0 0 24 24',
                              children: (0, a.jsx)('path', {
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
                    !N &&
                      V() > 0 &&
                      (0, a.jsxs)('div', {
                        className: 'flex items-center gap-4 text-sm',
                        children: [
                          (0, a.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, a.jsx)('div', { className: 'h-3 w-3 rounded-full bg-accent' }),
                              (0, a.jsxs)('span', {
                                className: 'font-semibold text-foreground-muted',
                                children: [V().toLocaleString(), ' hadiths'],
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, a.jsx)('div', {
                                className: 'h-3 w-3 rounded-full bg-foreground-faint',
                              }),
                              (0, a.jsxs)('span', {
                                className: 'font-semibold text-foreground-muted',
                                children: [Object.keys(x).length, ' categories'],
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, a.jsx)('div', {
                                className: 'h-3 w-3 rounded-full bg-foreground-faint',
                              }),
                              (0, a.jsx)('span', {
                                className: 'font-semibold text-foreground-muted',
                                children: 'all' === h ? 'All Volumes' : 'Volume '.concat(h),
                              }),
                            ],
                          }),
                        ],
                      }),
                  ],
                }),
              ],
            }),
            N &&
              (0, a.jsx)('div', {
                className: 'border-theme bg-card shadow-soft rounded-xl border p-12',
                children: (0, a.jsxs)('div', {
                  className: 'flex items-center justify-center',
                  children: [
                    (0, a.jsx)('div', {
                      className: 'border-primary h-8 w-8 animate-spin rounded-full border-b-2',
                    }),
                    (0, a.jsx)('span', {
                      className: 'text-muted ml-3',
                      children: 'Loading book structure...',
                    }),
                  ],
                }),
              }),
            C &&
              (0, a.jsx)('div', {
                className:
                  'rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20',
                children: (0, a.jsx)('p', {
                  className: 'text-sm text-red-800 dark:text-red-300',
                  children: C,
                }),
              }),
            !N &&
              !C &&
              Object.keys(x).length > 0 &&
              (0, a.jsxs)('div', {
                className: 'grid gap-4 lg:grid-cols-3 lg:gap-6',
                children: [
                  (0, a.jsx)('div', {
                    className: 'lg:col-span-1',
                    children: (0, a.jsxs)('div', {
                      className:
                        'border-theme bg-card shadow-soft max-h-[60vh] overflow-y-auto overflow-x-visible rounded-xl border sm:max-h-[70vh] lg:max-h-[80vh]',
                      children: [
                        (0, a.jsxs)('div', {
                          className: 'border-theme bg-card sticky top-0 z-10 border-b p-3 sm:p-4',
                          children: [
                            (0, a.jsxs)('h4', {
                              className: 'text-primary text-sm font-semibold sm:text-base',
                              children: [
                                (0, a.jsx)('span', {
                                  className: 'sm:hidden',
                                  children: 'Categories',
                                }),
                                (0, a.jsx)('span', {
                                  className: 'hidden sm:inline',
                                  children: 'Categories & Chapters',
                                }),
                              ],
                            }),
                            (0, a.jsx)('p', {
                              className: 'text-muted mt-1 hidden text-xs sm:block',
                              children: 'Click to expand categories',
                            }),
                          ],
                        }),
                        (0, a.jsx)('div', {
                          className: 'p-1 sm:p-2',
                          children: Object.entries(x).map((e) => {
                            let [t, s] = e
                            return (0, a.jsxs)(
                              'div',
                              {
                                className: 'mb-1 sm:mb-2',
                                children: [
                                  (0, a.jsxs)('button', {
                                    onClick: () =>
                                      ((e) => {
                                        let t = new Set(p)
                                        ;(t.has(e) ? t.delete(e) : t.add(e), g(t))
                                      })(t),
                                    className:
                                      'hover:bg-card-hover active:bg-card-hover flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors sm:p-3',
                                    children: [
                                      p.has(t)
                                        ? (0, a.jsx)(i.A, {
                                            className: 'text-muted h-4 w-4 flex-shrink-0',
                                          })
                                        : (0, a.jsx)(n.A, {
                                            className: 'text-muted h-4 w-4 flex-shrink-0',
                                          }),
                                      (0, a.jsxs)('div', {
                                        className: 'min-w-0 flex-1',
                                        children: [
                                          (0, a.jsx)('div', {
                                            className:
                                              'text-primary text-sm font-medium leading-tight',
                                            children: s.category,
                                          }),
                                          (0, a.jsxs)('div', {
                                            className: 'text-muted mt-1 text-xs',
                                            children: [
                                              s.totalHadiths,
                                              ' hadiths •',
                                              ' ',
                                              Object.keys(s.chapters).length,
                                              ' chapters',
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  p.has(t) &&
                                    (0, a.jsx)('div', {
                                      className: 'ml-6 mt-1 space-y-1',
                                      children: Object.entries(s.chapters).map((e) => {
                                        let [r, l] = e
                                        return (0, a.jsxs)(
                                          'button',
                                          {
                                            onClick: () => {
                                              var e, a
                                              ;(f({
                                                category: t,
                                                chapter: r,
                                                categoryId: (e = s.categoryId),
                                                chapterId: (a = l.chapterInCategoryId),
                                              }),
                                                I(t, r, e, a))
                                            },
                                            className: (0, o.cn)(
                                              'w-full rounded p-2 text-left text-sm transition-colors',
                                              (null == b ? void 0 : b.category) === t &&
                                                (null == b ? void 0 : b.chapter) === r
                                                ? 'bg-primary/10 text-primary border-primary/20 border'
                                                : 'hover:bg-card-hover text-secondary',
                                            ),
                                            children: [
                                              (0, a.jsx)('div', {
                                                className: 'leading-tight',
                                                children: l.chapter,
                                              }),
                                              (0, a.jsxs)('div', {
                                                className: 'text-muted mt-1 text-xs',
                                                children: [l.hadithCount, ' hadiths'],
                                              }),
                                            ],
                                          },
                                          ''.concat(t, '-').concat(r),
                                        )
                                      }),
                                    }),
                                ],
                              },
                              t,
                            )
                          }),
                        }),
                      ],
                    }),
                  }),
                  (0, a.jsx)('div', {
                    className: 'lg:col-span-2',
                    children: b
                      ? (0, a.jsxs)('div', {
                          className: 'space-y-4',
                          children: [
                            (0, a.jsxs)('div', {
                              className: 'border-theme bg-card shadow-soft rounded-xl border p-6',
                              children: [
                                (0, a.jsx)('h4', {
                                  className: 'text-primary mb-2 font-semibold',
                                  children: b.category,
                                }),
                                (0, a.jsx)('h5', {
                                  className: 'text-secondary mb-4',
                                  children: b.chapter,
                                }),
                                (0, a.jsxs)('div', {
                                  className: 'flex items-center justify-between',
                                  children: [
                                    (0, a.jsxs)('p', {
                                      className: 'text-muted text-sm',
                                      children: [
                                        j.length,
                                        ' ',
                                        1 === j.length ? 'hadith' : 'hadiths',
                                        ' ',
                                        'in this chapter',
                                      ],
                                    }),
                                    w &&
                                      (0, a.jsxs)('div', {
                                        className: 'text-muted flex items-center gap-2 text-sm',
                                        children: [
                                          (0, a.jsx)('div', {
                                            className:
                                              'border-primary h-4 w-4 animate-spin rounded-full border-b-2',
                                          }),
                                          'Loading hadiths...',
                                        ],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                            (0, a.jsx)('div', {
                              className:
                                'max-h-[80vh] space-y-6 overflow-y-auto overflow-x-visible',
                              children: w
                                ? (0, a.jsxs)('div', {
                                    className:
                                      'border-theme bg-card shadow-soft rounded-xl border p-12 text-center',
                                    children: [
                                      (0, a.jsx)('div', {
                                        className:
                                          'border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2',
                                      }),
                                      (0, a.jsx)('p', {
                                        className: 'text-muted',
                                        children: 'Loading chapter hadiths...',
                                      }),
                                    ],
                                  })
                                : j.length > 0
                                  ? j.map((e, t) => {
                                      var s, r
                                      return (0, a.jsx)(
                                        d.A,
                                        { hadith: e },
                                        null != (r = e._id)
                                          ? r
                                          : 'alkafi-'.concat(null != (s = e.id) ? s : t),
                                      )
                                    })
                                  : (0, a.jsx)('div', {
                                      className:
                                        'border-theme bg-card shadow-soft rounded-xl border p-8 text-center',
                                      children: (0, a.jsx)('p', {
                                        className: 'text-muted',
                                        children: 'No hadiths found in this chapter.',
                                      }),
                                    }),
                            }),
                          ],
                        })
                      : (0, a.jsxs)('div', {
                          className:
                            'border-theme bg-card shadow-soft rounded-xl border p-12 text-center',
                          children: [
                            (0, a.jsx)(c.A, { className: 'text-muted mx-auto mb-4 h-12 w-12' }),
                            (0, a.jsx)('h4', {
                              className: 'text-primary mb-2 text-lg font-medium',
                              children: 'Select a Chapter to Begin Reading',
                            }),
                            (0, a.jsx)('p', {
                              className: 'text-muted mb-4',
                              children:
                                'Expand a category on the left and select a chapter to view its hadiths with complete text, Arabic content, and grading information.',
                            }),
                            (0, a.jsxs)('div', {
                              className: 'text-muted text-sm',
                              children: [
                                (0, a.jsx)('p', { children: '\uD83D\uDCD6 Each hadith includes:' }),
                                (0, a.jsxs)('ul', {
                                  className: 'mt-2 space-y-1',
                                  children: [
                                    (0, a.jsx)('li', {
                                      children: '• Complete English and Arabic text',
                                    }),
                                    (0, a.jsx)('li', { children: '• Chain of narration (Sanad)' }),
                                    (0, a.jsx)('li', {
                                      children: '• Scholarly grading and authentication',
                                    }),
                                    (0, a.jsx)('li', { children: '• Source references and links' }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                  }),
                ],
              }),
          ],
        })
      }
    },
    8446: (e, t, s) => {
      s.d(t, { A: () => a })
      let a = (0, s(5121).A)('book', [
        [
          'path',
          {
            d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
            key: 'k3hazp',
          },
        ],
      ])
    },
  },
])
