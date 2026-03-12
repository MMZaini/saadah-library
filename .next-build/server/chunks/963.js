'use strict'
;((exports.id = 963),
  (exports.ids = [963]),
  (exports.modules = {
    52963: (a, b, c) => {
      function d(a) {
        if (!a || 'string' != typeof a) return !1
        let b = a.trim()
        if (0 === b.length) return !1
        let c = (b.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length,
          d = b.replace(/\s/g, '').length
        return d > 0 && c / d > 0.3
      }
      function e(a) {
        if (
          !a ||
          !(a && 'string' == typeof a && /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(a))
        )
          return [a]
        let b = new Set()
        for (let c of (b.add(a),
        a.startsWith('ال') && a.length > 2 ? b.add(a.slice(2)) : a.length > 0 && b.add('ال' + a),
        ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ك', 'ل']))
          if (a.startsWith(c) && a.length > c.length + 1) {
            let d = a.slice(c.length)
            ;(b.add(d), d.startsWith('ال') || b.add('ال' + d))
          }
        for (let c of [
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
          a.endsWith(c) && a.length > c.length + 1 && b.add(a.slice(0, -c.length))
        if (a.length >= 3) {
          ;(a.startsWith('م') && a.length > 3 && b.add(a.slice(1)),
            a.startsWith('ا') && a.length > 3 && b.add(a.slice(1)),
            a.startsWith('ت') && a.length > 3 && b.add(a.slice(1)),
            a.startsWith('است') && a.length > 5 && b.add(a.slice(3)))
          let c = a.replace(/[اوي]/g, '')
          if (c.length >= 3) {
            let a = c.slice(0, 3)
            b.add(a)
            let [d, e, f] = a.split('')
            d &&
              e &&
              f &&
              (b.add(d + 'ا' + e + f),
              b.add('م' + d + e + 'ول'),
              b.add(d + e + 'ي' + f),
              b.add(d + e + 'ال'),
              b.add(d + e + 'ول'))
          }
        }
        return Array.from(b).filter((a) => a && a.length >= 2)
      }
      function f(a, b) {
        if (!a || !b) return !1
        if (a.includes(b)) return !0
        for (let c of e(b)) if (c && a.includes(c)) return !0
        for (let c of a.split(/\s+/).filter(Boolean)) if (e(c).includes(b)) return !0
        return !1
      }
      function g(a) {
        if (!a) return ''
        let b = String(a).toLowerCase().trim()
        return (b = (b = (b = (b = (b = (b = b.replace(/[\u064B-\u0652\u0670\u0640]/g, '')).replace(
          /[\u0622\u0623\u0625\u0671]/g,
          'ا',
        )).replace(/\u0629/g, 'ه')).replace(/\u0649/g, 'ي')).replace(
          /[\u0624\u0626\u0621]/g,
          'ء',
        )).replace(/[\u060C\u061B\u061F\u06D4\u200C\u200D]/g, '')).replace(/\s+/g, ' ')
      }
      c.d(b, {
        $e: () => k,
        Tq: () => i,
        isArabicQuery: () => d,
        mR: () => j,
        normalizeArabic: () => g,
        zG: () => f,
      })
      let h = {
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
      function i(a, b, c = {}) {
        let { caseInsensitive: d = !0, useSynonyms: e = !0, useStemming: f = !0 } = c,
          g = d ? a.toLowerCase() : a
        return b.every((a) => {
          let b = d ? a.toLowerCase() : a
          if (g.includes(b)) return !0
          if (e)
            for (let a of h[b.toLowerCase()] || []) {
              let b = d ? a.toLowerCase() : a
              if (g.includes(b)) return !0
            }
          if (f)
            for (let a of (function (a) {
              if (!a || a.length < 3) return [a]
              let b = new Set([a]),
                c = a.toLowerCase(),
                d = {
                  children: 'child',
                  men: 'man',
                  women: 'woman',
                  feet: 'foot',
                  teeth: 'tooth',
                  geese: 'goose',
                  mice: 'mouse',
                  people: 'person',
                }
              for (let { pattern: a, replacement: e, condition: f } of (d[c] && b.add(d[c]),
              [
                { pattern: /ies$/, replacement: 'y', condition: (a) => a.length > 4 },
                { pattern: /ves$/, replacement: 'f', condition: (a) => a.length > 4 },
                { pattern: /oes$/, replacement: 'o', condition: (a) => a.length > 4 },
                { pattern: /ses$/, replacement: 's', condition: (a) => a.length > 4 },
                {
                  pattern: /es$/,
                  replacement: '',
                  condition: (a) => a.length > 3 && /[sxz]es$|[^aeiou]es$/.test(a),
                },
                {
                  pattern: /s$/,
                  replacement: '',
                  condition: (a) => a.length > 3 && !/ss$/.test(a),
                },
                { pattern: /ied$/, replacement: 'y', condition: (a) => a.length > 4 },
                { pattern: /ed$/, replacement: '', condition: (a) => a.length > 3 },
                { pattern: /ing$/, replacement: '', condition: (a) => a.length > 4 },
                { pattern: /ier$/, replacement: 'y', condition: (a) => a.length > 4 },
                { pattern: /iest$/, replacement: 'y', condition: (a) => a.length > 5 },
                { pattern: /er$/, replacement: '', condition: (a) => a.length > 3 },
                { pattern: /est$/, replacement: '', condition: (a) => a.length > 4 },
                { pattern: /tion$/, replacement: 'te', condition: (a) => a.length > 5 },
                { pattern: /sion$/, replacement: 'de', condition: (a) => a.length > 5 },
                { pattern: /ness$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /ment$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /able$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /ible$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /ful$/, replacement: '', condition: (a) => a.length > 4 },
                { pattern: /less$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /ous$/, replacement: '', condition: (a) => a.length > 4 },
                { pattern: /ious$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /eous$/, replacement: '', condition: (a) => a.length > 5 },
                { pattern: /ive$/, replacement: '', condition: (a) => a.length > 4 },
                { pattern: /ative$/, replacement: '', condition: (a) => a.length > 6 },
                { pattern: /ly$/, replacement: '', condition: (a) => a.length > 3 },
              ]))
                if (a.test(c) && f(c)) {
                  let d = c.replace(a, e)
                  if (d.length >= 2 && (b.add(d), '' === e && d.length > 2)) {
                    let a = d[d.length - 1]
                    a === d[d.length - 2] &&
                      'bcdfghjklmnpqrstvwxz'.includes(a) &&
                      b.add(d.slice(0, -1))
                  }
                  break
                }
              return Array.from(b)
            })(b)) {
              let b = d ? a.toLowerCase() : a
              if (g.includes(b)) return !0
            }
          return !1
        })
      }
      function j(a, b, c = {}) {
        let { caseInsensitive: d = !0 } = c,
          e = d ? a.toLowerCase() : a,
          f = d ? b.toLowerCase() : b,
          g = f.trim().split(/\s+/)
        return g.length <= 2
          ? i(e, g, { caseInsensitive: d, useSynonyms: !0, useStemming: !0 })
          : !!e.includes(f) || i(e, g, { caseInsensitive: d, useSynonyms: !0, useStemming: !1 })
      }
      function k(a, b) {
        if (!a || !b?.trim()) return [{ text: a, highlight: !1 }]
        let c = b.trim()
        return d(c)
          ? (function (a, b) {
              let c,
                d = g(b).split(/\s+/).filter(Boolean)
              if (0 === d.length) return [{ text: a, highlight: !1 }]
              let e = g(a),
                f = []
              {
                let b = 0,
                  c = 0,
                  d = a.length,
                  h = e.length
                for (; b < h && c < d; ) {
                  let d = e[b],
                    h = g(a[c])
                  if ('' === h) {
                    c++
                    continue
                  }
                  ;(h === d && ((f[b] = c), b++), c++)
                }
              }
              let h = d
                  .filter((a) => a.length >= 1)
                  .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
                i = [d.join('\\s*'), ...h],
                j = RegExp(`(${i.join('|')})`, 'gi'),
                k = []
              for (; null !== (c = j.exec(e)); ) {
                let b = c.index,
                  d = c.index + c[0].length - 1,
                  e = f[b],
                  h = f[d]
                if (null != e && null != h) {
                  for (; h + 1 < a.length && '' === g(a[h + 1]); ) h++
                  k.push([e, h + 1])
                }
              }
              if (0 === k.length) return [{ text: a, highlight: !1 }]
              k.sort((a, b) => a[0] - b[0])
              let l = [k[0]]
              for (let a = 1; a < k.length; a++) {
                let b = l[l.length - 1]
                k[a][0] <= b[1] ? (b[1] = Math.max(b[1], k[a][1])) : l.push(k[a])
              }
              let m = [],
                n = 0
              for (let [b, c] of l)
                (b > n && m.push({ text: a.slice(n, b), highlight: !1 }),
                  m.push({ text: a.slice(b, c), highlight: !0 }),
                  (n = c))
              return (n < a.length && m.push({ text: a.slice(n), highlight: !1 }), m)
            })(a, c)
          : (function (a, b) {
              let c = b
                .split(/\s+/)
                .filter(Boolean)
                .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              if (0 === c.length) return [{ text: a, highlight: !1 }]
              let d = [c.join('\\s+'), ...c.filter((a) => a.length >= 2)]
              return (function (a, b) {
                let c,
                  d = [],
                  e = 0
                for (; null !== (c = b.exec(a)); )
                  (c.index > e && d.push({ text: a.slice(e, c.index), highlight: !1 }),
                    d.push({ text: c[0], highlight: !0 }),
                    (e = b.lastIndex),
                    0 === c[0].length && b.lastIndex++)
                return (
                  e < a.length && d.push({ text: a.slice(e), highlight: !1 }),
                  d.length > 0 ? d : [{ text: a, highlight: !1 }]
                )
              })(a, RegExp(`(${d.join('|')})`, 'gi'))
            })(a, c)
      }
    },
  }))
