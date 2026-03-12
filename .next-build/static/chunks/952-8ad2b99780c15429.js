'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [952],
  {
    916: (e, t, a) => {
      a.d(t, { $: () => s, T: () => c })
      var r = a(5155),
        o = a(2115)
      let l = () => {
          try {
            let e = '__localStorage_test__'
            return (localStorage.setItem(e, e), localStorage.removeItem(e), !0)
          } catch (e) {
            return !1
          }
        },
        i = (0, o.createContext)(null),
        n = 'bookmarkedHadiths'
      function s(e) {
        let { children: t } = e,
          [a, s] = (0, o.useState)([]),
          [c, u] = (0, o.useState)(!1)
        ;((0, o.useEffect)(() => {
          if ((u(!0), l()))
            try {
              let e = localStorage.getItem(n)
              if (e) {
                let t = JSON.parse(e)
                  .filter(
                    (e) =>
                      'number' == typeof e.id &&
                      'string' == typeof e.bookId &&
                      'string' == typeof e.book &&
                      'number' == typeof e.timestamp,
                  )
                  .sort((e, t) => t.timestamp - e.timestamp)
                s(t)
              }
            } catch (e) {
              console.error('Failed to load bookmarks from localStorage:', e)
              try {
                localStorage.removeItem(n)
              } catch (e) {}
            }
        }, []),
          (0, o.useEffect)(() => {
            if (c && l())
              try {
                localStorage.setItem(n, JSON.stringify(a))
              } catch (e) {
                if (
                  (console.error('Failed to save bookmarks to localStorage:', e),
                  e instanceof Error && e.message.includes('QuotaExceededError'))
                )
                  try {
                    let e = a.slice(0, Math.floor(500))
                    ;(s(e), localStorage.setItem(n, JSON.stringify(e)))
                  } catch (e) {
                    console.error('Failed to save reduced bookmarks:', e)
                  }
              }
          }, [a, c]))
        let h = (0, o.useCallback)((e) => {
            s((t) => {
              if (t.some((t) => t.id === e.id && t.bookId === e.bookId)) return t
              let a = e.englishText || e.thaqalaynMatn || '',
                r = e.arabicText || '',
                o = [
                  {
                    id: e.id,
                    bookId: e.bookId,
                    book: e.book,
                    category: e.category,
                    chapter: e.chapter,
                    volume: e.volume,
                    timestamp: Date.now(),
                    preview: a.slice(0, 200) + (a.length > 200 ? '...' : ''),
                    arabicPreview: r ? r.slice(0, 200) + (r.length > 200 ? '...' : '') : void 0,
                  },
                  ...t,
                ]
              return o.length > 1e3 ? o.slice(0, 1e3) : o
            })
          }, []),
          d = (0, o.useCallback)((e, t) => {
            s((a) => a.filter((a) => a.id !== t || a.bookId !== e))
          }, []),
          m = (0, o.useCallback)((e, t, a) => {
            s((r) =>
              r.map((r) =>
                r.id === t && r.bookId === e ? { ...r, notes: a.trim() || void 0 } : r,
              ),
            )
          }, []),
          f = (0, o.useCallback)((e) => {
            let t = 0,
              a = 0
            return (
              s((r) => {
                let o = new Set(r.map((e) => ''.concat(e.bookId, '::').concat(e.id))),
                  l = []
                for (let r of e) {
                  let e = ''.concat(r.bookId, '::').concat(r.id)
                  o.has(e)
                    ? a++
                    : 'number' == typeof r.id &&
                      'string' == typeof r.bookId &&
                      'string' == typeof r.book &&
                      'string' == typeof r.category &&
                      'string' == typeof r.chapter &&
                      'number' == typeof r.timestamp &&
                      (l.push({
                        ...r,
                        timestamp: r.timestamp || Date.now(),
                        preview: r.preview || ''.concat(r.book, ' - ').concat(r.chapter),
                        arabicPreview: r.arabicPreview || void 0,
                        notes: r.notes || void 0,
                      }),
                      t++,
                      o.add(e))
                }
                let i = [...l, ...r]
                return i.length > 1e3 ? i.slice(0, 1e3) : i
              }),
              { imported: t, duplicates: a }
            )
          }, []),
          y = (0, o.useCallback)((e, t) => a.some((a) => a.id === t && a.bookId === e), [a]),
          g = (0, o.useMemo)(
            () => ({
              bookmarks: a,
              addBookmark: h,
              removeBookmark: d,
              updateBookmarkNotes: m,
              importBookmarks: f,
              isBookmarked: y,
              bookmarkCount: a.length,
              isHydrated: c,
            }),
            [a, h, d, m, f, y, c],
          )
        return (0, r.jsx)(i.Provider, { value: g, children: t })
      }
      function c() {
        let e = (0, o.useContext)(i)
        if (!e) throw Error('useBookmarks must be used within a BookmarksProvider')
        return e
      }
    },
    2180: (e, t, a) => {
      a.d(t, { TooltipProvider: () => n, ZI: () => u, k$: () => c, m_: () => s })
      var r = a(5155),
        o = a(2115),
        l = a(1617),
        i = a(5016)
      let n = l.Kq,
        s = l.bL,
        c = l.l9,
        u = o.forwardRef((e, t) => {
          let { className: a, sideOffset: o = 4, ...n } = e
          return (0, r.jsx)(l.ZL, {
            children: (0, r.jsx)(l.UC, {
              ref: t,
              sideOffset: o,
              className: (0, i.cn)(
                'z-50 overflow-hidden rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-foreground shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                a,
              ),
              ...n,
            }),
          })
        })
      u.displayName = l.UC.displayName
    },
    2740: (e, t, a) => {
      a.d(t, { bE: () => c, ei: () => u, yU: () => s })
      var r = a(9445)
      let o = {
          'Al-Kafi': {
            bookId: 'Al-Kafi',
            baseName: 'Al-Kafi-Kulayni',
            englishName: 'Al-Kāfi',
            hasMultipleVolumes: !0,
            volumes: r.lH.getAlKafiVolumes(),
            volumeCount: 8,
          },
          'Uyun-akhbar-al-Rida': {
            bookId: 'Uyun-akhbar-al-Rida',
            baseName: 'Uyun-akhbar-al-Rida-Saduq',
            englishName: 'ʿUyūn akhbār al-Riḍā',
            hasMultipleVolumes: !0,
            volumes: r.Gs.getUyunVolumes(),
            volumeCount: 2,
          },
          'Man-La-Yahduruh-al-Faqih': {
            bookId: 'Man-La-Yahduruh-al-Faqih',
            baseName: 'Man-La-Yahduruh-al-Faqih-Saduq',
            englishName: 'Man lā yaḥḍuruh al-Faqīh',
            hasMultipleVolumes: !0,
            volumes: [
              'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',
              'Man-La-Yahduruh-al-Faqih-Volume-2-Saduq',
              'Man-La-Yahduruh-al-Faqih-Volume-3-Saduq',
              'Man-La-Yahduruh-al-Faqih-Volume-4-Saduq',
              'Man-La-Yahduruh-al-Faqih-Volume-5-Saduq',
            ],
            volumeCount: 5,
          },
        },
        l = [
          'Al-Tawhid-Saduq',
          'Al-Amali-Mufid',
          'Al-Amali-Saduq',
          'Nahj-al-Balagha-Radi',
          'Sifat-al-Shia-Saduq',
          'Fadail-al-Shia-Saduq',
          'Kitab-al-Mumin-Ahwazi',
          'Kitab-al-Zuhd-Ahwazi',
          'Risalat-al-Huquq-Abidin',
          'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
          'Al-Khisal-Saduq',
          'Kamil-al-Ziyarat-Qummi',
          'Kitab-al-Duafa-Ghadairi',
          'Maani-al-Akhbar-Saduq',
          'Mujam-al-Ahadith-al-Mutabara-Muhsini',
        ],
        i = {
          'Uyun-akhbar-al-Rida': 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
          'Man-La-Yahduruh-al-Faqih': 'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',
          'Al-Amali-Mufid': 'Al-Amali-Mufid',
          'Al-Amali-Saduq': 'Al-Amali-Saduq',
          'Al-Tawhid': 'Al-Tawhid-Saduq',
          'Kitab-al-Ghayba-Numani': 'Kitab-al-Ghayba-Numani',
          'Kitab-al-Ghayba-Tusi': 'Kitab-al-Ghayba-Tusi',
          'Nahj-al-Balagha': 'Nahj-al-Balagha-Radi',
          'Sifat-al-Shia': 'Sifat-al-Shia-Saduq',
          'Fadail-al-Shia': 'Fadail-al-Shia-Saduq',
          'Kitab-al-Mumin': 'Kitab-al-Mumin-Ahwazi',
          'Kitab-al-Zuhd': 'Kitab-al-Zuhd-Ahwazi',
          'Risalat-al-Huquq': 'Risalat-al-Huquq-Abidin',
          'Thawab-al-Amal-wa-iqab-al-Amal': 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
          'Al-Khisal': 'Al-Khisal-Saduq',
          'Kamil-al-Ziyarat': 'Kamil-al-Ziyarat-Qummi',
          'Kitab-al-Duafa': 'Kitab-al-Duafa-Ghadairi',
          'Maani-al-Akhbar': 'Maani-al-Akhbar-Saduq',
          'Mujam-al-Ahadith-al-Mutabara': 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
        },
        n = Object.fromEntries(
          Object.entries(i).map((e) => {
            let [t, a] = e
            return [a, t]
          }),
        ),
        s = (e) => (n[e] || e).toLowerCase(),
        c = (e) => {
          if (!e) return e
          let t = i[e]
          if (t) return t
          let a = e.toLowerCase()
          return (
            Object.fromEntries(
              Object.entries(i).map((e) => {
                let [t, a] = e
                return [t.toLowerCase(), a]
              }),
            )[a] || e
          )
        },
        u = (e) => {
          for (let [t, a] of Object.entries(o)) if (e.startsWith(t)) return a
          return l.includes(e)
            ? {
                bookId: e,
                baseName: e,
                englishName: e,
                hasMultipleVolumes: !1,
                volumes: [e],
                volumeCount: 1,
              }
            : null
        }
    },
    4664: (e, t, a) => {
      a.d(t, { w: () => n })
      var r = a(5155),
        o = a(2115),
        l = a(7321),
        i = a(5016)
      let n = o.forwardRef((e, t) => {
        let { className: a, orientation: o = 'horizontal', decorative: n = !0, ...s } = e
        return (0, r.jsx)(l.b, {
          ref: t,
          decorative: n,
          orientation: o,
          className: (0, i.cn)(
            'shrink-0 bg-border',
            'horizontal' === o ? 'h-[1px] w-full' : 'h-full w-[1px]',
            a,
          ),
          ...s,
        })
      })
      n.displayName = l.b.displayName
    },
    5016: (e, t, a) => {
      a.d(t, { cn: () => l })
      var r = a(2821),
        o = a(5889)
      function l() {
        for (var e = arguments.length, t = Array(e), a = 0; a < e; a++) t[a] = arguments[a]
        return (0, o.QP)((0, r.$)(t))
      }
    },
    6198: (e, t, a) => {
      a.d(t, { Z: () => s, t: () => c })
      var r = a(5155),
        o = a(2115)
      let l = () => {
          try {
            let e = '__localStorage_test__'
            return (localStorage.setItem(e, e), localStorage.removeItem(e), !0)
          } catch (e) {
            return !1
          }
        },
        i = { theme: 'dark', arabicFontSize: 100, englishFontSize: 100, alwaysShowFullHadith: !1 },
        n = (0, o.createContext)(null)
      function s(e) {
        let { children: t } = e,
          [a, s] = (0, o.useState)(i),
          [c, u] = (0, o.useState)(!1),
          [h, d] = (0, o.useState)(!1)
        ;((0, o.useEffect)(() => {
          if ((d(!0), !l())) return void s(i)
          try {
            let a = localStorage.getItem('siteSettings')
            if (a) {
              var e, t
              let r = JSON.parse(a),
                o = {
                  ...i,
                  ...r,
                  theme: 'dark',
                  arabicFontSize:
                    5 *
                    Math.round(
                      Math.min(
                        150,
                        Math.max(75, null != (e = r.arabicFontSize) ? e : i.arabicFontSize),
                      ) / 5,
                    ),
                  englishFontSize:
                    5 *
                    Math.round(
                      Math.min(
                        150,
                        Math.max(75, null != (t = r.englishFontSize) ? t : i.englishFontSize),
                      ) / 5,
                    ),
                }
              s(o)
            } else s(i)
          } catch (e) {
            s(i)
          }
        }, []),
          (0, o.useEffect)(() => {
            if (h) {
              let e = document.documentElement
              ;(e.setAttribute('data-theme', a.theme),
                e.style.setProperty(
                  '--hadith-arabic-font-size',
                  ''.concat(1.485 * a.arabicFontSize, '%'),
                ),
                e.style.setProperty(
                  '--hadith-english-font-size',
                  ''.concat(a.englishFontSize, '%'),
                ))
            } else
              'undefined' != typeof document &&
                document.documentElement.setAttribute('data-theme', 'dark')
          }, [a.theme, a.arabicFontSize, a.englishFontSize, a.alwaysShowFullHadith, h]))
        let m = (0, o.useCallback)(
            (e) => {
              s((t) => {
                let a = { ...t, ...e }
                try {
                  if ('undefined' != typeof document) {
                    let e = document.documentElement
                    ;(void 0 !== a.arabicFontSize &&
                      e.style.setProperty(
                        '--hadith-arabic-font-size',
                        ''.concat(1.485 * a.arabicFontSize, '%'),
                      ),
                      void 0 !== a.englishFontSize &&
                        e.style.setProperty(
                          '--hadith-english-font-size',
                          ''.concat(a.englishFontSize, '%'),
                        ))
                  }
                } catch (e) {}
                if (h && l())
                  try {
                    localStorage.setItem('siteSettings', JSON.stringify(a))
                  } catch (e) {
                    if (e instanceof Error && e.message.includes('QuotaExceededError'))
                      try {
                        ;(localStorage.clear(),
                          localStorage.setItem('siteSettings', JSON.stringify(a)))
                      } catch (e) {}
                  }
                return a
              })
            },
            [h],
          ),
          f = (0, o.useCallback)(() => u((e) => !e), []),
          y = (0, o.useCallback)(() => {
            m({ arabicFontSize: 100, englishFontSize: 100 })
          }, [m]),
          g = (0, o.useCallback)(() => {
            m({ arabicFontSize: 100 })
          }, [m]),
          b = (0, o.useCallback)(() => {
            m({ englishFontSize: 100 })
          }, [m]),
          p = (0, o.useMemo)(
            () => ({
              settings: a,
              updateSettings: m,
              isSettingsOpen: c,
              toggleSettings: f,
              resetFontSizes: y,
              resetArabicFontSize: g,
              resetEnglishFontSize: b,
              isHydrated: h,
            }),
            [a, m, c, f, y, g, b, h],
          )
        return (0, r.jsx)(n.Provider, { value: p, children: t })
      }
      function c() {
        let e = (0, o.useContext)(n)
        if (!e) throw Error('useSettings must be used within a SettingsProvider')
        return e
      }
    },
    7003: (e, t, a) => {
      a.d(t, { $: () => c })
      var r = a(5155),
        o = a(2115),
        l = a(2467),
        i = a(3101),
        n = a(5016)
      let s = (0, i.F)(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          {
            variants: {
              variant: {
                default: 'bg-accent text-accent-foreground hover:bg-accent/90',
                secondary: 'bg-surface-2 text-foreground hover:bg-surface-2/80',
                outline: 'border border-border bg-transparent hover:bg-surface-2',
                ghost: 'hover:bg-surface-2',
                link: 'text-accent underline-offset-4 hover:underline',
                destructive: 'bg-destructive text-white hover:bg-destructive/90',
              },
              size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
              },
            },
            defaultVariants: { variant: 'default', size: 'default' },
          },
        ),
        c = o.forwardRef((e, t) => {
          let { className: a, variant: o, size: i, asChild: c = !1, ...u } = e,
            h = c ? l.DX : 'button'
          return (0, r.jsx)(h, {
            className: (0, n.cn)(s({ variant: o, size: i, className: a })),
            ref: t,
            ...u,
          })
        })
      c.displayName = 'Button'
    },
    9445: (e, t, a) => {
      a.d(t, { lH: () => p, A1: () => k, C$: () => b, Gs: () => w })
      let r = new Map()
      function o(e) {
        if ((r.set(e.key, e), r.size > 250)) {
          let e = r.keys().next().value
          e && r.delete(e)
        }
      }
      let l = 'responses',
        i = null,
        n = !1
      function s() {
        return n
          ? Promise.reject(Error('IndexedDB unavailable'))
          : i ||
              (i = new Promise((e, t) => {
                try {
                  let a = indexedDB.open('saadah-hadith-cache', 1)
                  ;((a.onupgradeneeded = () => {
                    let e = a.result
                    e.objectStoreNames.contains(l) || e.createObjectStore(l, { keyPath: 'key' })
                  }),
                    (a.onsuccess = () => e(a.result)),
                    (a.onerror = () => {
                      ;((n = !0), t(a.error))
                    }))
                } catch (e) {
                  ;((n = !0), t(e))
                }
              }))
      }
      async function c(e) {
        if (n) return null
        try {
          let t = await s()
          return new Promise((a) => {
            let r = t.transaction(l, 'readonly').objectStore(l).get(e)
            ;((r.onsuccess = () => {
              let e = r.result
              if (!e || Date.now() - e.timestamp > e.ttl) return a(null)
              a(e)
            }),
              (r.onerror = () => a(null)))
          })
        } catch (e) {
          return null
        }
      }
      async function u(e) {
        if (!n)
          try {
            let t = await s()
            return new Promise((a) => {
              let r = t.transaction(l, 'readwrite')
              ;(r.objectStore(l).put(e), (r.oncomplete = () => a()), (r.onerror = () => a()))
            })
          } catch (e) {}
      }
      let h = {
        allBooks: 864e5,
        bookHadiths: 432e5,
        singleHadith: 864e5,
        search: 18e5,
        default: 3e5,
      }
      async function d(e) {
        let t = (function (e) {
          let t = r.get(e)
          return t ? (Date.now() - t.timestamp > t.ttl ? (r.delete(e), null) : t) : null
        })(e)
        if (t) return t.data
        {
          let t = await c(e)
          if (t) return (o(t), t.data)
        }
        return null
      }
      async function m(e, t, a) {
        let r =
          null != a
            ? a
            : (function (e) {
                if (e.includes('/random')) return 0
                if (e.includes('/allbooks')) return h.allBooks
                if (e.includes('/query')) return h.search
                let t = '/api/v2/',
                  a = e.indexOf(t)
                if (-1 === a) return h.default
                let r = e
                  .slice(a + t.length)
                  .split('/')
                  .filter(Boolean)
                return 2 === r.length && /^\d+$/.test(r[1])
                  ? h.singleHadith
                  : 1 !== r.length || e.includes('/ingredients')
                    ? h.default
                    : h.bookHadiths
              })(e)
        if (r <= 0) return
        let l = { key: e, data: t, timestamp: Date.now(), ttl: r }
        ;(o(l), u(l))
      }
      async function f(e, t, a) {
        let r = ''.concat(e, '/').concat(t),
          o = await d(r)
        if (Array.isArray(o)) {
          let e = o.find((e) => e && e.id === a)
          if (e) return e
        }
        let l = ''.concat(e, '/').concat(t, '/').concat(a),
          i = await d(l)
        return !i || 'object' != typeof i || 'error' in i ? null : i
      }
      let y = 'https://www.thaqalayn-api.net/api/v2',
        g = async (e, t) => {
          let a = await d(e)
          if (a) return a
          let r = await fetch(e, {
            ...t,
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate, br',
              ...(null == t ? void 0 : t.headers),
            },
          })
          if (!r.ok) throw Error('API Error: '.concat(r.status, ' ').concat(r.statusText))
          let o = await r.json()
          return (await m(e, o), o)
        },
        b = {
          getAllBooks: async () => await g(''.concat(y, '/allbooks')),
          async getRandomHadith() {
            let e = await fetch(''.concat(y, '/random'), {
              headers: { Accept: 'application/json' },
            })
            if (!e.ok) throw Error('Failed to fetch random hadith: '.concat(e.statusText))
            return e.json()
          },
          async getRandomHadithFromBook(e) {
            let t = await fetch(''.concat(y, '/').concat(e, '/random'))
            if (!t.ok)
              throw Error(
                'Failed to fetch random hadith from '.concat(e, ': ').concat(t.statusText),
              )
            return t.json()
          },
          async searchAllBooks(e) {
            try {
              let { isArabicQuery: t, normalizeArabic: r } = await a.e(579).then(a.bind(a, 8579)),
                o = t(e) ? r(e) : e,
                l = encodeURIComponent(o),
                i = await g(''.concat(y, '/query?q=').concat(l))
              return { results: Array.isArray(i) ? i : [], total: Array.isArray(i) ? i.length : 0 }
            } catch (r) {
              let t = encodeURIComponent(e),
                a = await g(''.concat(y, '/query?q=').concat(t))
              return { results: Array.isArray(a) ? a : [], total: Array.isArray(a) ? a.length : 0 }
            }
          },
          async searchBook(e, t) {
            try {
              let { isArabicQuery: r, normalizeArabic: o } = await a.e(579).then(a.bind(a, 8579)),
                l = r(t) ? o(t) : t,
                i = encodeURIComponent(l),
                n = await g(''.concat(y, '/query/').concat(e, '?q=').concat(i))
              return { results: Array.isArray(n) ? n : [], total: Array.isArray(n) ? n.length : 0 }
            } catch (o) {
              let a = encodeURIComponent(t),
                r = await g(''.concat(y, '/query/').concat(e, '?q=').concat(a))
              return { results: Array.isArray(r) ? r : [], total: Array.isArray(r) ? r.length : 0 }
            }
          },
          getBookHadiths: async (e) => await g(''.concat(y, '/').concat(e)),
          async getSpecificHadith(e, t) {
            let a = await f(y, e, t)
            if (a) return a
            let r = await g(''.concat(y, '/').concat(e, '/').concat(t))
            if (r && 'object' == typeof r && 'error' in r) throw Error(r.error)
            return r
          },
          async findHadithAcrossBooks(e, t) {
            for (let a of e) {
              let e = await f(y, a, t)
              if (e) return e
            }
            for (let a of await Promise.allSettled(
              e.map(async (e) => {
                let a = await g(''.concat(y, '/').concat(e, '/').concat(t))
                if (a && 'object' == typeof a && 'error' in a)
                  throw Error('Not found in this volume')
                return a
              }),
            ))
              if ('fulfilled' === a.status && a.value) return a.value
            return null
          },
          async getIngredients() {
            let e = await fetch(''.concat(y, '/ingredients'))
            if (!e.ok) throw Error('Failed to fetch ingredients: '.concat(e.statusText))
            return e.json()
          },
        },
        p = {
          getAlKafiVolumes: () => [
            'Al-Kafi-Volume-1-Kulayni',
            'Al-Kafi-Volume-2-Kulayni',
            'Al-Kafi-Volume-3-Kulayni',
            'Al-Kafi-Volume-4-Kulayni',
            'Al-Kafi-Volume-5-Kulayni',
            'Al-Kafi-Volume-6-Kulayni',
            'Al-Kafi-Volume-7-Kulayni',
            'Al-Kafi-Volume-8-Kulayni',
          ],
          async getRandomAlKafiHadith() {
            let e = this.getAlKafiVolumes(),
              t = e[Math.floor(Math.random() * e.length)]
            return b.getRandomHadithFromBook(t)
          },
          async getRandomHadithFromVolume(e) {
            if (e < 1 || e > 8) throw Error('Al-Kafi volume must be between 1 and 8')
            return b.getRandomHadithFromBook('Al-Kafi-Volume-'.concat(e, '-Kulayni'))
          },
          async searchAlKafi(e) {
            let t = this.getAlKafiVolumes().map((t) => b.searchBook(t, e))
            try {
              let e = (await Promise.all(t)).flatMap((e) => e.results)
              return { results: e, total: e.length }
            } catch (e) {
              return { results: [], total: 0 }
            }
          },
          async getVolumeHadiths(e) {
            if (e < 1 || e > 8) throw Error('Al-Kafi volume must be between 1 and 8')
            return b.getBookHadiths('Al-Kafi-Volume-'.concat(e, '-Kulayni'))
          },
          async getVolumeChapterStructure(e) {
            if (e < 1 || e > 8) throw Error('Al-Kafi volume must be between 1 and 8')
            try {
              let t = await this.getVolumeHadiths(e),
                a = {}
              return (
                t.forEach((e) => {
                  let t = e.category || 'Uncategorized',
                    r = e.chapter || 'No Chapter'
                  ;(a[t] || (a[t] = { category: t, categoryId: e.categoryId || '', chapters: {} }),
                    a[t].chapters[r] ||
                      (a[t].chapters[r] = {
                        chapter: r,
                        chapterInCategoryId: e.chapterInCategoryId || 0,
                        hadiths: [],
                      }),
                    a[t].chapters[r].hadiths.push(e))
                }),
                Object.values(a).forEach((e) => {
                  let t = {}
                  ;(Object.entries(e.chapters)
                    .sort((e, t) => {
                      let [, a] = e,
                        [, r] = t
                      return a.chapterInCategoryId - r.chapterInCategoryId
                    })
                    .forEach((e) => {
                      let [a, r] = e
                      t[a] = r
                    }),
                    (e.chapters = t))
                }),
                a
              )
            } catch (t) {
              throw Error('Failed to load volume '.concat(e, ' structure'))
            }
          },
          async getChapterHadiths(e, t, a) {
            if (e < 1 || e > 8) throw Error('Al-Kafi volume must be between 1 and 8')
            try {
              return (await b.getBookHadiths('Al-Kafi-Volume-'.concat(e, '-Kulayni'))).filter(
                (e) => e.categoryId === t && e.chapterInCategoryId === a,
              )
            } catch (e) {
              throw Error('Failed to load chapter hadiths')
            }
          },
        },
        w = {
          getUyunVolumes: () => [
            'Uyun-akhbar-al-Rida-Volume-1-Saduq',
            'Uyun-akhbar-al-Rida-Volume-2-Saduq',
          ],
          async getRandomUyunHadith() {
            let e = this.getUyunVolumes(),
              t = e[Math.floor(Math.random() * e.length)]
            return b.getRandomHadithFromBook(t)
          },
          async getRandomHadithFromVolume(e) {
            if (e < 1 || e > 2) throw Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
            return b.getRandomHadithFromBook('Uyun-akhbar-al-Rida-Volume-'.concat(e, '-Saduq'))
          },
          async searchUyun(e) {
            let t = this.getUyunVolumes().map((t) => b.searchBook(t, e))
            try {
              let e = (await Promise.all(t)).flatMap((e) => e.results)
              return { results: e, total: e.length }
            } catch (e) {
              return { results: [], total: 0 }
            }
          },
          async getVolumeHadiths(e) {
            if (e < 1 || e > 2) throw Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
            return b.getBookHadiths('Uyun-akhbar-al-Rida-Volume-'.concat(e, '-Saduq'))
          },
          async getVolumeChapterStructure(e) {
            if (e < 1 || e > 2) throw Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
            try {
              let t = await this.getVolumeHadiths(e),
                a = {}
              return (
                t.forEach((e) => {
                  let t = e.category || 'Uncategorized',
                    r = e.chapter || 'No Chapter'
                  ;(a[t] || (a[t] = { category: t, categoryId: e.categoryId || '', chapters: {} }),
                    a[t].chapters[r] ||
                      (a[t].chapters[r] = {
                        chapter: r,
                        chapterInCategoryId: e.chapterInCategoryId || 0,
                        hadiths: [],
                      }),
                    a[t].chapters[r].hadiths.push(e))
                }),
                Object.values(a).forEach((e) => {
                  let t = {}
                  ;(Object.entries(e.chapters)
                    .sort((e, t) => {
                      let [, a] = e,
                        [, r] = t
                      return a.chapterInCategoryId - r.chapterInCategoryId
                    })
                    .forEach((e) => {
                      let [a, r] = e
                      t[a] = r
                    }),
                    (e.chapters = t))
                }),
                a
              )
            } catch (t) {
              throw Error('Failed to load volume '.concat(e, ' structure'))
            }
          },
          async getChapterHadiths(e, t, a) {
            if (e < 1 || e > 2) throw Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
            try {
              return (
                await b.getBookHadiths('Uyun-akhbar-al-Rida-Volume-'.concat(e, '-Saduq'))
              ).filter((e) => e.categoryId === t && e.chapterInCategoryId === a)
            } catch (e) {
              throw Error('Failed to load chapter hadiths')
            }
          },
        },
        k = {
          getBookHadiths: async (e) => await b.getBookHadiths(e),
          async getBookChapterStructure(e) {
            try {
              let t = await this.getBookHadiths(e),
                a = {}
              return (
                t.forEach((e) => {
                  let t = e.category || 'No Category',
                    r = e.chapter || 'No Chapter'
                  ;(a[t] || (a[t] = { category: t, categoryId: e.categoryId || '', chapters: {} }),
                    a[t].chapters[r] ||
                      (a[t].chapters[r] = {
                        chapter: r,
                        chapterInCategoryId: e.chapterInCategoryId || 0,
                        hadiths: [],
                      }),
                    a[t].chapters[r].hadiths.push(e))
                }),
                Object.values(a).forEach((e) => {
                  let t = {}
                  ;(Object.entries(e.chapters)
                    .sort((e, t) => {
                      let [, a] = e,
                        [, r] = t
                      return a.chapterInCategoryId - r.chapterInCategoryId
                    })
                    .forEach((e) => {
                      let [a, r] = e
                      t[a] = r
                    }),
                    (e.chapters = t))
                }),
                a
              )
            } catch (t) {
              throw (
                console.error('Error getting chapter structure for '.concat(e, ':'), t),
                Error('Failed to load chapter structure for '.concat(e))
              )
            }
          },
          async getChapterHadiths(e, t, a) {
            try {
              return (await this.getBookHadiths(e)).filter(
                (e) => e.categoryId === t && e.chapterInCategoryId === a,
              )
            } catch (t) {
              throw (
                console.error('Error getting chapter hadiths for '.concat(e, ':'), t),
                Error('Failed to load chapter hadiths for '.concat(e))
              )
            }
          },
        }
    },
  },
])
