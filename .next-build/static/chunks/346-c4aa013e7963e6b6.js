'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [346],
  {
    1047: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('sticky-note', [
        [
          'path',
          {
            d: 'M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z',
            key: '1dfntj',
          },
        ],
        ['path', { d: 'M15 3v5a1 1 0 0 0 1 1h5', key: '6s6qgf' }],
      ])
    },
    4033: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('chevron-down', [['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }]])
    },
    4788: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('link-2', [
        ['path', { d: 'M9 17H7A5 5 0 0 1 7 7h2', key: '8i5ue5' }],
        ['path', { d: 'M15 7h2a5 5 0 1 1 0 10h-2', key: '1b9ql8' }],
        ['line', { x1: '8', x2: '16', y1: '12', y2: '12', key: '1jonct' }],
      ])
    },
    5299: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('loader-circle', [
        ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56', key: '13zald' }],
      ])
    },
    5426: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('copy', [
        ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2', key: '17jyea' }],
        ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2', key: 'zix9uf' }],
      ])
    },
    5880: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('external-link', [
        ['path', { d: 'M15 3h6v6', key: '1q9fwt' }],
        ['path', { d: 'M10 14 21 3', key: 'gplh6r' }],
        ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', key: 'a6xqqp' }],
      ])
    },
    6060: (e, t, r) => {
      r.d(t, { UC: () => td, q7: () => tc, ZL: () => ts, bL: () => ta, wv: () => tf, l9: () => tu })
      var n,
        o = r(2115),
        l = r(2556),
        i = r(4446),
        a = r(3468),
        u = r(3558),
        s = r(8142)
      function d(e, t, r) {
        if (!t.has(e)) throw TypeError('attempted to ' + r + ' private field on non-instance')
        return t.get(e)
      }
      function c(e, t) {
        var r = d(e, t, 'get')
        return r.get ? r.get.call(e) : r.value
      }
      function f(e, t, r) {
        var n = d(e, t, 'set')
        if (n.set) n.set.call(e, r)
        else {
          if (!n.writable) throw TypeError('attempted to set read only private field')
          n.value = r
        }
        return r
      }
      var p = r(5155)
      function h(e) {
        let t = (function (e) {
            let t = o.forwardRef((e, t) => {
              let { children: r, ...n } = e
              if (o.isValidElement(r)) {
                var l
                let e,
                  a,
                  u =
                    ((l = r),
                    (a =
                      (e = Object.getOwnPropertyDescriptor(l.props, 'ref')?.get) &&
                      'isReactWarning' in e &&
                      e.isReactWarning)
                      ? l.ref
                      : (a =
                            (e = Object.getOwnPropertyDescriptor(l, 'ref')?.get) &&
                            'isReactWarning' in e &&
                            e.isReactWarning)
                        ? l.props.ref
                        : l.props.ref || l.ref),
                  s = (function (e, t) {
                    let r = { ...t }
                    for (let n in t) {
                      let o = e[n],
                        l = t[n]
                      ;/^on[A-Z]/.test(n)
                        ? o && l
                          ? (r[n] = (...e) => {
                              let t = l(...e)
                              return (o(...e), t)
                            })
                          : o && (r[n] = o)
                        : 'style' === n
                          ? (r[n] = { ...o, ...l })
                          : 'className' === n && (r[n] = [o, l].filter(Boolean).join(' '))
                    }
                    return { ...e, ...r }
                  })(n, r.props)
                return (
                  r.type !== o.Fragment && (s.ref = t ? (0, i.t)(t, u) : u),
                  o.cloneElement(r, s)
                )
              }
              return o.Children.count(r) > 1 ? o.Children.only(null) : null
            })
            return ((t.displayName = `${e}.SlotClone`), t)
          })(e),
          r = o.forwardRef((e, r) => {
            let { children: n, ...l } = e,
              i = o.Children.toArray(n),
              a = i.find(v)
            if (a) {
              let e = a.props.children,
                n = i.map((t) =>
                  t !== a
                    ? t
                    : o.Children.count(e) > 1
                      ? o.Children.only(null)
                      : o.isValidElement(e)
                        ? e.props.children
                        : null,
                )
              return (0, p.jsx)(t, {
                ...l,
                ref: r,
                children: o.isValidElement(e) ? o.cloneElement(e, void 0, n) : null,
              })
            }
            return (0, p.jsx)(t, { ...l, ref: r, children: n })
          })
        return ((r.displayName = `${e}.Slot`), r)
      }
      var m = Symbol('radix.slottable')
      function v(e) {
        return (
          o.isValidElement(e) &&
          'function' == typeof e.type &&
          '__radixId' in e.type &&
          e.type.__radixId === m
        )
      }
      function y(e) {
        let t = e + 'CollectionProvider',
          [r, n] = (0, a.A)(t),
          [l, u] = r(t, { collectionRef: { current: null }, itemMap: new Map() }),
          s = (e) => {
            let { scope: t, children: r } = e,
              n = o.useRef(null),
              i = o.useRef(new Map()).current
            return (0, p.jsx)(l, { scope: t, itemMap: i, collectionRef: n, children: r })
          }
        s.displayName = t
        let d = e + 'CollectionSlot',
          c = h(d),
          f = o.forwardRef((e, t) => {
            let { scope: r, children: n } = e,
              o = u(d, r),
              l = (0, i.s)(t, o.collectionRef)
            return (0, p.jsx)(c, { ref: l, children: n })
          })
        f.displayName = d
        let m = e + 'CollectionItemSlot',
          v = 'data-radix-collection-item',
          y = h(m),
          g = o.forwardRef((e, t) => {
            let { scope: r, children: n, ...l } = e,
              a = o.useRef(null),
              s = (0, i.s)(t, a),
              d = u(m, r)
            return (
              o.useEffect(
                () => (d.itemMap.set(a, { ref: a, ...l }), () => void d.itemMap.delete(a)),
              ),
              (0, p.jsx)(y, { ...{ [v]: '' }, ref: s, children: n })
            )
          })
        return (
          (g.displayName = m),
          [
            { Provider: s, Slot: f, ItemSlot: g },
            function (t) {
              let r = u(e + 'CollectionConsumer', t)
              return o.useCallback(() => {
                let e = r.collectionRef.current
                if (!e) return []
                let t = Array.from(e.querySelectorAll('['.concat(v, ']')))
                return Array.from(r.itemMap.values()).sort(
                  (e, r) => t.indexOf(e.ref.current) - t.indexOf(r.ref.current),
                )
              }, [r.collectionRef, r.itemMap])
            },
            n,
          ]
        )
      }
      var g = new WeakMap()
      function w(e, t) {
        if ('at' in Array.prototype) return Array.prototype.at.call(e, t)
        let r = (function (e, t) {
          let r = e.length,
            n = x(t),
            o = n >= 0 ? n : r + n
          return o < 0 || o >= r ? -1 : o
        })(e, t)
        return -1 === r ? void 0 : e[r]
      }
      function x(e) {
        return e != e || 0 === e ? 0 : Math.trunc(e)
      }
      ;((n = new WeakMap()),
        class e extends Map {
          set(e, t) {
            return (
              g.get(this) &&
                (this.has(e) ? (c(this, n)[c(this, n).indexOf(e)] = e) : c(this, n).push(e)),
              super.set(e, t),
              this
            )
          }
          insert(e, t, r) {
            let o,
              l = this.has(t),
              i = c(this, n).length,
              a = x(e),
              u = a >= 0 ? a : i + a,
              s = u < 0 || u >= i ? -1 : u
            if (s === this.size || (l && s === this.size - 1) || -1 === s)
              return (this.set(t, r), this)
            let d = this.size + +!l
            a < 0 && u++
            let f = [...c(this, n)],
              p = !1
            for (let e = u; e < d; e++)
              if (u === e) {
                let n = f[e]
                ;(f[e] === t && (n = f[e + 1]),
                  l && this.delete(t),
                  (o = this.get(n)),
                  this.set(t, r))
              } else {
                p || f[e - 1] !== t || (p = !0)
                let r = f[p ? e : e - 1],
                  n = o
                ;((o = this.get(r)), this.delete(r), this.set(r, n))
              }
            return this
          }
          with(t, r, n) {
            let o = new e(this)
            return (o.insert(t, r, n), o)
          }
          before(e) {
            let t = c(this, n).indexOf(e) - 1
            if (!(t < 0)) return this.entryAt(t)
          }
          setBefore(e, t, r) {
            let o = c(this, n).indexOf(e)
            return -1 === o ? this : this.insert(o, t, r)
          }
          after(e) {
            let t = c(this, n).indexOf(e)
            if (-1 !== (t = -1 === t || t === this.size - 1 ? -1 : t + 1)) return this.entryAt(t)
          }
          setAfter(e, t, r) {
            let o = c(this, n).indexOf(e)
            return -1 === o ? this : this.insert(o + 1, t, r)
          }
          first() {
            return this.entryAt(0)
          }
          last() {
            return this.entryAt(-1)
          }
          clear() {
            return (f(this, n, []), super.clear())
          }
          delete(e) {
            let t = super.delete(e)
            return (t && c(this, n).splice(c(this, n).indexOf(e), 1), t)
          }
          deleteAt(e) {
            let t = this.keyAt(e)
            return void 0 !== t && this.delete(t)
          }
          at(e) {
            let t = w(c(this, n), e)
            if (void 0 !== t) return this.get(t)
          }
          entryAt(e) {
            let t = w(c(this, n), e)
            if (void 0 !== t) return [t, this.get(t)]
          }
          indexOf(e) {
            return c(this, n).indexOf(e)
          }
          keyAt(e) {
            return w(c(this, n), e)
          }
          from(e, t) {
            let r = this.indexOf(e)
            if (-1 === r) return
            let n = r + t
            return (n < 0 && (n = 0), n >= this.size && (n = this.size - 1), this.at(n))
          }
          keyFrom(e, t) {
            let r = this.indexOf(e)
            if (-1 === r) return
            let n = r + t
            return (n < 0 && (n = 0), n >= this.size && (n = this.size - 1), this.keyAt(n))
          }
          find(e, t) {
            let r = 0
            for (let n of this) {
              if (Reflect.apply(e, t, [n, r, this])) return n
              r++
            }
          }
          findIndex(e, t) {
            let r = 0
            for (let n of this) {
              if (Reflect.apply(e, t, [n, r, this])) return r
              r++
            }
            return -1
          }
          filter(t, r) {
            let n = [],
              o = 0
            for (let e of this) (Reflect.apply(t, r, [e, o, this]) && n.push(e), o++)
            return new e(n)
          }
          map(t, r) {
            let n = [],
              o = 0
            for (let e of this) (n.push([e[0], Reflect.apply(t, r, [e, o, this])]), o++)
            return new e(n)
          }
          reduce() {
            for (var e = arguments.length, t = Array(e), r = 0; r < e; r++) t[r] = arguments[r]
            let [n, o] = t,
              l = 0,
              i = null != o ? o : this.at(0)
            for (let e of this)
              ((i = 0 === l && 1 === t.length ? e : Reflect.apply(n, this, [i, e, l, this])), l++)
            return i
          }
          reduceRight() {
            for (var e = arguments.length, t = Array(e), r = 0; r < e; r++) t[r] = arguments[r]
            let [n, o] = t,
              l = null != o ? o : this.at(-1)
            for (let e = this.size - 1; e >= 0; e--) {
              let r = this.at(e)
              l =
                e === this.size - 1 && 1 === t.length ? r : Reflect.apply(n, this, [l, r, e, this])
            }
            return l
          }
          toSorted(t) {
            return new e([...this.entries()].sort(t))
          }
          toReversed() {
            let t = new e()
            for (let e = this.size - 1; e >= 0; e--) {
              let r = this.keyAt(e),
                n = this.get(r)
              t.set(r, n)
            }
            return t
          }
          toSpliced() {
            for (var t = arguments.length, r = Array(t), n = 0; n < t; n++) r[n] = arguments[n]
            let o = [...this.entries()]
            return (o.splice(...r), new e(o))
          }
          slice(t, r) {
            let n = new e(),
              o = this.size - 1
            if (void 0 === t) return n
            ;(t < 0 && (t += this.size), void 0 !== r && r > 0 && (o = r - 1))
            for (let e = t; e <= o; e++) {
              let t = this.keyAt(e),
                r = this.get(t)
              n.set(t, r)
            }
            return n
          }
          every(e, t) {
            let r = 0
            for (let n of this) {
              if (!Reflect.apply(e, t, [n, r, this])) return !1
              r++
            }
            return !0
          }
          some(e, t) {
            let r = 0
            for (let n of this) {
              if (Reflect.apply(e, t, [n, r, this])) return !0
              r++
            }
            return !1
          }
          constructor(e) {
            ;(super(e),
              (function (e, t, r) {
                if (t.has(e))
                  throw TypeError('Cannot initialize the same private elements twice on an object')
                t.set(e, r)
              })(this, n, { writable: !0, value: void 0 }),
              f(this, n, [...super.keys()]),
              g.set(this, !0))
          }
        })
      var R = o.createContext(void 0)
      function M(e) {
        let t = o.useContext(R)
        return e || t || 'ltr'
      }
      var b = r(4831),
        C = r(9526),
        k = r(9666),
        j = r(8946),
        A = r(6093),
        D = r(5433),
        _ = r(6842),
        E = r(222),
        K = 'rovingFocusGroup.onEntryFocus',
        I = { bubbles: !1, cancelable: !0 },
        O = 'RovingFocusGroup',
        [P, S, T] = y(O),
        [N, F] = (0, a.A)(O, [T]),
        [L, z] = N(O),
        G = o.forwardRef((e, t) =>
          (0, p.jsx)(P.Provider, {
            scope: e.__scopeRovingFocusGroup,
            children: (0, p.jsx)(P.Slot, {
              scope: e.__scopeRovingFocusGroup,
              children: (0, p.jsx)(V, { ...e, ref: t }),
            }),
          }),
        )
      G.displayName = O
      var V = o.forwardRef((e, t) => {
          let {
              __scopeRovingFocusGroup: r,
              orientation: n,
              loop: a = !1,
              dir: d,
              currentTabStopId: c,
              defaultCurrentTabStopId: f,
              onCurrentTabStopIdChange: h,
              onEntryFocus: m,
              preventScrollOnEntryFocus: v = !1,
              ...y
            } = e,
            g = o.useRef(null),
            w = (0, i.s)(t, g),
            x = M(d),
            [R, b] = (0, u.i)({
              prop: c,
              defaultProp: null != f ? f : null,
              onChange: h,
              caller: O,
            }),
            [C, k] = o.useState(!1),
            j = (0, E.c)(m),
            A = S(r),
            D = o.useRef(!1),
            [_, P] = o.useState(0)
          return (
            o.useEffect(() => {
              let e = g.current
              if (e) return (e.addEventListener(K, j), () => e.removeEventListener(K, j))
            }, [j]),
            (0, p.jsx)(L, {
              scope: r,
              orientation: n,
              dir: x,
              loop: a,
              currentTabStopId: R,
              onItemFocus: o.useCallback((e) => b(e), [b]),
              onItemShiftTab: o.useCallback(() => k(!0), []),
              onFocusableItemAdd: o.useCallback(() => P((e) => e + 1), []),
              onFocusableItemRemove: o.useCallback(() => P((e) => e - 1), []),
              children: (0, p.jsx)(s.sG.div, {
                tabIndex: C || 0 === _ ? -1 : 0,
                'data-orientation': n,
                ...y,
                ref: w,
                style: { outline: 'none', ...e.style },
                onMouseDown: (0, l.mK)(e.onMouseDown, () => {
                  D.current = !0
                }),
                onFocus: (0, l.mK)(e.onFocus, (e) => {
                  let t = !D.current
                  if (e.target === e.currentTarget && t && !C) {
                    let t = new CustomEvent(K, I)
                    if ((e.currentTarget.dispatchEvent(t), !t.defaultPrevented)) {
                      let e = A().filter((e) => e.focusable)
                      q(
                        [e.find((e) => e.active), e.find((e) => e.id === R), ...e]
                          .filter(Boolean)
                          .map((e) => e.ref.current),
                        v,
                      )
                    }
                  }
                  D.current = !1
                }),
                onBlur: (0, l.mK)(e.onBlur, () => k(!1)),
              }),
            })
          )
        }),
        B = 'RovingFocusGroupItem',
        U = o.forwardRef((e, t) => {
          let {
              __scopeRovingFocusGroup: r,
              focusable: n = !0,
              active: i = !1,
              tabStopId: a,
              children: u,
              ...d
            } = e,
            c = (0, j.B)(),
            f = a || c,
            h = z(B, r),
            m = h.currentTabStopId === f,
            v = S(r),
            { onFocusableItemAdd: y, onFocusableItemRemove: g, currentTabStopId: w } = h
          return (
            o.useEffect(() => {
              if (n) return (y(), () => g())
            }, [n, y, g]),
            (0, p.jsx)(P.ItemSlot, {
              scope: r,
              id: f,
              focusable: n,
              active: i,
              children: (0, p.jsx)(s.sG.span, {
                tabIndex: m ? 0 : -1,
                'data-orientation': h.orientation,
                ...d,
                ref: t,
                onMouseDown: (0, l.mK)(e.onMouseDown, (e) => {
                  n ? h.onItemFocus(f) : e.preventDefault()
                }),
                onFocus: (0, l.mK)(e.onFocus, () => h.onItemFocus(f)),
                onKeyDown: (0, l.mK)(e.onKeyDown, (e) => {
                  if ('Tab' === e.key && e.shiftKey) return void h.onItemShiftTab()
                  if (e.target !== e.currentTarget) return
                  let t = (function (e, t, r) {
                    var n
                    let o =
                      ((n = e.key),
                      'rtl' !== r
                        ? n
                        : 'ArrowLeft' === n
                          ? 'ArrowRight'
                          : 'ArrowRight' === n
                            ? 'ArrowLeft'
                            : n)
                    if (
                      !('vertical' === t && ['ArrowLeft', 'ArrowRight'].includes(o)) &&
                      !('horizontal' === t && ['ArrowUp', 'ArrowDown'].includes(o))
                    )
                      return W[o]
                  })(e, h.orientation, h.dir)
                  if (void 0 !== t) {
                    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
                    e.preventDefault()
                    let r = v()
                      .filter((e) => e.focusable)
                      .map((e) => e.ref.current)
                    if ('last' === t) r.reverse()
                    else if ('prev' === t || 'next' === t) {
                      'prev' === t && r.reverse()
                      let n = r.indexOf(e.currentTarget)
                      r = h.loop
                        ? (function (e, t) {
                            return e.map((r, n) => e[(t + n) % e.length])
                          })(r, n + 1)
                        : r.slice(n + 1)
                    }
                    setTimeout(() => q(r))
                  }
                }),
                children:
                  'function' == typeof u ? u({ isCurrentTabStop: m, hasTabStop: null != w }) : u,
              }),
            })
          )
        })
      U.displayName = B
      var W = {
        ArrowLeft: 'prev',
        ArrowUp: 'prev',
        ArrowRight: 'next',
        ArrowDown: 'next',
        PageUp: 'first',
        Home: 'first',
        PageDown: 'last',
        End: 'last',
      }
      function q(e) {
        let t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
          r = document.activeElement
        for (let n of e)
          if (n === r || (n.focus({ preventScroll: t }), document.activeElement !== r)) return
      }
      var H = Symbol('radix.slottable')
      function X(e) {
        return (
          o.isValidElement(e) &&
          'function' == typeof e.type &&
          '__radixId' in e.type &&
          e.type.__radixId === H
        )
      }
      var Z = r(7745),
        $ = r(101),
        Y = ['Enter', ' '],
        J = ['ArrowUp', 'PageDown', 'End'],
        Q = ['ArrowDown', 'PageUp', 'Home', ...J],
        ee = { ltr: [...Y, 'ArrowRight'], rtl: [...Y, 'ArrowLeft'] },
        et = { ltr: ['ArrowLeft'], rtl: ['ArrowRight'] },
        er = 'Menu',
        [en, eo, el] = y(er),
        [ei, ea] = (0, a.A)(er, [el, A.Bk, F]),
        eu = (0, A.Bk)(),
        es = F(),
        [ed, ec] = ei(er),
        [ef, ep] = ei(er),
        eh = (e) => {
          let {
              __scopeMenu: t,
              open: r = !1,
              children: n,
              dir: l,
              onOpenChange: i,
              modal: a = !0,
            } = e,
            u = eu(t),
            [s, d] = o.useState(null),
            c = o.useRef(!1),
            f = (0, E.c)(i),
            h = M(l)
          return (
            o.useEffect(() => {
              let e = () => {
                  ;((c.current = !0),
                    document.addEventListener('pointerdown', t, { capture: !0, once: !0 }),
                    document.addEventListener('pointermove', t, { capture: !0, once: !0 }))
                },
                t = () => (c.current = !1)
              return (
                document.addEventListener('keydown', e, { capture: !0 }),
                () => {
                  ;(document.removeEventListener('keydown', e, { capture: !0 }),
                    document.removeEventListener('pointerdown', t, { capture: !0 }),
                    document.removeEventListener('pointermove', t, { capture: !0 }))
                }
              )
            }, []),
            (0, p.jsx)(A.bL, {
              ...u,
              children: (0, p.jsx)(ed, {
                scope: t,
                open: r,
                onOpenChange: f,
                content: s,
                onContentChange: d,
                children: (0, p.jsx)(ef, {
                  scope: t,
                  onClose: o.useCallback(() => f(!1), [f]),
                  isUsingKeyboardRef: c,
                  dir: h,
                  modal: a,
                  children: n,
                }),
              }),
            })
          )
        }
      eh.displayName = er
      var em = o.forwardRef((e, t) => {
        let { __scopeMenu: r, ...n } = e,
          o = eu(r)
        return (0, p.jsx)(A.Mz, { ...o, ...n, ref: t })
      })
      em.displayName = 'MenuAnchor'
      var ev = 'MenuPortal',
        [ey, eg] = ei(ev, { forceMount: void 0 }),
        ew = (e) => {
          let { __scopeMenu: t, forceMount: r, children: n, container: o } = e,
            l = ec(ev, t)
          return (0, p.jsx)(ey, {
            scope: t,
            forceMount: r,
            children: (0, p.jsx)(_.C, {
              present: r || l.open,
              children: (0, p.jsx)(D.Z, { asChild: !0, container: o, children: n }),
            }),
          })
        }
      ew.displayName = ev
      var ex = 'MenuContent',
        [eR, eM] = ei(ex),
        eb = o.forwardRef((e, t) => {
          let r = eg(ex, e.__scopeMenu),
            { forceMount: n = r.forceMount, ...o } = e,
            l = ec(ex, e.__scopeMenu),
            i = ep(ex, e.__scopeMenu)
          return (0, p.jsx)(en.Provider, {
            scope: e.__scopeMenu,
            children: (0, p.jsx)(_.C, {
              present: n || l.open,
              children: (0, p.jsx)(en.Slot, {
                scope: e.__scopeMenu,
                children: i.modal
                  ? (0, p.jsx)(eC, { ...o, ref: t })
                  : (0, p.jsx)(ek, { ...o, ref: t }),
              }),
            }),
          })
        }),
        eC = o.forwardRef((e, t) => {
          let r = ec(ex, e.__scopeMenu),
            n = o.useRef(null),
            a = (0, i.s)(t, n)
          return (
            o.useEffect(() => {
              let e = n.current
              if (e) return (0, Z.Eq)(e)
            }, []),
            (0, p.jsx)(eA, {
              ...e,
              ref: a,
              trapFocus: r.open,
              disableOutsidePointerEvents: r.open,
              disableOutsideScroll: !0,
              onFocusOutside: (0, l.mK)(e.onFocusOutside, (e) => e.preventDefault(), {
                checkForDefaultPrevented: !1,
              }),
              onDismiss: () => r.onOpenChange(!1),
            })
          )
        }),
        ek = o.forwardRef((e, t) => {
          let r = ec(ex, e.__scopeMenu)
          return (0, p.jsx)(eA, {
            ...e,
            ref: t,
            trapFocus: !1,
            disableOutsidePointerEvents: !1,
            disableOutsideScroll: !1,
            onDismiss: () => r.onOpenChange(!1),
          })
        }),
        ej = (function (e) {
          let t = (function (e) {
              let t = o.forwardRef((e, t) => {
                let { children: r, ...n } = e
                if (o.isValidElement(r)) {
                  var l
                  let e,
                    a,
                    u =
                      ((l = r),
                      (a =
                        (e = Object.getOwnPropertyDescriptor(l.props, 'ref')?.get) &&
                        'isReactWarning' in e &&
                        e.isReactWarning)
                        ? l.ref
                        : (a =
                              (e = Object.getOwnPropertyDescriptor(l, 'ref')?.get) &&
                              'isReactWarning' in e &&
                              e.isReactWarning)
                          ? l.props.ref
                          : l.props.ref || l.ref),
                    s = (function (e, t) {
                      let r = { ...t }
                      for (let n in t) {
                        let o = e[n],
                          l = t[n]
                        ;/^on[A-Z]/.test(n)
                          ? o && l
                            ? (r[n] = (...e) => {
                                let t = l(...e)
                                return (o(...e), t)
                              })
                            : o && (r[n] = o)
                          : 'style' === n
                            ? (r[n] = { ...o, ...l })
                            : 'className' === n && (r[n] = [o, l].filter(Boolean).join(' '))
                      }
                      return { ...e, ...r }
                    })(n, r.props)
                  return (
                    r.type !== o.Fragment && (s.ref = t ? (0, i.t)(t, u) : u),
                    o.cloneElement(r, s)
                  )
                }
                return o.Children.count(r) > 1 ? o.Children.only(null) : null
              })
              return ((t.displayName = `${e}.SlotClone`), t)
            })(e),
            r = o.forwardRef((e, r) => {
              let { children: n, ...l } = e,
                i = o.Children.toArray(n),
                a = i.find(X)
              if (a) {
                let e = a.props.children,
                  n = i.map((t) =>
                    t !== a
                      ? t
                      : o.Children.count(e) > 1
                        ? o.Children.only(null)
                        : o.isValidElement(e)
                          ? e.props.children
                          : null,
                  )
                return (0, p.jsx)(t, {
                  ...l,
                  ref: r,
                  children: o.isValidElement(e) ? o.cloneElement(e, void 0, n) : null,
                })
              }
              return (0, p.jsx)(t, { ...l, ref: r, children: n })
            })
          return ((r.displayName = `${e}.Slot`), r)
        })('MenuContent.ScrollLock'),
        eA = o.forwardRef((e, t) => {
          let {
              __scopeMenu: r,
              loop: n = !1,
              trapFocus: a,
              onOpenAutoFocus: u,
              onCloseAutoFocus: s,
              disableOutsidePointerEvents: d,
              onEntryFocus: c,
              onEscapeKeyDown: f,
              onPointerDownOutside: h,
              onFocusOutside: m,
              onInteractOutside: v,
              onDismiss: y,
              disableOutsideScroll: g,
              ...w
            } = e,
            x = ec(ex, r),
            R = ep(ex, r),
            M = eu(r),
            j = es(r),
            D = eo(r),
            [_, E] = o.useState(null),
            K = o.useRef(null),
            I = (0, i.s)(t, K, x.onContentChange),
            O = o.useRef(0),
            P = o.useRef(''),
            S = o.useRef(0),
            T = o.useRef(null),
            N = o.useRef('right'),
            F = o.useRef(0),
            L = g ? $.A : o.Fragment
          ;(o.useEffect(() => () => window.clearTimeout(O.current), []), (0, C.Oh)())
          let z = o.useCallback((e) => {
            var t, r
            return (
              N.current === (null == (t = T.current) ? void 0 : t.side) &&
              (function (e, t) {
                return (
                  !!t &&
                  (function (e, t) {
                    let { x: r, y: n } = e,
                      o = !1
                    for (let e = 0, l = t.length - 1; e < t.length; l = e++) {
                      let i = t[e],
                        a = t[l],
                        u = i.x,
                        s = i.y,
                        d = a.x,
                        c = a.y
                      s > n != c > n && r < ((d - u) * (n - s)) / (c - s) + u && (o = !o)
                    }
                    return o
                  })({ x: e.clientX, y: e.clientY }, t)
                )
              })(e, null == (r = T.current) ? void 0 : r.area)
            )
          }, [])
          return (0, p.jsx)(eR, {
            scope: r,
            searchRef: P,
            onItemEnter: o.useCallback(
              (e) => {
                z(e) && e.preventDefault()
              },
              [z],
            ),
            onItemLeave: o.useCallback(
              (e) => {
                var t
                z(e) || (null == (t = K.current) || t.focus(), E(null))
              },
              [z],
            ),
            onTriggerLeave: o.useCallback(
              (e) => {
                z(e) && e.preventDefault()
              },
              [z],
            ),
            pointerGraceTimerRef: S,
            onPointerGraceIntentChange: o.useCallback((e) => {
              T.current = e
            }, []),
            children: (0, p.jsx)(L, {
              ...(g ? { as: ej, allowPinchZoom: !0 } : void 0),
              children: (0, p.jsx)(k.n, {
                asChild: !0,
                trapped: a,
                onMountAutoFocus: (0, l.mK)(u, (e) => {
                  var t
                  ;(e.preventDefault(), null == (t = K.current) || t.focus({ preventScroll: !0 }))
                }),
                onUnmountAutoFocus: s,
                children: (0, p.jsx)(b.qW, {
                  asChild: !0,
                  disableOutsidePointerEvents: d,
                  onEscapeKeyDown: f,
                  onPointerDownOutside: h,
                  onFocusOutside: m,
                  onInteractOutside: v,
                  onDismiss: y,
                  children: (0, p.jsx)(G, {
                    asChild: !0,
                    ...j,
                    dir: R.dir,
                    orientation: 'vertical',
                    loop: n,
                    currentTabStopId: _,
                    onCurrentTabStopIdChange: E,
                    onEntryFocus: (0, l.mK)(c, (e) => {
                      R.isUsingKeyboardRef.current || e.preventDefault()
                    }),
                    preventScrollOnEntryFocus: !0,
                    children: (0, p.jsx)(A.UC, {
                      role: 'menu',
                      'aria-orientation': 'vertical',
                      'data-state': eQ(x.open),
                      'data-radix-menu-content': '',
                      dir: R.dir,
                      ...M,
                      ...w,
                      ref: I,
                      style: { outline: 'none', ...w.style },
                      onKeyDown: (0, l.mK)(w.onKeyDown, (e) => {
                        let t = e.target.closest('[data-radix-menu-content]') === e.currentTarget,
                          r = e.ctrlKey || e.altKey || e.metaKey,
                          n = 1 === e.key.length
                        t &&
                          ('Tab' === e.key && e.preventDefault(),
                          !r &&
                            n &&
                            ((e) => {
                              var t, r
                              let n = P.current + e,
                                o = D().filter((e) => !e.disabled),
                                l = document.activeElement,
                                i =
                                  null == (t = o.find((e) => e.ref.current === l))
                                    ? void 0
                                    : t.textValue,
                                a = (function (e, t, r) {
                                  var n
                                  let o =
                                      t.length > 1 && Array.from(t).every((e) => e === t[0])
                                        ? t[0]
                                        : t,
                                    l = r ? e.indexOf(r) : -1,
                                    i =
                                      ((n = Math.max(l, 0)), e.map((t, r) => e[(n + r) % e.length]))
                                  1 === o.length && (i = i.filter((e) => e !== r))
                                  let a = i.find((e) => e.toLowerCase().startsWith(o.toLowerCase()))
                                  return a !== r ? a : void 0
                                })(
                                  o.map((e) => e.textValue),
                                  n,
                                  i,
                                ),
                                u =
                                  null == (r = o.find((e) => e.textValue === a))
                                    ? void 0
                                    : r.ref.current
                              ;(!(function e(t) {
                                ;((P.current = t),
                                  window.clearTimeout(O.current),
                                  '' !== t && (O.current = window.setTimeout(() => e(''), 1e3)))
                              })(n),
                                u && setTimeout(() => u.focus()))
                            })(e.key))
                        let o = K.current
                        if (e.target !== o || !Q.includes(e.key)) return
                        e.preventDefault()
                        let l = D()
                          .filter((e) => !e.disabled)
                          .map((e) => e.ref.current)
                        ;(J.includes(e.key) && l.reverse(),
                          (function (e) {
                            let t = document.activeElement
                            for (let r of e)
                              if (r === t || (r.focus(), document.activeElement !== t)) return
                          })(l))
                      }),
                      onBlur: (0, l.mK)(e.onBlur, (e) => {
                        e.currentTarget.contains(e.target) ||
                          (window.clearTimeout(O.current), (P.current = ''))
                      }),
                      onPointerMove: (0, l.mK)(
                        e.onPointerMove,
                        e2((e) => {
                          let t = e.target,
                            r = F.current !== e.clientX
                          e.currentTarget.contains(t) &&
                            r &&
                            ((N.current = e.clientX > F.current ? 'right' : 'left'),
                            (F.current = e.clientX))
                        }),
                      ),
                    }),
                  }),
                }),
              }),
            }),
          })
        })
      eb.displayName = ex
      var eD = o.forwardRef((e, t) => {
        let { __scopeMenu: r, ...n } = e
        return (0, p.jsx)(s.sG.div, { role: 'group', ...n, ref: t })
      })
      eD.displayName = 'MenuGroup'
      var e_ = o.forwardRef((e, t) => {
        let { __scopeMenu: r, ...n } = e
        return (0, p.jsx)(s.sG.div, { ...n, ref: t })
      })
      e_.displayName = 'MenuLabel'
      var eE = 'MenuItem',
        eK = 'menu.itemSelect',
        eI = o.forwardRef((e, t) => {
          let { disabled: r = !1, onSelect: n, ...a } = e,
            u = o.useRef(null),
            d = ep(eE, e.__scopeMenu),
            c = eM(eE, e.__scopeMenu),
            f = (0, i.s)(t, u),
            h = o.useRef(!1)
          return (0, p.jsx)(eO, {
            ...a,
            ref: f,
            disabled: r,
            onClick: (0, l.mK)(e.onClick, () => {
              let e = u.current
              if (!r && e) {
                let t = new CustomEvent(eK, { bubbles: !0, cancelable: !0 })
                ;(e.addEventListener(eK, (e) => (null == n ? void 0 : n(e)), { once: !0 }),
                  (0, s.hO)(e, t),
                  t.defaultPrevented ? (h.current = !1) : d.onClose())
              }
            }),
            onPointerDown: (t) => {
              var r
              ;(null == (r = e.onPointerDown) || r.call(e, t), (h.current = !0))
            },
            onPointerUp: (0, l.mK)(e.onPointerUp, (e) => {
              var t
              h.current || null == (t = e.currentTarget) || t.click()
            }),
            onKeyDown: (0, l.mK)(e.onKeyDown, (e) => {
              let t = '' !== c.searchRef.current
              r ||
                (t && ' ' === e.key) ||
                (Y.includes(e.key) && (e.currentTarget.click(), e.preventDefault()))
            }),
          })
        })
      eI.displayName = eE
      var eO = o.forwardRef((e, t) => {
          let { __scopeMenu: r, disabled: n = !1, textValue: a, ...u } = e,
            d = eM(eE, r),
            c = es(r),
            f = o.useRef(null),
            h = (0, i.s)(t, f),
            [m, v] = o.useState(!1),
            [y, g] = o.useState('')
          return (
            o.useEffect(() => {
              let e = f.current
              if (e) {
                var t
                g((null != (t = e.textContent) ? t : '').trim())
              }
            }, [u.children]),
            (0, p.jsx)(en.ItemSlot, {
              scope: r,
              disabled: n,
              textValue: null != a ? a : y,
              children: (0, p.jsx)(U, {
                asChild: !0,
                ...c,
                focusable: !n,
                children: (0, p.jsx)(s.sG.div, {
                  role: 'menuitem',
                  'data-highlighted': m ? '' : void 0,
                  'aria-disabled': n || void 0,
                  'data-disabled': n ? '' : void 0,
                  ...u,
                  ref: h,
                  onPointerMove: (0, l.mK)(
                    e.onPointerMove,
                    e2((e) => {
                      n
                        ? d.onItemLeave(e)
                        : (d.onItemEnter(e),
                          e.defaultPrevented || e.currentTarget.focus({ preventScroll: !0 }))
                    }),
                  ),
                  onPointerLeave: (0, l.mK)(
                    e.onPointerLeave,
                    e2((e) => d.onItemLeave(e)),
                  ),
                  onFocus: (0, l.mK)(e.onFocus, () => v(!0)),
                  onBlur: (0, l.mK)(e.onBlur, () => v(!1)),
                }),
              }),
            })
          )
        }),
        eP = o.forwardRef((e, t) => {
          let { checked: r = !1, onCheckedChange: n, ...o } = e
          return (0, p.jsx)(eV, {
            scope: e.__scopeMenu,
            checked: r,
            children: (0, p.jsx)(eI, {
              role: 'menuitemcheckbox',
              'aria-checked': e0(r) ? 'mixed' : r,
              ...o,
              ref: t,
              'data-state': e1(r),
              onSelect: (0, l.mK)(o.onSelect, () => (null == n ? void 0 : n(!!e0(r) || !r)), {
                checkForDefaultPrevented: !1,
              }),
            }),
          })
        })
      eP.displayName = 'MenuCheckboxItem'
      var eS = 'MenuRadioGroup',
        [eT, eN] = ei(eS, { value: void 0, onValueChange: () => {} }),
        eF = o.forwardRef((e, t) => {
          let { value: r, onValueChange: n, ...o } = e,
            l = (0, E.c)(n)
          return (0, p.jsx)(eT, {
            scope: e.__scopeMenu,
            value: r,
            onValueChange: l,
            children: (0, p.jsx)(eD, { ...o, ref: t }),
          })
        })
      eF.displayName = eS
      var eL = 'MenuRadioItem',
        ez = o.forwardRef((e, t) => {
          let { value: r, ...n } = e,
            o = eN(eL, e.__scopeMenu),
            i = r === o.value
          return (0, p.jsx)(eV, {
            scope: e.__scopeMenu,
            checked: i,
            children: (0, p.jsx)(eI, {
              role: 'menuitemradio',
              'aria-checked': i,
              ...n,
              ref: t,
              'data-state': e1(i),
              onSelect: (0, l.mK)(
                n.onSelect,
                () => {
                  var e
                  return null == (e = o.onValueChange) ? void 0 : e.call(o, r)
                },
                { checkForDefaultPrevented: !1 },
              ),
            }),
          })
        })
      ez.displayName = eL
      var eG = 'MenuItemIndicator',
        [eV, eB] = ei(eG, { checked: !1 }),
        eU = o.forwardRef((e, t) => {
          let { __scopeMenu: r, forceMount: n, ...o } = e,
            l = eB(eG, r)
          return (0, p.jsx)(_.C, {
            present: n || e0(l.checked) || !0 === l.checked,
            children: (0, p.jsx)(s.sG.span, { ...o, ref: t, 'data-state': e1(l.checked) }),
          })
        })
      eU.displayName = eG
      var eW = o.forwardRef((e, t) => {
        let { __scopeMenu: r, ...n } = e
        return (0, p.jsx)(s.sG.div, {
          role: 'separator',
          'aria-orientation': 'horizontal',
          ...n,
          ref: t,
        })
      })
      eW.displayName = 'MenuSeparator'
      var eq = o.forwardRef((e, t) => {
        let { __scopeMenu: r, ...n } = e,
          o = eu(r)
        return (0, p.jsx)(A.i3, { ...o, ...n, ref: t })
      })
      eq.displayName = 'MenuArrow'
      var [eH, eX] = ei('MenuSub'),
        eZ = 'MenuSubTrigger',
        e$ = o.forwardRef((e, t) => {
          let r = ec(eZ, e.__scopeMenu),
            n = ep(eZ, e.__scopeMenu),
            a = eX(eZ, e.__scopeMenu),
            u = eM(eZ, e.__scopeMenu),
            s = o.useRef(null),
            { pointerGraceTimerRef: d, onPointerGraceIntentChange: c } = u,
            f = { __scopeMenu: e.__scopeMenu },
            h = o.useCallback(() => {
              ;(s.current && window.clearTimeout(s.current), (s.current = null))
            }, [])
          return (
            o.useEffect(() => h, [h]),
            o.useEffect(() => {
              let e = d.current
              return () => {
                ;(window.clearTimeout(e), c(null))
              }
            }, [d, c]),
            (0, p.jsx)(em, {
              asChild: !0,
              ...f,
              children: (0, p.jsx)(eO, {
                id: a.triggerId,
                'aria-haspopup': 'menu',
                'aria-expanded': r.open,
                'aria-controls': a.contentId,
                'data-state': eQ(r.open),
                ...e,
                ref: (0, i.t)(t, a.onTriggerChange),
                onClick: (t) => {
                  var n
                  ;(null == (n = e.onClick) || n.call(e, t),
                    e.disabled ||
                      t.defaultPrevented ||
                      (t.currentTarget.focus(), r.open || r.onOpenChange(!0)))
                },
                onPointerMove: (0, l.mK)(
                  e.onPointerMove,
                  e2((t) => {
                    ;(u.onItemEnter(t),
                      !t.defaultPrevented &&
                        (e.disabled ||
                          r.open ||
                          s.current ||
                          (u.onPointerGraceIntentChange(null),
                          (s.current = window.setTimeout(() => {
                            ;(r.onOpenChange(!0), h())
                          }, 100)))))
                  }),
                ),
                onPointerLeave: (0, l.mK)(
                  e.onPointerLeave,
                  e2((e) => {
                    var t, n
                    h()
                    let o = null == (t = r.content) ? void 0 : t.getBoundingClientRect()
                    if (o) {
                      let t = null == (n = r.content) ? void 0 : n.dataset.side,
                        l = 'right' === t,
                        i = o[l ? 'left' : 'right'],
                        a = o[l ? 'right' : 'left']
                      ;(u.onPointerGraceIntentChange({
                        area: [
                          { x: e.clientX + (l ? -5 : 5), y: e.clientY },
                          { x: i, y: o.top },
                          { x: a, y: o.top },
                          { x: a, y: o.bottom },
                          { x: i, y: o.bottom },
                        ],
                        side: t,
                      }),
                        window.clearTimeout(d.current),
                        (d.current = window.setTimeout(
                          () => u.onPointerGraceIntentChange(null),
                          300,
                        )))
                    } else {
                      if ((u.onTriggerLeave(e), e.defaultPrevented)) return
                      u.onPointerGraceIntentChange(null)
                    }
                  }),
                ),
                onKeyDown: (0, l.mK)(e.onKeyDown, (t) => {
                  let o = '' !== u.searchRef.current
                  if (!e.disabled && (!o || ' ' !== t.key) && ee[n.dir].includes(t.key)) {
                    var l
                    ;(r.onOpenChange(!0), null == (l = r.content) || l.focus(), t.preventDefault())
                  }
                }),
              }),
            })
          )
        })
      e$.displayName = eZ
      var eY = 'MenuSubContent',
        eJ = o.forwardRef((e, t) => {
          let r = eg(ex, e.__scopeMenu),
            { forceMount: n = r.forceMount, ...a } = e,
            u = ec(ex, e.__scopeMenu),
            s = ep(ex, e.__scopeMenu),
            d = eX(eY, e.__scopeMenu),
            c = o.useRef(null),
            f = (0, i.s)(t, c)
          return (0, p.jsx)(en.Provider, {
            scope: e.__scopeMenu,
            children: (0, p.jsx)(_.C, {
              present: n || u.open,
              children: (0, p.jsx)(en.Slot, {
                scope: e.__scopeMenu,
                children: (0, p.jsx)(eA, {
                  id: d.contentId,
                  'aria-labelledby': d.triggerId,
                  ...a,
                  ref: f,
                  align: 'start',
                  side: 'rtl' === s.dir ? 'left' : 'right',
                  disableOutsidePointerEvents: !1,
                  disableOutsideScroll: !1,
                  trapFocus: !1,
                  onOpenAutoFocus: (e) => {
                    var t
                    ;(s.isUsingKeyboardRef.current && (null == (t = c.current) || t.focus()),
                      e.preventDefault())
                  },
                  onCloseAutoFocus: (e) => e.preventDefault(),
                  onFocusOutside: (0, l.mK)(e.onFocusOutside, (e) => {
                    e.target !== d.trigger && u.onOpenChange(!1)
                  }),
                  onEscapeKeyDown: (0, l.mK)(e.onEscapeKeyDown, (e) => {
                    ;(s.onClose(), e.preventDefault())
                  }),
                  onKeyDown: (0, l.mK)(e.onKeyDown, (e) => {
                    let t = e.currentTarget.contains(e.target),
                      r = et[s.dir].includes(e.key)
                    if (t && r) {
                      var n
                      ;(u.onOpenChange(!1),
                        null == (n = d.trigger) || n.focus(),
                        e.preventDefault())
                    }
                  }),
                }),
              }),
            }),
          })
        })
      function eQ(e) {
        return e ? 'open' : 'closed'
      }
      function e0(e) {
        return 'indeterminate' === e
      }
      function e1(e) {
        return e0(e) ? 'indeterminate' : e ? 'checked' : 'unchecked'
      }
      function e2(e) {
        return (t) => ('mouse' === t.pointerType ? e(t) : void 0)
      }
      eJ.displayName = eY
      var e5 = 'DropdownMenu',
        [e6, e4] = (0, a.A)(e5, [ea]),
        e8 = ea(),
        [e9, e3] = e6(e5),
        e7 = (e) => {
          let {
              __scopeDropdownMenu: t,
              children: r,
              dir: n,
              open: l,
              defaultOpen: i,
              onOpenChange: a,
              modal: s = !0,
            } = e,
            d = e8(t),
            c = o.useRef(null),
            [f, h] = (0, u.i)({ prop: l, defaultProp: null != i && i, onChange: a, caller: e5 })
          return (0, p.jsx)(e9, {
            scope: t,
            triggerId: (0, j.B)(),
            triggerRef: c,
            contentId: (0, j.B)(),
            open: f,
            onOpenChange: h,
            onOpenToggle: o.useCallback(() => h((e) => !e), [h]),
            modal: s,
            children: (0, p.jsx)(eh, {
              ...d,
              open: f,
              onOpenChange: h,
              dir: n,
              modal: s,
              children: r,
            }),
          })
        }
      e7.displayName = e5
      var te = 'DropdownMenuTrigger',
        tt = o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, disabled: n = !1, ...o } = e,
            a = e3(te, r),
            u = e8(r)
          return (0, p.jsx)(em, {
            asChild: !0,
            ...u,
            children: (0, p.jsx)(s.sG.button, {
              type: 'button',
              id: a.triggerId,
              'aria-haspopup': 'menu',
              'aria-expanded': a.open,
              'aria-controls': a.open ? a.contentId : void 0,
              'data-state': a.open ? 'open' : 'closed',
              'data-disabled': n ? '' : void 0,
              disabled: n,
              ...o,
              ref: (0, i.t)(t, a.triggerRef),
              onPointerDown: (0, l.mK)(e.onPointerDown, (e) => {
                !n &&
                  0 === e.button &&
                  !1 === e.ctrlKey &&
                  (a.onOpenToggle(), a.open || e.preventDefault())
              }),
              onKeyDown: (0, l.mK)(e.onKeyDown, (e) => {
                !n &&
                  (['Enter', ' '].includes(e.key) && a.onOpenToggle(),
                  'ArrowDown' === e.key && a.onOpenChange(!0),
                  ['Enter', ' ', 'ArrowDown'].includes(e.key) && e.preventDefault())
              }),
            }),
          })
        })
      tt.displayName = te
      var tr = (e) => {
        let { __scopeDropdownMenu: t, ...r } = e,
          n = e8(t)
        return (0, p.jsx)(ew, { ...n, ...r })
      }
      tr.displayName = 'DropdownMenuPortal'
      var tn = 'DropdownMenuContent',
        to = o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            i = e3(tn, r),
            a = e8(r),
            u = o.useRef(!1)
          return (0, p.jsx)(eb, {
            id: i.contentId,
            'aria-labelledby': i.triggerId,
            ...a,
            ...n,
            ref: t,
            onCloseAutoFocus: (0, l.mK)(e.onCloseAutoFocus, (e) => {
              var t
              ;(u.current || null == (t = i.triggerRef.current) || t.focus(),
                (u.current = !1),
                e.preventDefault())
            }),
            onInteractOutside: (0, l.mK)(e.onInteractOutside, (e) => {
              let t = e.detail.originalEvent,
                r = 0 === t.button && !0 === t.ctrlKey,
                n = 2 === t.button || r
              ;(!i.modal || n) && (u.current = !0)
            }),
            style: {
              ...e.style,
              '--radix-dropdown-menu-content-transform-origin':
                'var(--radix-popper-transform-origin)',
              '--radix-dropdown-menu-content-available-width':
                'var(--radix-popper-available-width)',
              '--radix-dropdown-menu-content-available-height':
                'var(--radix-popper-available-height)',
              '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
              '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
            },
          })
        })
      ;((to.displayName = tn),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eD, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuGroup'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(e_, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuLabel'))
      var tl = o.forwardRef((e, t) => {
        let { __scopeDropdownMenu: r, ...n } = e,
          o = e8(r)
        return (0, p.jsx)(eI, { ...o, ...n, ref: t })
      })
      ;((tl.displayName = 'DropdownMenuItem'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eP, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuCheckboxItem'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eF, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuRadioGroup'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(ez, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuRadioItem'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eU, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuItemIndicator'))
      var ti = o.forwardRef((e, t) => {
        let { __scopeDropdownMenu: r, ...n } = e,
          o = e8(r)
        return (0, p.jsx)(eW, { ...o, ...n, ref: t })
      })
      ;((ti.displayName = 'DropdownMenuSeparator'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eq, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuArrow'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(e$, { ...o, ...n, ref: t })
        }).displayName = 'DropdownMenuSubTrigger'),
        (o.forwardRef((e, t) => {
          let { __scopeDropdownMenu: r, ...n } = e,
            o = e8(r)
          return (0, p.jsx)(eJ, {
            ...o,
            ...n,
            ref: t,
            style: {
              ...e.style,
              '--radix-dropdown-menu-content-transform-origin':
                'var(--radix-popper-transform-origin)',
              '--radix-dropdown-menu-content-available-width':
                'var(--radix-popper-available-width)',
              '--radix-dropdown-menu-content-available-height':
                'var(--radix-popper-available-height)',
              '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
              '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
            },
          })
        }).displayName = 'DropdownMenuSubContent'))
      var ta = e7,
        tu = tt,
        ts = tr,
        td = to,
        tc = tl,
        tf = ti
    },
    7066: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('clipboard-list', [
        ['rect', { width: '8', height: '4', x: '8', y: '2', rx: '1', ry: '1', key: 'tgr4d6' }],
        [
          'path',
          {
            d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
            key: '116196',
          },
        ],
        ['path', { d: 'M12 11h4', key: '1jrz19' }],
        ['path', { d: 'M12 16h4', key: 'n85exb' }],
        ['path', { d: 'M8 11h.01', key: '1dfujw' }],
        ['path', { d: 'M8 16h.01', key: '18s6g9' }],
      ])
    },
    8754: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('bookmark-check', [
        [
          'path',
          {
            d: 'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z',
            key: 'oz39mx',
          },
        ],
        ['path', { d: 'm9 10 2 2 4-4', key: '1gnqz4' }],
      ])
    },
    9715: (e, t, r) => {
      r.d(t, { A: () => n })
      let n = (0, r(5121).A)('file-text', [
        [
          'path',
          {
            d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
            key: '1oefj6',
          },
        ],
        ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5', key: 'wfsgrz' }],
        ['path', { d: 'M10 9H8', key: 'b1mrlr' }],
        ['path', { d: 'M16 13H8', key: 't4e002' }],
        ['path', { d: 'M16 17H8', key: 'z1uh3a' }],
      ])
    },
  },
])
