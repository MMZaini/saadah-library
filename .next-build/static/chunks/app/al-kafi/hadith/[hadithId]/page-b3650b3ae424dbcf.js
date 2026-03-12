;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [821],
  {
    63: (e, t, s) => {
      'use strict'
      var a = s(7260)
      ;(s.o(a, 'useParams') &&
        s.d(t, {
          useParams: function () {
            return a.useParams
          },
        }),
        s.o(a, 'usePathname') &&
          s.d(t, {
            usePathname: function () {
              return a.usePathname
            },
          }),
        s.o(a, 'useRouter') &&
          s.d(t, {
            useRouter: function () {
              return a.useRouter
            },
          }))
    },
    3018: (e, t, s) => {
      'use strict'
      ;(s.r(t), s.d(t, { default: () => h }))
      var a = s(5155),
        r = s(2115),
        n = s(63),
        o = s(9445),
        l = s(3962),
        c = s(3668),
        i = s(7003),
        u = s(5299),
        d = s(5626)
      function h() {
        let e = (0, n.useRouter)(),
          t = (0, n.useParams)(),
          { setChapterInfo: s } = (0, c.h)(),
          h = parseInt(t.hadithId),
          [m, x] = (0, r.useState)(null),
          [f, p] = (0, r.useState)(!0),
          [v, g] = (0, r.useState)(null)
        ;((0, r.useEffect)(() => {
          let e = async () => {
            ;(p(!0), g(null))
            try {
              let e = o.lH.getAlKafiVolumes(),
                t = await o.C$.findHadithAcrossBooks(e, h)
              if (!t) return void g('Hadith not found')
              ;(x(t),
                s({
                  volumeId: t.volume,
                  category: t.category || 'Unknown Category',
                  chapter: t.chapter || 'Unknown Chapter',
                  hadithCount: 1,
                  categoryId: t.categoryId,
                  chapterInCategoryId: t.chapterInCategoryId,
                }))
            } catch (e) {
              g('Failed to load hadith')
            } finally {
              p(!1)
            }
          }
          return (h && e(), () => s(null))
        }, [h, s]),
          (0, r.useEffect)(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, [h]))
        let j = () => {
          ;(null == m ? void 0 : m.volume) &&
          (null == m ? void 0 : m.categoryId) &&
          (null == m ? void 0 : m.chapterInCategoryId) !== null &&
          (null == m ? void 0 : m.chapterInCategoryId) !== void 0
            ? e.push(
                '/al-kafi/volume/'
                  .concat(m.volume, '/chapter/')
                  .concat(m.categoryId, '/')
                  .concat(m.chapterInCategoryId),
              )
            : e.push('/al-kafi')
        }
        return f
          ? (0, a.jsx)('main', {
              className: 'min-h-screen',
              children: (0, a.jsx)('div', {
                className: 'flex min-h-[60vh] items-center justify-center',
                children: (0, a.jsx)(u.A, {
                  className: 'h-6 w-6 animate-spin text-foreground-muted',
                }),
              }),
            })
          : v || !m
            ? (0, a.jsx)('main', {
                className: 'min-h-screen',
                children: (0, a.jsxs)('div', {
                  className: 'mx-auto max-w-4xl px-4 py-8 sm:px-6',
                  children: [
                    (0, a.jsxs)('button', {
                      onClick: j,
                      className:
                        'mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground',
                      children: [(0, a.jsx)(d.A, { className: 'h-3.5 w-3.5' }), 'Back to Al-Kāfi'],
                    }),
                    (0, a.jsx)('div', {
                      className: 'flex min-h-[50vh] items-center justify-center',
                      children: (0, a.jsxs)('div', {
                        className: 'text-center',
                        children: [
                          (0, a.jsx)('h1', {
                            className: 'mb-2 text-xl font-bold text-foreground',
                            children: v || 'Hadith Not Found',
                          }),
                          (0, a.jsx)('p', {
                            className: 'mb-5 text-sm text-foreground-muted',
                            children: 'The requested hadith could not be found.',
                          }),
                          (0, a.jsx)(i.$, { onClick: j, children: 'Return to Al-Kāfi' }),
                        ],
                      }),
                    }),
                  ],
                }),
              })
            : (0, a.jsx)('main', {
                className: 'min-h-screen',
                children: (0, a.jsxs)('div', {
                  className: 'mx-auto max-w-4xl px-4 py-8 sm:px-6',
                  children: [
                    (0, a.jsxs)('button', {
                      onClick: j,
                      className:
                        'mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground',
                      children: [(0, a.jsx)(d.A, { className: 'h-3.5 w-3.5' }), 'Back to Chapter'],
                    }),
                    (0, a.jsxs)('div', {
                      className: 'mb-6 text-center',
                      children: [
                        (0, a.jsxs)('h1', {
                          className: 'text-xl font-bold text-foreground',
                          children: ['Al-Kāfi Hadith #', m.id],
                        }),
                        (0, a.jsxs)('p', {
                          className: 'mt-1 text-sm text-foreground-muted',
                          children: [
                            'Volume ',
                            m.volume,
                            ' \xb7 ',
                            m.category,
                            ' \xb7 ',
                            m.chapter,
                          ],
                        }),
                      ],
                    }),
                    (0, a.jsxs)('div', {
                      className: 'relative',
                      children: [
                        (0, a.jsx)('div', {
                          className:
                            'absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground',
                          children: '1',
                        }),
                        (0, a.jsx)('div', {
                          className: 'ml-6',
                          children: (0, a.jsx)(l.A, { hadith: m, showViewChapter: !1 }),
                        }),
                      ],
                    }),
                  ],
                }),
              })
      }
    },
    3668: (e, t, s) => {
      'use strict'
      s.d(t, { h: () => l, x: () => o })
      var a = s(5155),
        r = s(2115)
      let n = (0, r.createContext)(void 0)
      function o(e) {
        let { children: t } = e,
          [s, o] = (0, r.useState)(null)
        return (0, a.jsx)(n.Provider, { value: { chapterInfo: s, setChapterInfo: o }, children: t })
      }
      function l() {
        let e = (0, r.useContext)(n)
        if (!e) throw Error('useChapter must be used within ChapterProvider')
        return e
      }
    },
    4227: (e, t, s) => {
      Promise.resolve().then(s.bind(s, 3018))
    },
    5626: (e, t, s) => {
      'use strict'
      s.d(t, { A: () => a })
      let a = (0, s(5121).A)('arrow-left', [
        ['path', { d: 'm12 19-7-7 7-7', key: '1l729n' }],
        ['path', { d: 'M19 12H5', key: 'x3x0zl' }],
      ])
    },
  },
  (e) => {
    ;(e.O(0, [307, 346, 952, 579, 962, 441, 255, 358], () => e((e.s = 4227))), (_N_E = e.O()))
  },
])
