'use strict'
;((exports.id = 818),
  (exports.ids = [818]),
  (exports.modules = {
    22544: (a, b, c) => {
      c.d(b, { E: () => h })
      var d = c(21124)
      c(38301)
      var e = c(26691),
        f = c(15514)
      let g = (0, e.F)(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
        {
          variants: {
            variant: {
              default: 'bg-accent/15 text-accent',
              secondary: 'bg-surface-2 text-foreground-muted',
              outline: 'border border-border text-foreground-muted',
              sahih: 'bg-emerald-500/15 text-emerald-400',
              hasan: 'bg-green-500/15 text-green-400',
              daif: 'bg-red-500/15 text-red-400',
              warning: 'bg-orange-500/15 text-orange-400',
              info: 'bg-blue-500/15 text-blue-400',
              purple: 'bg-purple-500/15 text-purple-400',
            },
          },
          defaultVariants: { variant: 'default' },
        },
      )
      function h({ className: a, variant: b, ...c }) {
        return (0, d.jsx)('div', { className: (0, f.cn)(g({ variant: b }), a), ...c })
      }
    },
    36818: (a, b, c) => {
      c.d(b, { A: () => F })
      var d = c(21124),
        e = c(38301),
        f = c(52963),
        g = c(69976),
        h = c(36164),
        i = c(21096),
        j = c(15514),
        k = c(22544),
        l = c(19217),
        m = c(8044),
        n = c(36736),
        o = c(88666)
      let p = o.bL,
        q = o.l9,
        r = e.forwardRef(({ className: a, sideOffset: b = 4, ...c }, e) =>
          (0, d.jsx)(o.ZL, {
            children: (0, d.jsx)(o.UC, {
              ref: e,
              sideOffset: b,
              className: (0, j.cn)(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-1 p-1 text-foreground shadow-md',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                a,
              ),
              ...c,
            }),
          }),
        )
      r.displayName = o.UC.displayName
      let s = e.forwardRef(({ className: a, inset: b, ...c }, e) =>
        (0, d.jsx)(o.q7, {
          ref: e,
          className: (0, j.cn)(
            'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
            b && 'pl-8',
            a,
          ),
          ...c,
        }),
      )
      ;((s.displayName = o.q7.displayName),
        (e.forwardRef(({ className: a, ...b }, c) =>
          (0, d.jsx)(o.wv, { ref: c, className: (0, j.cn)('-mx-1 my-1 h-px bg-border', a), ...b }),
        ).displayName = o.wv.displayName))
      var t = c(1780),
        u = c(88645),
        v = c(78583),
        w = c(10708),
        x = c(38442),
        y = c(3663),
        z = c(94104),
        A = c(80435),
        B = c(85351),
        C = c(59405)
      function D(a) {
        let b = a.bookId || '',
          c = (0, i.ei)(b)
        return c
          ? 'Al-Kafi' === c.bookId
            ? `/al-kafi/hadith/${a.id}`
            : `/${(0, i.yU)(c.bookId)}/hadith/${a.id}`
          : b.includes('Uyun') || a.book?.toLowerCase().includes('uyun')
            ? `/Uyun-akhbar-al-Rida/hadith/${a.id}`
            : b
              ? `/${(0, i.yU)(b)}/hadith/${a.id}`
              : `/al-kafi/hadith/${a.id}`
      }
      function E(a) {
        let b = a.toLowerCase()
        return b.includes('sahih') || b.includes('صحيح')
          ? 'sahih'
          : b.includes('hasan') || b.includes('حسن') || b.includes('good')
            ? 'hasan'
            : b.includes('daif') || b.includes('ضعيف') || b.includes('weak')
              ? 'daif'
              : 'secondary'
      }
      let F = (0, e.memo)(
        ({
          hadith: a,
          className: b,
          showViewChapter: c = !1,
          showNotesToggle: o = !1,
          notesVisible: F = !1,
          onToggleNotes: G,
          showArabicByDefault: H = !1,
          highlightQuery: I,
        }) => {
          let { settings: J } = (0, g.t)(),
            { addBookmark: K, removeBookmark: L, isBookmarked: M } = (0, h.T)(),
            [N, O] = (0, e.useState)(H),
            [P, Q] = (0, e.useState)(J.alwaysShowFullHadith),
            [R, S] = (0, e.useState)(!0),
            T = (0, e.useRef)(null),
            [U, V] = (0, e.useState)(!1),
            [W, X] = (0, e.useState)(null),
            Y = M(a.bookId, a.id)
          ;((0, e.useEffect)(() => {
            Q(J.alwaysShowFullHadith)
          }, [J.alwaysShowFullHadith]),
            (0, e.useEffect)(() => {
              O(H)
            }, [H]))
          let {
              englishText: Z,
              arabicText: $,
              isLongText: _,
            } = (0, e.useMemo)(() => {
              let b = a.englishText || a.thaqalaynMatn,
                c = a.arabicText,
                d = a.thaqalaynSanad,
                e =
                  d && b
                    ? (function (a, b) {
                        if (!a || !b) return a
                        let c = a.trim(),
                          d = b.trim()
                        if (c.startsWith(d))
                          return c
                            .slice(d.length)
                            .replace(/^[:\s;"']+/, '')
                            .trim()
                        let e = (a) =>
                          a
                            .replace(/[^\w\s]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .toLowerCase()
                            .trim()
                        if (e(c).startsWith(e(d))) {
                          let a = d.split(/\s+/),
                            b = 0,
                            e = 0
                          for (let d = 0; d < c.length && e < a.length; d++)
                            if (/\w/.test(c[d])) {
                              let a = d
                              for (; a < c.length && /\w/.test(c[a]); ) a++
                              ;(e++, (b = a), (d = a - 1))
                            }
                          if (e === a.length)
                            return c
                              .slice(b)
                              .replace(/^[:\s;"']+/, '')
                              .trim()
                        }
                        return c
                      })(b, d)
                    : b
              return { englishText: e, arabicText: c, isLongText: (e?.length || 0) > 750 }
            }, [a.englishText, a.thaqalaynMatn, a.arabicText, a.thaqalaynSanad]),
            aa = (0, e.useCallback)(
              (a, b) => {
                if (!a) return null
                let c = b ? a.slice(0, 750) + '...' : a
                if (!I?.trim()) return c
                let e = (0, f.$e)(c, I)
                return 1 !== e.length || e[0].highlight
                  ? e.map((a, b) =>
                      a.highlight
                        ? (0, d.jsx)(
                            'mark',
                            { className: 'rounded-sm bg-accent/25 text-inherit', children: a.text },
                            b,
                          )
                        : a.text,
                    )
                  : c
              },
              [I],
            )
          ;(0, e.useEffect)(() => {
            let a = T.current
            if (!a) return void V(!1)
            let b = () => {
              try {
                let b = a.cloneNode(!0)
                ;((b.style.cssText = `position:absolute;visibility:hidden;width:${a.offsetWidth}px;max-height:none;height:auto`),
                  document.body.appendChild(b))
                let c = b.scrollHeight > a.clientHeight + 2
                ;(document.body.removeChild(b), V(c))
              } catch {
                V(!1)
              }
            }
            return (
              b(),
              window.addEventListener('resize', b),
              () => window.removeEventListener('resize', b)
            )
          }, [$, J.arabicFontSize, R])
          let ab = (0, e.useMemo)(
              () => ({
                majlisi: a.gradingsFull?.find((a) =>
                  a.author.name_en.toLowerCase().includes('majlisi'),
                ),
                mohseni: a.gradingsFull?.find((a) =>
                  a.author.name_en.toLowerCase().includes('mohseni'),
                ),
                behbudi: a.gradingsFull?.find((a) =>
                  a.author.name_en.toLowerCase().includes('behbudi'),
                ),
              }),
              [a.gradingsFull],
            ),
            ac = (0, e.useCallback)((a) => {
              ;(X(a), setTimeout(() => X(null), 1500))
            }, []),
            ad = (0, e.useCallback)(async () => {
              let b = `${window.location.origin}/read${D(a)}`
              ;(await navigator.clipboard.writeText(b), ac('Link copied'))
            }, [a, ac]),
            ae = (0, e.useCallback)(async () => {
              let b = [a.book || 'Unknown Book']
              ;(a.volume && b.push(`Volume ${a.volume}`),
                b.push(a.chapter || 'Unknown Chapter'),
                b.push(`Hadith ${a.id}`),
                await navigator.clipboard.writeText(b.join(', ')),
                ac('Source copied'))
            }, [a, ac]),
            af = (0, e.useCallback)(async () => {
              let b = `${window.location.origin}/read${D(a)}`,
                c = [a.book || 'Unknown Book']
              ;(a.volume && c.push(`Volume ${a.volume}`),
                c.push(a.chapter || 'Unknown Chapter'),
                c.push(`Hadith ${a.id}`),
                await navigator.clipboard.writeText(`${c.join(', ')}
${b}`),
                ac('Copied'))
            }, [a, ac]),
            ag = (0, e.useCallback)(() => {
              window.open(`${window.location.origin}/read${D(a)}`, '_blank', 'noopener')
            }, [a]),
            ah = (0, e.useCallback)(() => {
              Y ? L(a.bookId, a.id) : K(a)
            }, [Y, a, K, L]),
            ai = (0, e.useMemo)(
              () =>
                (function (a) {
                  let b = a.bookId || '',
                    c = (0, i.ei)(b),
                    d = '/al-kafi',
                    e = !0
                  return (
                    c
                      ? 'Al-Kafi' === c.bookId
                        ? (d = '/al-kafi')
                        : ((d = `/${(0, i.yU)(c.bookId)}`), (e = !1))
                      : b.includes('Uyun') || a.book?.toLowerCase().includes('uyun')
                        ? ((d = '/Uyun-akhbar-al-Rida'), (e = !1))
                        : b && ((d = `/${(0, i.yU)(b)}`), (e = !1)),
                    e
                      ? `${d}/volume/${a.volume}/chapter/${a.categoryId}/${a.chapterInCategoryId}`
                      : `${d}/chapter/${a.categoryId}/${a.chapterInCategoryId}`
                  )
                })(a),
              [a],
            ),
            aj = (a, b) => {
              if (!a) return null
              let c = b
                ? ((a) => {
                    let b = E(a)
                    return 'sahih' === b
                      ? {
                          number: '1',
                          color: 'text-emerald-400',
                          note: 'Strong chain. Does not guarantee full authenticity. Further investigation required.',
                        }
                      : 'hasan' === b
                        ? {
                            number: '1',
                            color: 'text-emerald-400',
                            note: 'Good chain. May be authentic, but does not guarantee full authenticity. Further investigation required.',
                          }
                        : 'daif' === b
                          ? {
                              number: '2',
                              color: 'text-red-400',
                              note: 'Weak chain. Does not necessarily mean the hadith is inauthentic. Further investigation required.',
                            }
                          : {
                              number: '3',
                              color: 'text-foreground-muted',
                              note: "Chain requires further investigation. Does not determine the hadith's authenticity.",
                            }
                  })(b)
                : null
              return (0, d.jsxs)('div', {
                className: 'max-w-[200px] space-y-1.5 text-xs',
                children: [
                  (0, d.jsxs)('p', {
                    className: 'font-medium',
                    children: [
                      a.author.name_en,
                      a.author.death_date &&
                        (0, d.jsxs)('span', {
                          className: 'font-normal text-foreground-muted',
                          children: [' ', '(d. ', a.author.death_date, ')'],
                        }),
                    ],
                  }),
                  a.grade_en && (0, d.jsx)('p', { children: a.grade_en }),
                  a.grade_ar && (0, d.jsx)('p', { dir: 'rtl', children: a.grade_ar }),
                  a.reference_en &&
                    (0, d.jsx)('p', {
                      className: 'border-t border-border pt-1 text-foreground-muted',
                      children: a.reference_en,
                    }),
                  c &&
                    (0, d.jsx)('p', {
                      className:
                        'border-t border-border pt-1.5 italic leading-snug text-foreground-muted',
                      children: c.note,
                    }),
                ],
              })
            }
          return (0, d.jsxs)('article', {
            className: (0, j.cn)('rounded-lg border border-border bg-surface-1 p-4 sm:p-5', b),
            children: [
              (0, d.jsxs)('div', {
                className: 'mb-3 flex items-start justify-between gap-2',
                children: [
                  (0, d.jsx)('div', {
                    className: 'min-w-0 flex-1 space-y-1',
                    children: (0, d.jsxs)('div', {
                      className: 'flex flex-wrap items-center gap-1.5',
                      children: [
                        (0, d.jsxs)(k.E, {
                          variant: 'secondary',
                          className: 'text-[11px]',
                          children: [a.book, ' ', a.volume ? `\xb7 Vol. ${a.volume}` : ''],
                        }),
                        (0, d.jsxs)('span', {
                          className: 'text-xs tabular-nums text-foreground-faint',
                          children: ['#', a.id],
                        }),
                      ],
                    }),
                  }),
                  (0, d.jsxs)('div', {
                    className: 'flex shrink-0 items-center gap-1',
                    children: [
                      (0, d.jsxs)(n.m_, {
                        children: [
                          (0, d.jsx)(n.k$, {
                            asChild: !0,
                            children: (0, d.jsx)(l.$, {
                              variant: 'ghost',
                              size: 'icon',
                              className: (0, j.cn)('h-7 w-7', Y && 'text-bookmark'),
                              onClick: ah,
                              children: Y
                                ? (0, d.jsx)(t.A, { className: 'h-3.5 w-3.5' })
                                : (0, d.jsx)(u.A, { className: 'h-3.5 w-3.5' }),
                            }),
                          }),
                          (0, d.jsx)(n.ZI, { children: Y ? 'Remove bookmark' : 'Bookmark' }),
                        ],
                      }),
                      $ &&
                        (0, d.jsxs)(n.m_, {
                          children: [
                            (0, d.jsx)(n.k$, {
                              asChild: !0,
                              children: (0, d.jsx)(l.$, {
                                variant: N ? 'default' : 'ghost',
                                size: 'icon',
                                className: 'h-7 w-7 font-arabic text-xs',
                                onClick: () => O(!N),
                                children: 'ع',
                              }),
                            }),
                            (0, d.jsx)(n.ZI, { children: N ? 'Hide Arabic' : 'Show Arabic' }),
                          ],
                        }),
                      (0, d.jsxs)(n.m_, {
                        children: [
                          (0, d.jsx)(n.k$, {
                            asChild: !0,
                            children: (0, d.jsx)(l.$, {
                              variant: 'ghost',
                              size: 'icon',
                              className: 'h-7 w-7',
                              onClick: ag,
                              children: (0, d.jsx)(v.A, { className: 'h-3.5 w-3.5' }),
                            }),
                          }),
                          (0, d.jsx)(n.ZI, { children: 'Open in new tab' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, d.jsx)('div', {
                className: 'space-y-3',
                children:
                  N && $
                    ? (0, d.jsxs)('div', {
                        className: 'hadith-block bg-surface-2/50 rounded-md border border-border',
                        children: [
                          (0, d.jsx)('div', {
                            ref: T,
                            className: 'hadith-arabic-text text-right font-arabic text-foreground',
                            dir: 'rtl',
                            style: { fontSize: `${1.485 * J.arabicFontSize}%` },
                            children: U && !R ? aa($, !0) : aa($),
                          }),
                          U &&
                            (0, d.jsx)('button', {
                              onClick: () => S(!R),
                              className:
                                'mt-1 text-xs font-medium text-accent transition-colors hover:underline',
                              children: R ? 'اعرض أقل' : 'اقرأ المزيد',
                            }),
                        ],
                      })
                    : (0, d.jsxs)('div', {
                        children: [
                          a.thaqalaynSanad &&
                            (0, d.jsx)('p', {
                              className:
                                'hadith-english-text mb-2 line-clamp-3 font-mono text-xs text-foreground-faint sm:line-clamp-none sm:text-sm',
                              style: { fontSize: `${J.englishFontSize}%` },
                              children: a.thaqalaynSanad.trim(),
                            }),
                          (0, d.jsxs)('div', {
                            className:
                              'hadith-english-text text-sm leading-relaxed text-foreground sm:text-base',
                            style: { fontSize: `${J.englishFontSize}%` },
                            children: [
                              _ && !P ? aa(Z, !0) : aa(Z),
                              _ &&
                                (0, d.jsx)('button', {
                                  onClick: () => Q(!P),
                                  className:
                                    'ml-1 text-xs font-medium text-accent transition-colors hover:underline',
                                  children: P ? 'Show less' : 'Read more',
                                }),
                            ],
                          }),
                        ],
                      }),
              }),
              (a.majlisiGrading || a.mohseniGrading || a.behbudiGrading) &&
                (0, d.jsxs)(d.Fragment, {
                  children: [
                    (0, d.jsx)(m.w, { className: 'my-3' }),
                    (0, d.jsxs)('div', {
                      className: 'flex flex-wrap items-center gap-1.5',
                      children: [
                        a.majlisiGrading &&
                          (0, d.jsxs)(n.m_, {
                            children: [
                              (0, d.jsx)(n.k$, {
                                asChild: !0,
                                children: (0, d.jsx)('span', {
                                  children: (0, d.jsxs)(k.E, {
                                    variant: E(a.majlisiGrading),
                                    className: 'cursor-default text-[11px]',
                                    children: ['Majlisi: ', a.majlisiGrading],
                                  }),
                                }),
                              }),
                              (0, d.jsx)(n.ZI, {
                                side: 'bottom',
                                children: aj(ab.majlisi, a.majlisiGrading) || 'Majlisi grading',
                              }),
                            ],
                          }),
                        a.mohseniGrading &&
                          (0, d.jsxs)(n.m_, {
                            children: [
                              (0, d.jsx)(n.k$, {
                                asChild: !0,
                                children: (0, d.jsx)('span', {
                                  children: (0, d.jsxs)(k.E, {
                                    variant: E(a.mohseniGrading),
                                    className: 'cursor-default text-[11px]',
                                    children: ['Mohseni: ', a.mohseniGrading],
                                  }),
                                }),
                              }),
                              (0, d.jsx)(n.ZI, {
                                side: 'bottom',
                                children: aj(ab.mohseni, a.mohseniGrading) || 'Mohseni grading',
                              }),
                            ],
                          }),
                        a.behbudiGrading &&
                          (0, d.jsxs)(n.m_, {
                            children: [
                              (0, d.jsx)(n.k$, {
                                asChild: !0,
                                children: (0, d.jsx)('span', {
                                  children: (0, d.jsxs)(k.E, {
                                    variant: E(a.behbudiGrading),
                                    className: 'cursor-default text-[11px]',
                                    children: ['Behbudi: ', a.behbudiGrading],
                                  }),
                                }),
                              }),
                              (0, d.jsx)(n.ZI, {
                                side: 'bottom',
                                children: aj(ab.behbudi, a.behbudiGrading) || 'Behbudi grading',
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              (0, d.jsx)(m.w, { className: 'my-3' }),
              (0, d.jsxs)('div', {
                className: 'flex items-center justify-between gap-2',
                children: [
                  (0, d.jsxs)('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      (0, d.jsxs)(p, {
                        children: [
                          (0, d.jsx)(q, {
                            asChild: !0,
                            children: (0, d.jsxs)(l.$, {
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-7 gap-1 px-2 text-xs text-foreground-muted',
                              children: [(0, d.jsx)(w.A, { className: 'h-3 w-3' }), W || 'Copy'],
                            }),
                          }),
                          (0, d.jsxs)(r, {
                            align: 'start',
                            children: [
                              (0, d.jsxs)(s, {
                                onClick: ad,
                                children: [
                                  (0, d.jsx)(x.A, { className: 'mr-2 h-3.5 w-3.5' }),
                                  'Copy link',
                                ],
                              }),
                              (0, d.jsxs)(s, {
                                onClick: ae,
                                children: [
                                  (0, d.jsx)(y.A, { className: 'mr-2 h-3.5 w-3.5' }),
                                  'Copy source',
                                ],
                              }),
                              (0, d.jsxs)(s, {
                                onClick: af,
                                children: [
                                  (0, d.jsx)(z.A, { className: 'mr-2 h-3.5 w-3.5' }),
                                  'Copy both',
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      o &&
                        G &&
                        (0, d.jsxs)(l.$, {
                          variant: 'ghost',
                          size: 'sm',
                          className: (0, j.cn)(
                            'h-7 gap-1 px-2 text-xs',
                            F ? 'text-accent' : 'text-foreground-muted',
                          ),
                          onClick: G,
                          children: [
                            (0, d.jsx)(A.A, { className: 'h-3 w-3' }),
                            'Notes',
                            (0, d.jsx)(B.A, {
                              className: (0, j.cn)(
                                'h-3 w-3 transition-transform',
                                F && 'rotate-180',
                              ),
                            }),
                          ],
                        }),
                    ],
                  }),
                  c &&
                    a.volume &&
                    a.categoryId &&
                    null != a.chapterInCategoryId &&
                    (0, d.jsxs)('a', {
                      href: ai,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      className:
                        'flex items-center gap-0.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground',
                      children: ['View Chapter', (0, d.jsx)(C.A, { className: 'h-3 w-3' })],
                    }),
                ],
              }),
            ],
          })
        },
      )
    },
  }))
