'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [658],
  {
    4658: (e, t, a) => {
      ;(a.r(t), a.d(t, { default: () => m }))
      var s = a(5155),
        r = a(2115),
        l = a(9445),
        d = a(3962),
        c = a(4033),
        i = a(7937),
        n = a(8446),
        o = a(5016),
        h = a(9057)
      function m(e) {
        let { bookId: t, bookConfig: a = null, className: m } = e,
          [x, u] = (0, r.useState)(() => {
            var e
            return (null == a ? void 0 : a.hasMultipleVolumes)
              ? (null == a || null == (e = a.volumes) ? void 0 : e[0]) || 'all'
              : t
          }),
          [p, g] = (0, r.useState)({}),
          [b, v] = (0, r.useState)(new Set()),
          [f, j] = (0, r.useState)(null),
          [N, y] = (0, r.useState)([]),
          [w, k] = (0, r.useState)(!1),
          [C, S] = (0, r.useState)(!1),
          [I, A] = (0, r.useState)(null),
          H = (null == a ? void 0 : a.hasMultipleVolumes) ? a.volumes : [t],
          V = (0, h.l)(H),
          E = (null == a ? void 0 : a.englishName) || t
        ;(0, r.useEffect)(() => {
          ;(async () => {
            ;(k(!0), A(null), v(new Set()), j(null), y([]))
            try {
              let e = {}
              if ('all' === x) {
                let t = (H || []).map(async (e) => {
                  let t = await l.A1.getBookHadiths(e)
                  return { volume: e, hadiths: t }
                })
                ;(await Promise.all(t)).forEach((t) => {
                  let { volume: a, hadiths: s } = t,
                    r = (String(a).match(/-Volume-(\d+)-/) || [])[1] || ''
                  s.forEach((t) => {
                    let a = ''
                        .concat(t.category || 'Uncategorized')
                        .concat(r ? ' (Vol '.concat(r, ')') : ''),
                      s = t.chapter || 'No Chapter'
                    ;(e[a] ||
                      (e[a] = {
                        category: a,
                        categoryId: t.categoryId || '',
                        chapters: {},
                        totalHadiths: 0,
                      }),
                      e[a].chapters[s] ||
                        (e[a].chapters[s] = {
                          chapter: s,
                          chapterInCategoryId: t.chapterInCategoryId || 0,
                          hadithCount: 0,
                        }),
                      e[a].chapters[s].hadithCount++,
                      e[a].totalHadiths++)
                  })
                })
              } else
                (await l.A1.getBookHadiths(x)).forEach((t) => {
                  let a = t.category || 'Uncategorized',
                    s = t.chapter || 'No Chapter'
                  ;(e[a] ||
                    (e[a] = {
                      category: a,
                      categoryId: t.categoryId || '',
                      chapters: {},
                      totalHadiths: 0,
                    }),
                    e[a].chapters[s] ||
                      (e[a].chapters[s] = {
                        chapter: s,
                        chapterInCategoryId: t.chapterInCategoryId || 0,
                        hadithCount: 0,
                      }),
                    e[a].chapters[s].hadithCount++,
                    e[a].totalHadiths++)
                })
              g(e)
            } catch (e) {
              A('Failed to load book structure')
            } finally {
              k(!1)
            }
          })()
        }, [x, t, a])
        let B = async (e, t, a, s) => {
            ;(S(!0), j({ category: a, chapter: s, categoryId: e, chapterId: t }))
            try {
              let a = []
              if ('all' === x) {
                let s = (H || []).map(async (a) =>
                  (await l.A1.getBookHadiths(a)).filter(
                    (a) => a.categoryId === e && a.chapterInCategoryId === t,
                  ),
                )
                a = (await Promise.all(s)).flat()
              } else a = await l.A1.getChapterHadiths(x, e, t)
              let s = a.sort((e, t) => e.id - t.id)
              y(s)
            } catch (e) {
              y([])
            } finally {
              S(!1)
            }
          },
          L = () => Object.values(p).reduce((e, t) => e + (t.totalHadiths || 0), 0)
        return (0, s.jsxs)('div', {
          className: (0, o.cn)('space-y-6', m),
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
                          className: 'text-primary mb-1 text-lg font-bold',
                          children: [E, ' Volume Explorer'],
                        }),
                        (0, s.jsxs)('p', {
                          className: 'text-secondary text-sm',
                          children: [
                            'Browse ',
                            E,
                            ' volumes individually or view the complete collection structure',
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (0, s.jsxs)('div', {
                  className: 'flex flex-col justify-between gap-4 sm:flex-row sm:items-center',
                  children: [
                    (0, s.jsx)('div', {
                      className: 'flex items-center gap-3',
                      children: (0, s.jsxs)('div', {
                        className: 'relative',
                        children: [
                          (0, s.jsx)('select', {
                            value: String(x),
                            onChange: (e) => {
                              let t = e.target.value
                              u('all' === t ? 'all' : isNaN(Number(t)) ? t : String(t))
                            },
                            disabled: w,
                            className: (0, o.cn)(
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
                      }),
                    }),
                    !w &&
                      L() > 0 &&
                      (0, s.jsxs)('div', {
                        className: 'border-theme flex flex-wrap items-center gap-4 border-t pt-4',
                        children: [
                          (0, s.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, s.jsx)('div', {
                                className: 'shadow-soft h-3 w-3 rounded-full bg-green-500',
                              }),
                              (0, s.jsxs)('span', {
                                className: 'text-primary text-sm font-semibold',
                                children: [L().toLocaleString(), ' hadiths'],
                              }),
                            ],
                          }),
                          (0, s.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, s.jsx)('div', {
                                className: 'shadow-soft h-3 w-3 rounded-full bg-blue-500',
                              }),
                              (0, s.jsxs)('span', {
                                className: 'text-primary text-sm font-semibold',
                                children: [Object.keys(p).length, ' categories'],
                              }),
                            ],
                          }),
                          (0, s.jsxs)('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              (0, s.jsx)('div', {
                                className: 'shadow-soft h-3 w-3 rounded-full bg-purple-500',
                              }),
                              (0, s.jsx)('span', {
                                className: 'text-primary text-sm font-semibold',
                                children: 'all' === x ? 'All Volumes' : (0, h.P)(H, x),
                              }),
                            ],
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
            w &&
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
                      children: 'Loading book structure...',
                    }),
                  ],
                }),
              }),
            I &&
              (0, s.jsx)('div', {
                className:
                  'rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20',
                children: (0, s.jsx)('p', {
                  className: 'text-sm text-red-800 dark:text-red-300',
                  children: I,
                }),
              }),
            !w &&
              !I &&
              Object.keys(p).length > 0 &&
              (0, s.jsxs)('div', {
                className: 'grid gap-4 lg:grid-cols-3 lg:gap-6',
                children: [
                  (0, s.jsx)('div', {
                    className: 'lg:col-span-1',
                    children: (0, s.jsxs)('div', {
                      className:
                        'border-theme bg-card shadow-soft max-h-[60vh] overflow-y-auto overflow-x-visible rounded-xl border sm:max-h-[70vh] lg:max-h-[80vh]',
                      children: [
                        (0, s.jsxs)('div', {
                          className: 'border-theme bg-card sticky top-0 z-10 border-b p-3 sm:p-4',
                          children: [
                            (0, s.jsxs)('h4', {
                              className: 'text-primary text-sm font-semibold sm:text-base',
                              children: [
                                (0, s.jsx)('span', {
                                  className: 'sm:hidden',
                                  children: 'Categories',
                                }),
                                (0, s.jsx)('span', {
                                  className: 'hidden sm:inline',
                                  children: 'Categories & Chapters',
                                }),
                              ],
                            }),
                            (0, s.jsx)('p', {
                              className: 'text-muted mt-1 hidden text-xs sm:block',
                              children: 'Click to expand categories',
                            }),
                          ],
                        }),
                        (0, s.jsx)('div', {
                          className: 'p-1 sm:p-2',
                          children: Object.entries(p).map((e) => {
                            let [t, a] = e
                            return (0, s.jsxs)(
                              'div',
                              {
                                className: 'mb-1 sm:mb-2',
                                children: [
                                  (0, s.jsxs)('button', {
                                    onClick: () => {
                                      v((e) => {
                                        let a = new Set(e)
                                        return (a.has(t) ? a.delete(t) : a.add(t), a)
                                      })
                                    },
                                    className:
                                      'hover:bg-card-hover active:bg-card-hover flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors sm:p-3',
                                    children: [
                                      b.has(t)
                                        ? (0, s.jsx)(c.A, {
                                            className: 'text-muted h-4 w-4 flex-shrink-0',
                                          })
                                        : (0, s.jsx)(i.A, {
                                            className: 'text-muted h-4 w-4 flex-shrink-0',
                                          }),
                                      (0, s.jsxs)('div', {
                                        className: 'min-w-0 flex-1',
                                        children: [
                                          (0, s.jsx)('div', {
                                            className:
                                              'text-primary text-sm font-medium leading-tight',
                                            children: a.category,
                                          }),
                                          (0, s.jsxs)('div', {
                                            className: 'text-muted mt-1 text-xs',
                                            children: [
                                              a.totalHadiths,
                                              ' hadiths •',
                                              ' ',
                                              Object.keys(a.chapters).length,
                                              ' chapters',
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  b.has(t) &&
                                    (0, s.jsx)('div', {
                                      className: 'ml-6 mt-1 space-y-1',
                                      children: Object.entries(a.chapters).map((e) => {
                                        let [r, l] = e
                                        return (0, s.jsxs)(
                                          'button',
                                          {
                                            onClick: () => {
                                              var e, s
                                              ;(j({
                                                category: t,
                                                chapter: r,
                                                categoryId: (e = a.categoryId),
                                                chapterId: (s = l.chapterInCategoryId),
                                              }),
                                                B(e, s, t, r))
                                            },
                                            className: (0, o.cn)(
                                              'w-full rounded p-2 text-left text-sm transition-colors',
                                              (null == f ? void 0 : f.category) === t &&
                                                (null == f ? void 0 : f.chapter) === r
                                                ? 'bg-primary/10 text-primary border-primary/20 border'
                                                : 'hover:bg-card-hover text-secondary',
                                            ),
                                            children: [
                                              (0, s.jsx)('div', {
                                                className: 'leading-tight',
                                                children: l.chapter,
                                              }),
                                              (0, s.jsxs)('div', {
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
                  (0, s.jsx)('div', {
                    className: 'lg:col-span-2',
                    children: f
                      ? (0, s.jsxs)('div', {
                          className: 'space-y-4',
                          children: [
                            (0, s.jsx)('div', {
                              className: 'mb-8 rounded-xl border border-border bg-surface-1 p-6',
                              children: (0, s.jsxs)('div', {
                                className: 'flex items-center justify-between',
                                children: [
                                  (0, s.jsxs)('div', {
                                    children: [
                                      (0, s.jsx)('h2', {
                                        className: 'mb-2 text-2xl font-bold text-foreground',
                                        children: f.category,
                                      }),
                                      (0, s.jsx)('p', {
                                        className: 'mb-3 font-medium text-foreground-muted',
                                        children: f.chapter,
                                      }),
                                      (0, s.jsxs)('div', {
                                        className: 'flex items-center gap-3 text-sm',
                                        children: [
                                          (0, s.jsx)('span', {
                                            className:
                                              'rounded-full bg-surface-2 px-3 py-1.5 font-medium text-foreground',
                                            children: 'all' === x ? 'All Volumes' : (0, h.P)(H, x),
                                          }),
                                          (0, s.jsxs)('span', {
                                            className:
                                              'rounded-full bg-surface-2 px-3 py-1.5 font-medium text-foreground',
                                            children: [
                                              N.length,
                                              ' ',
                                              1 === N.length ? 'Hadith' : 'Hadiths',
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  C &&
                                    (0, s.jsxs)('div', {
                                      className:
                                        'flex items-center gap-2 text-sm text-foreground-muted',
                                      children: [
                                        (0, s.jsx)('div', {
                                          className:
                                            'h-4 w-4 animate-spin rounded-full border-b-2 border-foreground-muted',
                                        }),
                                        'Loading hadiths...',
                                      ],
                                    }),
                                ],
                              }),
                            }),
                            (0, s.jsx)('div', {
                              className:
                                'max-h-[80vh] space-y-6 overflow-y-auto overflow-x-visible',
                              children: C
                                ? (0, s.jsxs)('div', {
                                    className:
                                      'border-theme bg-card shadow-soft rounded-xl border p-12 text-center',
                                    children: [
                                      (0, s.jsx)('div', {
                                        className:
                                          'border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2',
                                      }),
                                      (0, s.jsx)('p', {
                                        className: 'text-muted',
                                        children: 'Loading chapter hadiths...',
                                      }),
                                    ],
                                  })
                                : N.length > 0
                                  ? N.map((e, a) => {
                                      var r, l, c
                                      return (0, s.jsx)(
                                        d.A,
                                        { hadith: e },
                                        null != (c = e._id)
                                          ? c
                                          : ''
                                              .concat(null != (r = e.bookId) ? r : t, '-')
                                              .concat(null != (l = e.id) ? l : a),
                                      )
                                    })
                                  : (0, s.jsx)('div', {
                                      className:
                                        'border-theme bg-card shadow-soft rounded-xl border p-8 text-center',
                                      children: (0, s.jsx)('p', {
                                        className: 'text-muted',
                                        children: 'No hadiths found in this chapter.',
                                      }),
                                    }),
                            }),
                          ],
                        })
                      : (0, s.jsxs)('div', {
                          className:
                            'border-theme bg-card shadow-soft rounded-xl border p-12 text-center',
                          children: [
                            (0, s.jsx)(n.A, { className: 'text-muted mx-auto mb-4 h-12 w-12' }),
                            (0, s.jsx)('h4', {
                              className: 'text-primary mb-2 text-lg font-medium',
                              children: 'Select a Chapter to Begin Reading',
                            }),
                            (0, s.jsx)('p', {
                              className: 'text-muted mb-4',
                              children:
                                'Expand a category on the left and select a chapter to view its hadiths with complete text, Arabic content, and grading information.',
                            }),
                            (0, s.jsxs)('div', {
                              className: 'text-muted text-sm',
                              children: [
                                (0, s.jsx)('p', { children: '\uD83D\uDCD6 Each hadith includes:' }),
                                (0, s.jsxs)('ul', {
                                  className: 'mt-2 space-y-1',
                                  children: [
                                    (0, s.jsx)('li', {
                                      children: '• Complete English and Arabic text',
                                    }),
                                    (0, s.jsx)('li', { children: '• Chain of narration (Sanad)' }),
                                    (0, s.jsx)('li', {
                                      children: '• Scholarly grading and authentication',
                                    }),
                                    (0, s.jsx)('li', { children: '• Source references and links' }),
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
    8446: (e, t, a) => {
      a.d(t, { A: () => s })
      let s = (0, a(5121).A)('book', [
        [
          'path',
          {
            d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
            key: 'k3hazp',
          },
        ],
      ])
    },
    9057: (e, t, a) => {
      function s(e) {
        let t = Array.isArray(e) && e.length > 0 ? e : []
        if (0 === t.length) return [{ value: 1, label: 'Volume 1' }]
        let a = t.map((e, t) => ({ value: e, label: 'Volume '.concat(t + 1) }))
        return (t.length > 1 && a.push({ value: 'all', label: 'All Volumes' }), a)
      }
      function r(e, t) {
        var a
        let r = s(e),
          l = r.find((e) => String(e.value) === String(t))
        return l ? l.label : (null == (a = r[0]) ? void 0 : a.label) || 'Volume 1'
      }
      a.d(t, { P: () => r, l: () => s })
    },
  },
])
