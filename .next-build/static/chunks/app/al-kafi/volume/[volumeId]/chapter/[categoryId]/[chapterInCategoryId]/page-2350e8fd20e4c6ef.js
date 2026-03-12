;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [895],
  {
    63: (e, t, s) => {
      'use strict'
      var r = s(7260)
      ;(s.o(r, 'useParams') &&
        s.d(t, {
          useParams: function () {
            return r.useParams
          },
        }),
        s.o(r, 'usePathname') &&
          s.d(t, {
            usePathname: function () {
              return r.usePathname
            },
          }),
        s.o(r, 'useRouter') &&
          s.d(t, {
            useRouter: function () {
              return r.useRouter
            },
          }))
    },
    2075: (e, t, s) => {
      'use strict'
      ;(s.r(t), s.d(t, { default: () => m }))
      var r = s(5155),
        a = s(2115),
        n = s(63),
        l = s(9445),
        d = s(3962),
        c = s(3668),
        i = s(7003),
        o = s(7812),
        u = s(5299),
        h = s(5626)
      function m() {
        let e = (0, n.useRouter)(),
          t = (0, n.useParams)(),
          { setChapterInfo: s } = (0, c.h)(),
          m = parseInt(t.volumeId),
          x = t.categoryId,
          p = parseInt(t.chapterInCategoryId),
          [f, v] = (0, a.useState)([]),
          [j, g] = (0, a.useState)(!0),
          [N, y] = (0, a.useState)(null),
          [b, C] = (0, a.useState)(null)
        return ((0, a.useEffect)(() => {
          let e = async () => {
            ;(g(!0), y(null))
            try {
              let e = (await l.lH.getVolumeHadiths(m)).filter(
                (e) => e.categoryId === x && e.chapterInCategoryId === p,
              )
              if (0 === e.length) return void y('No hadiths found for this chapter')
              let t = e[0],
                r = {
                  category: t.category || 'Unknown Category',
                  chapter: t.chapter || 'Unknown Chapter',
                  hadithCount: e.length,
                }
              ;(C(r),
                s({
                  volumeId: m,
                  category: r.category,
                  chapter: r.chapter,
                  hadithCount: r.hadithCount,
                }))
              let a = e.sort((e, t) => e.id - t.id)
              v(a)
            } catch (e) {
              y('Failed to load chapter hadiths')
            } finally {
              g(!1)
            }
          }
          return (m && x && null != p && e(), () => s(null))
        }, [m, x, p, s]),
        (0, a.useEffect)(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, [m, x, p]),
        j)
          ? (0, r.jsx)('main', {
              className: 'min-h-screen',
              children: (0, r.jsxs)('div', {
                className: 'flex min-h-[60vh] items-center justify-center',
                children: [
                  (0, r.jsx)(u.A, { className: 'h-6 w-6 animate-spin text-foreground-muted' }),
                  (0, r.jsx)('span', {
                    className: 'ml-3 text-sm text-foreground-muted',
                    children: 'Loading chapter…',
                  }),
                ],
              }),
            })
          : N
            ? (0, r.jsx)('main', {
                className: 'min-h-screen',
                children: (0, r.jsx)('div', {
                  className: 'mx-auto max-w-5xl px-4 py-8 sm:px-6',
                  children: (0, r.jsx)('div', {
                    className: 'border-destructive/30 bg-destructive/10 rounded-lg border p-4',
                    children: (0, r.jsx)('p', {
                      className: 'text-sm text-destructive',
                      children: N,
                    }),
                  }),
                }),
              })
            : (0, r.jsx)('main', {
                className: 'min-h-screen',
                children: (0, r.jsxs)('div', {
                  className: 'mx-auto max-w-5xl px-4 py-8 sm:px-6',
                  children: [
                    b &&
                      (0, r.jsxs)('div', {
                        className: 'mb-6 rounded-lg border border-border bg-surface-1 p-5',
                        children: [
                          (0, r.jsx)('h2', {
                            className: 'text-xl font-bold text-foreground',
                            children: b.chapter,
                          }),
                          (0, r.jsxs)('p', {
                            className: 'mt-1 text-sm text-foreground-muted',
                            children: ['Category: ', b.category],
                          }),
                          (0, r.jsxs)('div', {
                            className: 'mt-2 flex gap-1.5',
                            children: [
                              (0, r.jsxs)(o.E, { variant: 'secondary', children: ['Volume ', m] }),
                              (0, r.jsxs)(o.E, {
                                variant: 'secondary',
                                children: [b.hadithCount, ' Hadiths'],
                              }),
                            ],
                          }),
                        ],
                      }),
                    (0, r.jsx)('div', {
                      className: 'space-y-5',
                      children: f.map((e, t) =>
                        (0, r.jsxs)(
                          'div',
                          {
                            className: 'relative',
                            children: [
                              (0, r.jsx)('div', {
                                className:
                                  'absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground',
                                children: t + 1,
                              }),
                              (0, r.jsx)('div', {
                                className: 'ml-6',
                                children: (0, r.jsx)(d.A, { hadith: e }),
                              }),
                            ],
                          },
                          e._id || e.id || t,
                        ),
                      ),
                    }),
                    (0, r.jsx)('div', {
                      className: 'mt-10 border-t border-border pt-6',
                      children: (0, r.jsxs)(i.$, {
                        variant: 'outline',
                        onClick: () => e.push('/al-kafi'),
                        children: [
                          (0, r.jsx)(h.A, { className: 'mr-1.5 h-3.5 w-3.5' }),
                          'Back to Al-Kāfi Explorer',
                        ],
                      }),
                    }),
                  ],
                }),
              })
      }
    },
    3668: (e, t, s) => {
      'use strict'
      s.d(t, { h: () => d, x: () => l })
      var r = s(5155),
        a = s(2115)
      let n = (0, a.createContext)(void 0)
      function l(e) {
        let { children: t } = e,
          [s, l] = (0, a.useState)(null)
        return (0, r.jsx)(n.Provider, { value: { chapterInfo: s, setChapterInfo: l }, children: t })
      }
      function d() {
        let e = (0, a.useContext)(n)
        if (!e) throw Error('useChapter must be used within ChapterProvider')
        return e
      }
    },
    5030: (e, t, s) => {
      Promise.resolve().then(s.bind(s, 2075))
    },
    5626: (e, t, s) => {
      'use strict'
      s.d(t, { A: () => r })
      let r = (0, s(5121).A)('arrow-left', [
        ['path', { d: 'm12 19-7-7 7-7', key: '1l729n' }],
        ['path', { d: 'M19 12H5', key: 'x3x0zl' }],
      ])
    },
  },
  (e) => {
    ;(e.O(0, [307, 346, 952, 579, 962, 441, 255, 358], () => e((e.s = 5030))), (_N_E = e.O()))
  },
])
