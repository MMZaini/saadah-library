'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [579],
  {
    8579: (e, t, n) => {
      function l(e) {
        if (!e || 'string' != typeof e) return !1
        let t = e.trim()
        if (0 === t.length) return !1
        let n = (t.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length,
          l = t.replace(/\s/g, '').length
        return l > 0 && n / l > 0.3
      }
      function i(e) {
        if (
          !e ||
          !(e && 'string' == typeof e && /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(e))
        )
          return [e]
        let t = new Set()
        for (let n of (t.add(e),
        e.startsWith('ال') && e.length > 2 ? t.add(e.slice(2)) : e.length > 0 && t.add('ال' + e),
        ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ك', 'ل']))
          if (e.startsWith(n) && e.length > n.length + 1) {
            let l = e.slice(n.length)
            ;(t.add(l), l.startsWith('ال') || t.add('ال' + l))
          }
        for (let n of [
          'هما',
          'كما',
          'نها',
          'ها',
          'هم',
          'هن',
          'ني',
          'نا',
          'كم',
          'كن',
          'ك',
          'ه',
          'ون',
          'ين',
          'ان',
          'ات',
          'ة',
        ])
          e.endsWith(n) && e.length > n.length + 1 && t.add(e.slice(0, -n.length))
        if (e.length >= 3) {
          ;(e.startsWith('م') && e.length > 3 && t.add(e.slice(1)),
            e.startsWith('ا') && e.length > 3 && t.add(e.slice(1)),
            e.startsWith('ت') && e.length > 3 && t.add(e.slice(1)),
            e.startsWith('است') && e.length > 5 && t.add(e.slice(3)))
          let n = e.replace(/[اوي]/g, '')
          if (n.length >= 3) {
            let e = n.slice(0, 3)
            t.add(e)
            let [l, i, r] = e.split('')
            l &&
              i &&
              r &&
              (t.add(l + 'ا' + i + r),
              t.add('م' + l + i + 'ول'),
              t.add(l + i + 'ي' + r),
              t.add(l + i + 'ال'),
              t.add(l + i + 'ول'))
          }
        }
        return Array.from(t).filter((e) => e && e.length >= 2)
      }
      function r(e, t) {
        if (!e || !t) return !1
        if (e.includes(t)) return !0
        for (let n of i(t)) if (n && e.includes(n)) return !0
        for (let n of e.split(/\s+/).filter(Boolean)) if (i(n).includes(t)) return !0
        return !1
      }
      function a(e) {
        if (!e) return ''
        let t = String(e).toLowerCase().trim()
        return (t = (t = (t = (t = (t = (t = t.replace(/[\u064B-\u0652\u0670\u0640]/g, '')).replace(
          /[\u0622\u0623\u0625\u0671]/g,
          'ا',
        )).replace(/\u0629/g, 'ه')).replace(/\u0649/g, 'ي')).replace(
          /[\u0624\u0626\u0621]/g,
          'ء',
        )).replace(/[\u060C\u061B\u061F\u06D4\u200C\u200D]/g, '')).replace(/\s+/g, ' ')
      }
      n.d(t, {
        $e: () => g,
        Tq: () => h,
        isArabicQuery: () => l,
        mR: () => s,
        normalizeArabic: () => a,
        zG: () => r,
      })
      let o = {
        prayer: ['salah', 'salat', 'namaz', 'worship'],
        salah: ['prayer', 'salat', 'namaz', 'worship'],
        salat: ['prayer', 'salah', 'namaz', 'worship'],
        pilgrimage: ['hajj', 'haj'],
        hajj: ['pilgrimage', 'haj'],
        fasting: ['sawm', 'saum', 'fast'],
        sawm: ['fasting', 'saum', 'fast'],
        charity: ['zakat', 'zakah', 'alms'],
        zakat: ['charity', 'zakah', 'alms'],
        prophet: ['messenger', 'rasul', 'nabi'],
        messenger: ['prophet', 'rasul', 'nabi'],
        imam: ['leader', 'guide'],
        allah: ['god', 'almighty'],
        god: ['allah', 'almighty'],
        faith: ['iman', 'belief'],
        iman: ['faith', 'belief'],
        mosque: ['masjid'],
        masjid: ['mosque'],
        friday: ['jumma', "jumu'ah"],
        jumma: ['friday', "jumu'ah"],
        ramadan: ['ramadhan'],
        ramadhan: ['ramadan'],
      }
      function h(e, t) {
        let n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
          { caseInsensitive: l = !0, useSynonyms: i = !0, useStemming: r = !0 } = n,
          a = l ? e.toLowerCase() : e
        return t.every((e) => {
          let t = l ? e.toLowerCase() : e
          if (a.includes(t)) return !0
          if (i)
            for (let e of o[t.toLowerCase()] || []) {
              let t = l ? e.toLowerCase() : e
              if (a.includes(t)) return !0
            }
          if (r)
            for (let e of (function (e) {
              if (!e || e.length < 3) return [e]
              let t = new Set([e]),
                n = e.toLowerCase(),
                l = {
                  children: 'child',
                  men: 'man',
                  women: 'woman',
                  feet: 'foot',
                  teeth: 'tooth',
                  geese: 'goose',
                  mice: 'mouse',
                  people: 'person',
                }
              for (let { pattern: e, replacement: i, condition: r } of (l[n] && t.add(l[n]),
              [
                { pattern: /ies$/, replacement: 'y', condition: (e) => e.length > 4 },
                { pattern: /ves$/, replacement: 'f', condition: (e) => e.length > 4 },
                { pattern: /oes$/, replacement: 'o', condition: (e) => e.length > 4 },
                { pattern: /ses$/, replacement: 's', condition: (e) => e.length > 4 },
                {
                  pattern: /es$/,
                  replacement: '',
                  condition: (e) => e.length > 3 && /[sxz]es$|[^aeiou]es$/.test(e),
                },
                {
                  pattern: /s$/,
                  replacement: '',
                  condition: (e) => e.length > 3 && !/ss$/.test(e),
                },
                { pattern: /ied$/, replacement: 'y', condition: (e) => e.length > 4 },
                { pattern: /ed$/, replacement: '', condition: (e) => e.length > 3 },
                { pattern: /ing$/, replacement: '', condition: (e) => e.length > 4 },
                { pattern: /ier$/, replacement: 'y', condition: (e) => e.length > 4 },
                { pattern: /iest$/, replacement: 'y', condition: (e) => e.length > 5 },
                { pattern: /er$/, replacement: '', condition: (e) => e.length > 3 },
                { pattern: /est$/, replacement: '', condition: (e) => e.length > 4 },
                { pattern: /tion$/, replacement: 'te', condition: (e) => e.length > 5 },
                { pattern: /sion$/, replacement: 'de', condition: (e) => e.length > 5 },
                { pattern: /ness$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /ment$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /able$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /ible$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /ful$/, replacement: '', condition: (e) => e.length > 4 },
                { pattern: /less$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /ous$/, replacement: '', condition: (e) => e.length > 4 },
                { pattern: /ious$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /eous$/, replacement: '', condition: (e) => e.length > 5 },
                { pattern: /ive$/, replacement: '', condition: (e) => e.length > 4 },
                { pattern: /ative$/, replacement: '', condition: (e) => e.length > 6 },
                { pattern: /ly$/, replacement: '', condition: (e) => e.length > 3 },
              ]))
                if (e.test(n) && r(n)) {
                  let l = n.replace(e, i)
                  if (l.length >= 2 && (t.add(l), '' === i && l.length > 2)) {
                    let e = l[l.length - 1]
                    e === l[l.length - 2] &&
                      'bcdfghjklmnpqrstvwxz'.includes(e) &&
                      t.add(l.slice(0, -1))
                  }
                  break
                }
              return Array.from(t)
            })(t)) {
              let t = l ? e.toLowerCase() : e
              if (a.includes(t)) return !0
            }
          return !1
        })
      }
      function s(e, t) {
        let n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
          { caseInsensitive: l = !0 } = n,
          i = l ? e.toLowerCase() : e,
          r = l ? t.toLowerCase() : t,
          a = r.trim().split(/\s+/)
        return a.length <= 2
          ? h(i, a, { caseInsensitive: l, useSynonyms: !0, useStemming: !0 })
          : !!i.includes(r) || h(i, a, { caseInsensitive: l, useSynonyms: !0, useStemming: !1 })
      }
      function g(e, t) {
        if (!e || !(null == t ? void 0 : t.trim())) return [{ text: e, highlight: !1 }]
        let n = t.trim()
        return l(n)
          ? (function (e, t) {
              let n,
                l = a(t).split(/\s+/).filter(Boolean)
              if (0 === l.length) return [{ text: e, highlight: !1 }]
              let i = a(e),
                r = []
              {
                let t = 0,
                  n = 0,
                  l = e.length,
                  o = i.length
                for (; t < o && n < l; ) {
                  let l = i[t],
                    o = a(e[n])
                  if ('' === o) {
                    n++
                    continue
                  }
                  ;(o === l && ((r[t] = n), t++), n++)
                }
              }
              let o = l
                  .filter((e) => e.length >= 1)
                  .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
                h = [l.join('\\s*'), ...o],
                s = RegExp('('.concat(h.join('|'), ')'), 'gi'),
                g = []
              for (; null !== (n = s.exec(i)); ) {
                let t = n.index,
                  l = n.index + n[0].length - 1,
                  i = r[t],
                  o = r[l]
                if (null != i && null != o) {
                  for (; o + 1 < e.length && '' === a(e[o + 1]); ) o++
                  g.push([i, o + 1])
                }
              }
              if (0 === g.length) return [{ text: e, highlight: !1 }]
              g.sort((e, t) => e[0] - t[0])
              let u = [g[0]]
              for (let e = 1; e < g.length; e++) {
                let t = u[u.length - 1]
                g[e][0] <= t[1] ? (t[1] = Math.max(t[1], g[e][1])) : u.push(g[e])
              }
              let c = [],
                p = 0
              for (let [t, n] of u)
                (t > p && c.push({ text: e.slice(p, t), highlight: !1 }),
                  c.push({ text: e.slice(t, n), highlight: !0 }),
                  (p = n))
              return (p < e.length && c.push({ text: e.slice(p), highlight: !1 }), c)
            })(e, n)
          : (function (e, t) {
              let n = t
                .split(/\s+/)
                .filter(Boolean)
                .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              if (0 === n.length) return [{ text: e, highlight: !1 }]
              let l = [n.join('\\s+'), ...n.filter((e) => e.length >= 2)]
              return (function (e, t) {
                let n,
                  l = [],
                  i = 0
                for (; null !== (n = t.exec(e)); )
                  (n.index > i && l.push({ text: e.slice(i, n.index), highlight: !1 }),
                    l.push({ text: n[0], highlight: !0 }),
                    (i = t.lastIndex),
                    0 === n[0].length && t.lastIndex++)
                return (
                  i < e.length && l.push({ text: e.slice(i), highlight: !1 }),
                  l.length > 0 ? l : [{ text: e, highlight: !1 }]
                )
              })(e, RegExp('('.concat(l.join('|'), ')'), 'gi'))
            })(e, n)
      }
    },
  },
])
