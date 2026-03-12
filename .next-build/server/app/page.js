;(() => {
  var a = {}
  ;((a.id = 974),
    (a.ids = [974]),
    (a.modules = {
      261: (a) => {
        'use strict'
        a.exports = require('next/dist/shared/lib/router/utils/app-paths')
      },
      456: (a, b, c) => {
        'use strict'
        a.exports = c(56796).vendored.contexts.ImageConfigContext
      },
      3001: (a, b) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          !(function (a, b) {
            for (var c in b) Object.defineProperty(a, c, { enumerable: !0, get: b[c] })
          })(b, {
            VALID_LOADERS: function () {
              return c
            },
            imageConfigDefault: function () {
              return d
            },
          }))
        let c = ['default', 'imgix', 'cloudinary', 'akamai', 'custom'],
          d = {
            deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
            imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
            path: '/_next/image',
            loader: 'default',
            loaderFile: '',
            domains: [],
            disableStaticImages: !1,
            minimumCacheTTL: 60,
            formats: ['image/webp'],
            maximumResponseBody: 5e7,
            dangerouslyAllowSVG: !1,
            contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
            contentDispositionType: 'attachment',
            localPatterns: void 0,
            remotePatterns: [],
            qualities: void 0,
            unoptimized: !1,
          }
      },
      3295: (a) => {
        'use strict'
        a.exports = require('next/dist/server/app-render/after-task-async-storage.external.js')
      },
      10846: (a) => {
        'use strict'
        a.exports = require('next/dist/compiled/next-server/app-page.runtime.prod.js')
      },
      11108: (a, b, c) => {
        'use strict'
        ;(c.r(b), c.d(b, { default: () => v }))
        var d = c(21124),
          e = c(38301),
          f = c(73869),
          g = c(87516),
          h = c.n(g)
        function i(a) {
          let { quality: b = 75, alt: c, ...e } = a
          return (0, d.jsx)(h(), { ...e, alt: c, quality: b, unoptimized: !0 })
        }
        var j = c(3991),
          k = c.n(j),
          l = c(21096)
        let m = {
          1: 'Al-Kafi-Volume-1-Kulayni',
          2: 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
          3: 'Al-Amali-Mufid',
          4: 'Al-Amali-Saduq',
          5: 'Man-La-Yahduruh-al-Faqih',
          6: 'Al-Tawhid-Saduq',
          7: 'Kitab-al-Ghayba-Numani',
          8: 'Kitab-al-Ghayba-Tusi',
          9: 'Nahj-al-Balagha-Radi',
          10: 'Sifat-al-Shia-Saduq',
          11: 'Fadail-al-Shia-Saduq',
          12: 'Kitab-al-Mumin-Ahwazi',
          13: 'Kitab-al-Zuhd-Ahwazi',
          14: 'Risalat-al-Huquq-Abidin',
          15: 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
          16: 'Al-Khisal-Saduq',
          17: 'Kamil-al-Ziyarat-Qummi',
          18: 'Kitab-al-Duafa-Ghadairi',
          19: 'Maani-al-Akhbar-Saduq',
          20: 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
        }
        function n({ book: a }) {
          let b = a.bookId || m[a.id],
            c = 1 === a.id ? '/al-kafi' : b ? `/${(0, l.yU)(b)}` : '#',
            e = (0, d.jsxs)('div', {
              className:
                'group flex items-center gap-4 rounded-lg border border-border bg-surface-1 p-3 transition-colors hover:bg-surface-2 sm:gap-5 sm:p-4',
              children: [
                (0, d.jsx)(i, {
                  src: a.image,
                  alt: `${a.title} cover`,
                  width: 180,
                  height: 240,
                  className: 'h-28 w-20 shrink-0 rounded object-contain sm:h-36 sm:w-24',
                  priority: a.highlighted,
                  quality: 95,
                  sizes: '(max-width: 640px) 80px, 96px',
                }),
                (0, d.jsxs)('div', {
                  className: 'min-w-0 flex-1',
                  children: [
                    (0, d.jsx)('h3', {
                      className:
                        'text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg',
                      children: a.title,
                    }),
                    a.subtitle &&
                      (0, d.jsx)('p', {
                        className: 'mt-0.5 line-clamp-2 text-sm text-foreground-muted',
                        children: a.subtitle,
                      }),
                    a.author &&
                      (0, d.jsx)('p', {
                        className: 'mt-1 text-xs text-foreground-faint sm:text-sm',
                        children: a.author,
                      }),
                  ],
                }),
              ],
            })
          return '#' !== c ? (0, d.jsx)(k(), { href: c, className: 'block', children: e }) : e
        }
        var o = c(18131),
          p = c(61365),
          q = c(22147),
          r = c(31701),
          s = c(88285),
          t = c(14263),
          u = c(15303)
        function v() {
          let {
              restoreScrollPosition: a,
              savePath: b,
              getSearchState: c,
              saveSearchState: g,
              saveScrollPosition: h,
            } = (0, p.c)(),
            i = (0, e.useRef)(null),
            { history: j, addToHistory: k, clearHistory: l } = (0, q.d)(i),
            [m, v] = (0, e.useState)(!1),
            [w, x] = (0, e.useState)(''),
            [y, z] = (0, e.useState)([]),
            [A, B] = (0, e.useState)(!1),
            [C, D] = (0, e.useState)(null),
            E = (0, e.useMemo)(
              () =>
                (0, r.sg)(async (a) => {
                  if (!a.trim()) {
                    ;(z([]), D(null), g(null))
                    return
                  }
                  ;(B(!0), D(null))
                  try {
                    let b = await fetch(`/read/api/search?q=${encodeURIComponent(a)}`)
                    if (!b.ok) throw Error('Search request failed')
                    let c = await b.json()
                    if (c.error) throw Error(c.error)
                    ;(z(c.results),
                      g({
                        query: a,
                        results: c.results,
                        page: 1,
                        filters: { grading: 'all', sort: 'relevance' },
                      }))
                  } catch {
                    ;(z([]), D('Search failed. Please try again.'), g(null))
                  } finally {
                    B(!1)
                  }
                }, 300),
              [g],
            )
          return (0, d.jsxs)('div', {
            className: 'min-h-screen',
            children: [
              (0, d.jsx)('div', {
                className: 'mx-auto max-w-2xl px-4 pt-6 sm:px-6',
                children: (0, d.jsxs)('div', {
                  className: 'relative',
                  children: [
                    (0, d.jsxs)('div', {
                      className:
                        'flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5',
                      children: [
                        (0, d.jsx)(s.A, { className: 'h-4 w-4 shrink-0 text-foreground-faint' }),
                        (0, d.jsx)('input', {
                          ref: i,
                          placeholder: 'Search hadith across all books… (Ctrl+K)',
                          value: w,
                          onChange: (a) =>
                            ((a) => {
                              if ((x(a), v(!1), !a.trim())) {
                                ;(E.cancel(), z([]), D(null), g(null))
                                return
                              }
                              E(a)
                            })(a.target.value),
                          onFocus: () => {
                            !w && j.length > 0 && v(!0)
                          },
                          onBlur: () => setTimeout(() => v(!1), 200),
                          onKeyDown: (a) => {
                            ;('Enter' === a.key && (w.trim() && k(w.trim()), v(!1)),
                              'Escape' === a.key && (v(!1), i.current?.blur()))
                          },
                          className:
                            'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint',
                        }),
                        A &&
                          (0, d.jsx)(t.A, {
                            className: 'h-4 w-4 shrink-0 animate-spin text-foreground-muted',
                          }),
                        (0, d.jsx)('kbd', {
                          className:
                            'hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground-faint sm:inline-block',
                          children: '⌘K',
                        }),
                      ],
                    }),
                    m &&
                      j.length > 0 &&
                      (0, d.jsxs)('div', {
                        className:
                          'absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg',
                        children: [
                          (0, d.jsxs)('div', {
                            className: 'flex items-center justify-between px-3 py-1.5',
                            children: [
                              (0, d.jsx)('span', {
                                className: 'text-xs font-medium text-foreground-muted',
                                children: 'Recent searches',
                              }),
                              (0, d.jsx)('button', {
                                onMouseDown: (a) => a.preventDefault(),
                                onClick: l,
                                className:
                                  'text-xs text-foreground-faint transition-colors hover:text-foreground-muted',
                                children: 'Clear',
                              }),
                            ],
                          }),
                          j.map((a, b) =>
                            (0, d.jsxs)(
                              'button',
                              {
                                onMouseDown: (a) => a.preventDefault(),
                                onClick: () => {
                                  ;(x(a), v(!1), E(a))
                                },
                                className:
                                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2',
                                children: [
                                  (0, d.jsx)(u.A, {
                                    className: 'h-3 w-3 shrink-0 text-foreground-faint',
                                  }),
                                  (0, d.jsx)('span', { className: 'truncate', children: a }),
                                ],
                              },
                              b,
                            ),
                          ),
                        ],
                      }),
                  ],
                }),
              }),
              (0, d.jsx)(o.A, {
                searchQuery: w,
                searchResults: y,
                isSearching: A,
                onSearch: E,
                onClearSearch: () => {
                  ;(E.cancel(), x(''), z([]), D(null), g(null), v(!1))
                },
                searchContext: 'all-books',
                searchError: C,
              }),
              !w &&
                (0, d.jsxs)('section', {
                  className: 'mx-auto mt-8 max-w-5xl px-4 pb-12 sm:px-6',
                  children: [
                    (0, d.jsxs)('div', {
                      className: 'mb-5',
                      children: [
                        (0, d.jsx)('h2', {
                          className: 'text-lg font-semibold text-foreground sm:text-xl',
                          children: 'Browse Books',
                        }),
                        (0, d.jsx)('p', {
                          className: 'mt-0.5 text-sm text-foreground-muted',
                          children: 'Select a book to explore its hadiths',
                        }),
                      ],
                    }),
                    (0, d.jsx)('div', {
                      className: 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3',
                      children: f.b.map((a) => (0, d.jsx)(n, { book: a }, a.id)),
                    }),
                  ],
                }),
            ],
          })
        }
      },
      15217: (a, b) => {
        'use strict'
        function c(a) {
          let { ampFirst: b = !1, hybrid: c = !1, hasQuery: d = !1 } = void 0 === a ? {} : a
          return b || (c && d)
        }
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'isInAmpMode', {
            enumerable: !0,
            get: function () {
              return c
            },
          }))
      },
      17742: (a, b, c) => {
        'use strict'
        ;(c.r(b), c.d(b, { default: () => d }))
        let d = (0, c(97954).registerClientReference)(
          function () {
            throw Error(
              'Attempted to call the default export of "C:\\\\Users\\\\Admin\\\\Desktop\\\\sl\\\\saadah-library\\\\app\\\\page.tsx" from the server, but it\'s on the client. It\'s not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.',
            )
          },
          'C:\\Users\\Admin\\Desktop\\sl\\saadah-library\\app\\page.tsx',
          'default',
        )
      },
      18355: (a, b, c) => {
        'use strict'
        a.exports = c(56796).vendored.contexts.RouterContext
      },
      19121: (a) => {
        'use strict'
        a.exports = require('next/dist/server/app-render/action-async-storage.external.js')
      },
      19746: (a, b, c) => {
        'use strict'
        a.exports = c(56796).vendored.contexts.HeadManagerContext
      },
      24503: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 11108))
      },
      26713: (a) => {
        'use strict'
        a.exports = require('next/dist/shared/lib/router/utils/is-bot')
      },
      28354: (a) => {
        'use strict'
        a.exports = require('util')
      },
      29294: (a) => {
        'use strict'
        a.exports = require('next/dist/server/app-render/work-async-storage.external.js')
      },
      33873: (a) => {
        'use strict'
        a.exports = require('path')
      },
      34174: (a, b, c) => {
        'use strict'
        ;(c.r(b),
          c.d(b, {
            GlobalError: () => D.a,
            __next_app__: () => J,
            handler: () => L,
            pages: () => I,
            routeModule: () => K,
            tree: () => H,
          }))
        var d = c(49754),
          e = c(9117),
          f = c(46595),
          g = c(32324),
          h = c(39326),
          i = c(38928),
          j = c(20175),
          k = c(12),
          l = c(54290),
          m = c(12696),
          n = c(82802),
          o = c(77533),
          p = c(45229),
          q = c(32822),
          r = c(261),
          s = c(26453),
          t = c(52474),
          u = c(26713),
          v = c(51356),
          w = c(62685),
          x = c(36225),
          y = c(63446),
          z = c(2762),
          A = c(45742),
          B = c(86439),
          C = c(81170),
          D = c.n(C),
          E = c(62506),
          F = c(91203),
          G = {}
        for (let a in E)
          0 >
            [
              'default',
              'tree',
              'pages',
              'GlobalError',
              '__next_app__',
              'routeModule',
              'handler',
            ].indexOf(a) && (G[a] = () => E[a])
        c.d(b, G)
        let H = {
            children: [
              '',
              {
                children: [
                  '__PAGE__',
                  {},
                  {
                    page: [
                      () => Promise.resolve().then(c.bind(c, 17742)),
                      'C:\\Users\\Admin\\Desktop\\sl\\saadah-library\\app\\page.tsx',
                    ],
                    metadata: {
                      icon: [
                        async (a) => (await Promise.resolve().then(c.bind(c, 36014))).default(a),
                      ],
                      apple: [],
                      openGraph: [],
                      twitter: [],
                      manifest: void 0,
                    },
                  },
                ],
              },
              {
                layout: [
                  () => Promise.resolve().then(c.bind(c, 16953)),
                  'C:\\Users\\Admin\\Desktop\\sl\\saadah-library\\app\\layout.tsx',
                ],
                'global-error': [
                  () => Promise.resolve().then(c.t.bind(c, 81170, 23)),
                  'next/dist/client/components/builtin/global-error.js',
                ],
                'not-found': [
                  () => Promise.resolve().then(c.t.bind(c, 87028, 23)),
                  'next/dist/client/components/builtin/not-found.js',
                ],
                forbidden: [
                  () => Promise.resolve().then(c.t.bind(c, 90461, 23)),
                  'next/dist/client/components/builtin/forbidden.js',
                ],
                unauthorized: [
                  () => Promise.resolve().then(c.t.bind(c, 32768, 23)),
                  'next/dist/client/components/builtin/unauthorized.js',
                ],
                metadata: {
                  icon: [async (a) => (await Promise.resolve().then(c.bind(c, 36014))).default(a)],
                  apple: [],
                  openGraph: [],
                  twitter: [],
                  manifest: void 0,
                },
              },
            ],
          }.children,
          I = ['C:\\Users\\Admin\\Desktop\\sl\\saadah-library\\app\\page.tsx'],
          J = { require: c, loadChunk: () => Promise.resolve() },
          K = new d.AppPageRouteModule({
            definition: {
              kind: e.RouteKind.APP_PAGE,
              page: '/page',
              pathname: '/',
              bundlePath: '',
              filename: '',
              appPaths: [],
            },
            userland: { loaderTree: H },
            distDir: '.next-build',
            relativeProjectDir: '',
          })
        async function L(a, b, d) {
          var C
          let G = '/page'
          '/index' === G && (G = '/')
          let M = (0, h.getRequestMeta)(a, 'postponed'),
            N = (0, h.getRequestMeta)(a, 'minimalMode'),
            O = await K.prepare(a, b, { srcPage: G, multiZoneDraftMode: !1 })
          if (!O)
            return (
              (b.statusCode = 400),
              b.end('Bad Request'),
              null == d.waitUntil || d.waitUntil.call(d, Promise.resolve()),
              null
            )
          let {
              buildId: P,
              query: Q,
              params: R,
              parsedUrl: S,
              pageIsDynamic: T,
              buildManifest: U,
              nextFontManifest: V,
              reactLoadableManifest: W,
              serverActionsManifest: X,
              clientReferenceManifest: Y,
              subresourceIntegrityManifest: Z,
              prerenderManifest: $,
              isDraftMode: _,
              resolvedPathname: aa,
              revalidateOnlyGenerated: ab,
              routerServerContext: ac,
              nextConfig: ad,
              interceptionRoutePatterns: ae,
            } = O,
            af = S.pathname || '/',
            ag = (0, r.normalizeAppPath)(G),
            { isOnDemandRevalidate: ah } = O,
            ai = K.match(af, $),
            aj = !!$.routes[aa],
            ak = !!(ai || aj || $.routes[ag]),
            al = a.headers['user-agent'] || '',
            am = (0, u.getBotType)(al),
            an = (0, p.isHtmlBotRequest)(a),
            ao =
              (0, h.getRequestMeta)(a, 'isPrefetchRSCRequest') ??
              '1' === a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],
            ap = (0, h.getRequestMeta)(a, 'isRSCRequest') ?? !!a.headers[t.RSC_HEADER],
            aq = (0, s.getIsPossibleServerAction)(a),
            ar =
              (0, m.checkIsAppPPREnabled)(ad.experimental.ppr) &&
              (null == (C = $.routes[ag] ?? $.dynamicRoutes[ag]) ? void 0 : C.renderingMode) ===
                'PARTIALLY_STATIC',
            as = !1,
            at = !1,
            au = ar ? M : void 0,
            av = ar && ap && !ao,
            aw = (0, h.getRequestMeta)(a, 'segmentPrefetchRSCRequest'),
            ax = !al || (0, p.shouldServeStreamingMetadata)(al, ad.htmlLimitedBots)
          an && ar && ((ak = !1), (ax = !1))
          let ay = !0 === K.isDev || !ak || 'string' == typeof M || av,
            az = an && ar,
            aA = null
          _ || !ak || ay || aq || au || av || (aA = aa)
          let aB = aA
          ;(!aB && K.isDev && (aB = aa), K.isDev || _ || !ak || !ap || av || (0, k.d)(a.headers))
          let aC = {
            ...E,
            tree: H,
            pages: I,
            GlobalError: D(),
            handler: L,
            routeModule: K,
            __next_app__: J,
          }
          X &&
            Y &&
            (0, o.setReferenceManifestsSingleton)({
              page: G,
              clientReferenceManifest: Y,
              serverActionsManifest: X,
              serverModuleMap: (0, q.createServerModuleMap)({ serverActionsManifest: X }),
            })
          let aD = a.method || 'GET',
            aE = (0, g.getTracer)(),
            aF = aE.getActiveScopeSpan()
          try {
            let f = K.getVaryHeader(aa, ae)
            b.setHeader('Vary', f)
            let k = async (c, d) => {
                let e = new l.NodeNextRequest(a),
                  f = new l.NodeNextResponse(b)
                return K.render(e, f, d).finally(() => {
                  if (!c) return
                  c.setAttributes({ 'http.status_code': b.statusCode, 'next.rsc': !1 })
                  let d = aE.getRootSpanAttributes()
                  if (!d) return
                  if (d.get('next.span_type') !== i.BaseServerSpan.handleRequest)
                    return void console.warn(
                      `Unexpected root span type '${d.get('next.span_type')}'. Please report this Next.js issue https://github.com/vercel/next.js`,
                    )
                  let e = d.get('next.route')
                  if (e) {
                    let a = `${aD} ${e}`
                    ;(c.setAttributes({ 'next.route': e, 'http.route': e, 'next.span_name': a }),
                      c.updateName(a))
                  } else c.updateName(`${aD} ${a.url}`)
                })
              },
              m = async ({ span: e, postponed: f, fallbackRouteParams: g }) => {
                let i = {
                    query: Q,
                    params: R,
                    page: ag,
                    sharedContext: { buildId: P },
                    serverComponentsHmrCache: (0, h.getRequestMeta)(a, 'serverComponentsHmrCache'),
                    fallbackRouteParams: g,
                    renderOpts: {
                      App: () => null,
                      Document: () => null,
                      pageConfig: {},
                      ComponentMod: aC,
                      Component: (0, j.T)(aC),
                      params: R,
                      routeModule: K,
                      page: G,
                      postponed: f,
                      shouldWaitOnAllReady: az,
                      serveStreamingMetadata: ax,
                      supportsDynamicResponse: 'string' == typeof f || ay,
                      buildManifest: U,
                      nextFontManifest: V,
                      reactLoadableManifest: W,
                      subresourceIntegrityManifest: Z,
                      serverActionsManifest: X,
                      clientReferenceManifest: Y,
                      setIsrStatus: null == ac ? void 0 : ac.setIsrStatus,
                      dir: c(33873).join(process.cwd(), K.relativeProjectDir),
                      isDraftMode: _,
                      isRevalidate: ak && !f && !av,
                      botType: am,
                      isOnDemandRevalidate: ah,
                      isPossibleServerAction: aq,
                      assetPrefix: ad.assetPrefix,
                      nextConfigOutput: ad.output,
                      crossOrigin: ad.crossOrigin,
                      trailingSlash: ad.trailingSlash,
                      previewProps: $.preview,
                      deploymentId: ad.deploymentId,
                      enableTainting: ad.experimental.taint,
                      htmlLimitedBots: ad.htmlLimitedBots,
                      devtoolSegmentExplorer: ad.experimental.devtoolSegmentExplorer,
                      reactMaxHeadersLength: ad.reactMaxHeadersLength,
                      multiZoneDraftMode: !1,
                      incrementalCache: (0, h.getRequestMeta)(a, 'incrementalCache'),
                      cacheLifeProfiles: ad.experimental.cacheLife,
                      basePath: ad.basePath,
                      serverActions: ad.experimental.serverActions,
                      ...(as
                        ? {
                            nextExport: !0,
                            supportsDynamicResponse: !1,
                            isStaticGeneration: !0,
                            isRevalidate: !0,
                            isDebugDynamicAccesses: as,
                          }
                        : {}),
                      experimental: {
                        isRoutePPREnabled: ar,
                        expireTime: ad.expireTime,
                        staleTimes: ad.experimental.staleTimes,
                        cacheComponents: !!ad.experimental.cacheComponents,
                        clientSegmentCache: !!ad.experimental.clientSegmentCache,
                        clientParamParsing: !!ad.experimental.clientParamParsing,
                        dynamicOnHover: !!ad.experimental.dynamicOnHover,
                        inlineCss: !!ad.experimental.inlineCss,
                        authInterrupts: !!ad.experimental.authInterrupts,
                        clientTraceMetadata: ad.experimental.clientTraceMetadata || [],
                      },
                      waitUntil: d.waitUntil,
                      onClose: (a) => {
                        b.on('close', a)
                      },
                      onAfterTaskError: () => {},
                      onInstrumentationRequestError: (b, c, d) => K.onRequestError(a, b, d, ac),
                      err: (0, h.getRequestMeta)(a, 'invokeError'),
                      dev: K.isDev,
                    },
                  },
                  l = await k(e, i),
                  { metadata: m } = l,
                  { cacheControl: n, headers: o = {}, fetchTags: p } = m
                if (
                  (p && (o[y.NEXT_CACHE_TAGS_HEADER] = p),
                  (a.fetchMetrics = m.fetchMetrics),
                  ak && (null == n ? void 0 : n.revalidate) === 0 && !K.isDev && !ar)
                ) {
                  let a = m.staticBailoutInfo,
                    b = Object.defineProperty(
                      Error(`Page changed from static to dynamic at runtime ${aa}${(null == a ? void 0 : a.description) ? `, reason: ${a.description}` : ''}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),
                      '__NEXT_ERROR_CODE',
                      { value: 'E132', enumerable: !1, configurable: !0 },
                    )
                  if (null == a ? void 0 : a.stack) {
                    let c = a.stack
                    b.stack = b.message + c.substring(c.indexOf('\n'))
                  }
                  throw b
                }
                return {
                  value: {
                    kind: v.CachedRouteKind.APP_PAGE,
                    html: l,
                    headers: o,
                    rscData: m.flightData,
                    postponed: m.postponed,
                    status: m.statusCode,
                    segmentData: m.segmentData,
                  },
                  cacheControl: n,
                }
              },
              o = async ({ hasResolved: c, previousCacheEntry: f, isRevalidating: g, span: i }) => {
                let j,
                  k = !1 === K.isDev,
                  l = c || b.writableEnded
                if (ah && ab && !f && !N)
                  return (
                    (null == ac ? void 0 : ac.render404)
                      ? await ac.render404(a, b)
                      : ((b.statusCode = 404), b.end('This page could not be found')),
                    null
                  )
                if (
                  (ai && (j = (0, w.parseFallbackField)(ai.fallback)),
                  j === w.FallbackMode.PRERENDER &&
                    (0, u.isBot)(al) &&
                    (!ar || an) &&
                    (j = w.FallbackMode.BLOCKING_STATIC_RENDER),
                  (null == f ? void 0 : f.isStale) === -1 && (ah = !0),
                  ah &&
                    (j !== w.FallbackMode.NOT_FOUND || f) &&
                    (j = w.FallbackMode.BLOCKING_STATIC_RENDER),
                  !N &&
                    j !== w.FallbackMode.BLOCKING_STATIC_RENDER &&
                    aB &&
                    !l &&
                    !_ &&
                    T &&
                    (k || !aj))
                ) {
                  let b
                  if ((k || ai) && j === w.FallbackMode.NOT_FOUND) throw new B.NoFallbackError()
                  if (ar && !ap) {
                    let c =
                      'string' == typeof (null == ai ? void 0 : ai.fallback)
                        ? ai.fallback
                        : k
                          ? ag
                          : null
                    if (
                      ((b = await K.handleResponse({
                        cacheKey: c,
                        req: a,
                        nextConfig: ad,
                        routeKind: e.RouteKind.APP_PAGE,
                        isFallback: !0,
                        prerenderManifest: $,
                        isRoutePPREnabled: ar,
                        responseGenerator: async () =>
                          m({
                            span: i,
                            postponed: void 0,
                            fallbackRouteParams: k || at ? (0, n.u)(ag) : null,
                          }),
                        waitUntil: d.waitUntil,
                      })),
                      null === b)
                    )
                      return null
                    if (b) return (delete b.cacheControl, b)
                  }
                }
                let o = ah || g || !au ? void 0 : au
                if (as && void 0 !== o)
                  return {
                    cacheControl: { revalidate: 1, expire: void 0 },
                    value: {
                      kind: v.CachedRouteKind.PAGES,
                      html: x.default.EMPTY,
                      pageData: {},
                      headers: void 0,
                      status: void 0,
                    },
                  }
                let p =
                  T && ar && ((0, h.getRequestMeta)(a, 'renderFallbackShell') || at)
                    ? (0, n.u)(af)
                    : null
                return m({ span: i, postponed: o, fallbackRouteParams: p })
              },
              p = async (c) => {
                var f, g, i, j, k
                let l,
                  n = await K.handleResponse({
                    cacheKey: aA,
                    responseGenerator: (a) => o({ span: c, ...a }),
                    routeKind: e.RouteKind.APP_PAGE,
                    isOnDemandRevalidate: ah,
                    isRoutePPREnabled: ar,
                    req: a,
                    nextConfig: ad,
                    prerenderManifest: $,
                    waitUntil: d.waitUntil,
                  })
                if (
                  (_ &&
                    b.setHeader(
                      'Cache-Control',
                      'private, no-cache, no-store, max-age=0, must-revalidate',
                    ),
                  K.isDev && b.setHeader('Cache-Control', 'no-store, must-revalidate'),
                  !n)
                ) {
                  if (aA)
                    throw Object.defineProperty(
                      Error('invariant: cache entry required but not generated'),
                      '__NEXT_ERROR_CODE',
                      { value: 'E62', enumerable: !1, configurable: !0 },
                    )
                  return null
                }
                if ((null == (f = n.value) ? void 0 : f.kind) !== v.CachedRouteKind.APP_PAGE)
                  throw Object.defineProperty(
                    Error(
                      `Invariant app-page handler received invalid cache entry ${null == (i = n.value) ? void 0 : i.kind}`,
                    ),
                    '__NEXT_ERROR_CODE',
                    { value: 'E707', enumerable: !1, configurable: !0 },
                  )
                let p = 'string' == typeof n.value.postponed
                ak &&
                  !av &&
                  (!p || ao) &&
                  (N ||
                    b.setHeader(
                      'x-nextjs-cache',
                      ah ? 'REVALIDATED' : n.isMiss ? 'MISS' : n.isStale ? 'STALE' : 'HIT',
                    ),
                  b.setHeader(t.NEXT_IS_PRERENDER_HEADER, '1'))
                let { value: q } = n
                if (au) l = { revalidate: 0, expire: void 0 }
                else if (N && ap && !ao && ar) l = { revalidate: 0, expire: void 0 }
                else if (!K.isDev)
                  if (_) l = { revalidate: 0, expire: void 0 }
                  else if (ak) {
                    if (n.cacheControl)
                      if ('number' == typeof n.cacheControl.revalidate) {
                        if (n.cacheControl.revalidate < 1)
                          throw Object.defineProperty(
                            Error(
                              `Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`,
                            ),
                            '__NEXT_ERROR_CODE',
                            { value: 'E22', enumerable: !1, configurable: !0 },
                          )
                        l = {
                          revalidate: n.cacheControl.revalidate,
                          expire:
                            (null == (j = n.cacheControl) ? void 0 : j.expire) ?? ad.expireTime,
                        }
                      } else l = { revalidate: y.CACHE_ONE_YEAR, expire: void 0 }
                  } else b.getHeader('Cache-Control') || (l = { revalidate: 0, expire: void 0 })
                if (
                  ((n.cacheControl = l),
                  'string' == typeof aw &&
                    (null == q ? void 0 : q.kind) === v.CachedRouteKind.APP_PAGE &&
                    q.segmentData)
                ) {
                  b.setHeader(t.NEXT_DID_POSTPONE_HEADER, '2')
                  let c = null == (k = q.headers) ? void 0 : k[y.NEXT_CACHE_TAGS_HEADER]
                  N && ak && c && 'string' == typeof c && b.setHeader(y.NEXT_CACHE_TAGS_HEADER, c)
                  let d = q.segmentData.get(aw)
                  return void 0 !== d
                    ? (0, A.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ad.generateEtags,
                        poweredByHeader: ad.poweredByHeader,
                        result: x.default.fromStatic(d, t.RSC_CONTENT_TYPE_HEADER),
                        cacheControl: n.cacheControl,
                      })
                    : ((b.statusCode = 204),
                      (0, A.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ad.generateEtags,
                        poweredByHeader: ad.poweredByHeader,
                        result: x.default.EMPTY,
                        cacheControl: n.cacheControl,
                      }))
                }
                let r = (0, h.getRequestMeta)(a, 'onCacheEntry')
                if (
                  r &&
                  (await r(
                    { ...n, value: { ...n.value, kind: 'PAGE' } },
                    { url: (0, h.getRequestMeta)(a, 'initURL') },
                  ))
                )
                  return null
                if (p && au)
                  throw Object.defineProperty(
                    Error('Invariant: postponed state should not be present on a resume request'),
                    '__NEXT_ERROR_CODE',
                    { value: 'E396', enumerable: !1, configurable: !0 },
                  )
                if (q.headers) {
                  let a = { ...q.headers }
                  for (let [c, d] of ((N && ak) || delete a[y.NEXT_CACHE_TAGS_HEADER],
                  Object.entries(a)))
                    if (void 0 !== d)
                      if (Array.isArray(d)) for (let a of d) b.appendHeader(c, a)
                      else ('number' == typeof d && (d = d.toString()), b.appendHeader(c, d))
                }
                let s = null == (g = q.headers) ? void 0 : g[y.NEXT_CACHE_TAGS_HEADER]
                if (
                  (N && ak && s && 'string' == typeof s && b.setHeader(y.NEXT_CACHE_TAGS_HEADER, s),
                  !q.status || (ap && ar) || (b.statusCode = q.status),
                  !N && q.status && F.RedirectStatusCode[q.status] && ap && (b.statusCode = 200),
                  p && b.setHeader(t.NEXT_DID_POSTPONE_HEADER, '1'),
                  ap && !_)
                ) {
                  if (void 0 === q.rscData) {
                    if (q.postponed)
                      throw Object.defineProperty(
                        Error('Invariant: Expected postponed to be undefined'),
                        '__NEXT_ERROR_CODE',
                        { value: 'E372', enumerable: !1, configurable: !0 },
                      )
                    return (0, A.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ad.generateEtags,
                      poweredByHeader: ad.poweredByHeader,
                      result: q.html,
                      cacheControl: av ? { revalidate: 0, expire: void 0 } : n.cacheControl,
                    })
                  }
                  return (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: x.default.fromStatic(q.rscData, t.RSC_CONTENT_TYPE_HEADER),
                    cacheControl: n.cacheControl,
                  })
                }
                let u = q.html
                if (!p || N || ap)
                  return (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: u,
                    cacheControl: n.cacheControl,
                  })
                if (as)
                  return (
                    u.push(
                      new ReadableStream({
                        start(a) {
                          ;(a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML), a.close())
                        },
                      }),
                    ),
                    (0, A.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ad.generateEtags,
                      poweredByHeader: ad.poweredByHeader,
                      result: u,
                      cacheControl: { revalidate: 0, expire: void 0 },
                    })
                  )
                let w = new TransformStream()
                return (
                  u.push(w.readable),
                  m({ span: c, postponed: q.postponed, fallbackRouteParams: null })
                    .then(async (a) => {
                      var b, c
                      if (!a)
                        throw Object.defineProperty(
                          Error('Invariant: expected a result to be returned'),
                          '__NEXT_ERROR_CODE',
                          { value: 'E463', enumerable: !1, configurable: !0 },
                        )
                      if ((null == (b = a.value) ? void 0 : b.kind) !== v.CachedRouteKind.APP_PAGE)
                        throw Object.defineProperty(
                          Error(
                            `Invariant: expected a page response, got ${null == (c = a.value) ? void 0 : c.kind}`,
                          ),
                          '__NEXT_ERROR_CODE',
                          { value: 'E305', enumerable: !1, configurable: !0 },
                        )
                      await a.value.html.pipeTo(w.writable)
                    })
                    .catch((a) => {
                      w.writable.abort(a).catch((a) => {
                        console.error("couldn't abort transformer", a)
                      })
                    }),
                  (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: u,
                    cacheControl: { revalidate: 0, expire: void 0 },
                  })
                )
              }
            if (!aF)
              return await aE.withPropagatedContext(a.headers, () =>
                aE.trace(
                  i.BaseServerSpan.handleRequest,
                  {
                    spanName: `${aD} ${a.url}`,
                    kind: g.SpanKind.SERVER,
                    attributes: { 'http.method': aD, 'http.target': a.url },
                  },
                  p,
                ),
              )
            await p(aF)
          } catch (b) {
            throw (
              b instanceof B.NoFallbackError ||
                (await K.onRequestError(
                  a,
                  b,
                  {
                    routerKind: 'App Router',
                    routePath: G,
                    routeType: 'render',
                    revalidateReason: (0, f.c)({ isRevalidate: ak, isOnDemandRevalidate: ah }),
                  },
                  ac,
                )),
              b
            )
          }
        }
      },
      40106: (a, b, c) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'Image', {
            enumerable: !0,
            get: function () {
              return u
            },
          }))
        let d = c(35288),
          e = c(55823),
          f = c(21124),
          g = e._(c(38301)),
          h = d._(c(23312)),
          i = d._(c(63725)),
          j = c(63974),
          k = c(3001),
          l = c(456)
        c(21507)
        let m = c(18355),
          n = d._(c(49656)),
          o = c(49427),
          p = {
            deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
            imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
            qualities: [75, 95],
            path: '/read/_next/image',
            loader: 'default',
            dangerouslyAllowSVG: !1,
            unoptimized: !0,
          }
        function q(a, b, c, d, e, f, g) {
          let h = null == a ? void 0 : a.src
          a &&
            a['data-loaded-src'] !== h &&
            ((a['data-loaded-src'] = h),
            ('decode' in a ? a.decode() : Promise.resolve())
              .catch(() => {})
              .then(() => {
                if (a.parentElement && a.isConnected) {
                  if (('empty' !== b && e(!0), null == c ? void 0 : c.current)) {
                    let b = new Event('load')
                    Object.defineProperty(b, 'target', { writable: !1, value: a })
                    let d = !1,
                      e = !1
                    c.current({
                      ...b,
                      nativeEvent: b,
                      currentTarget: a,
                      target: a,
                      isDefaultPrevented: () => d,
                      isPropagationStopped: () => e,
                      persist: () => {},
                      preventDefault: () => {
                        ;((d = !0), b.preventDefault())
                      },
                      stopPropagation: () => {
                        ;((e = !0), b.stopPropagation())
                      },
                    })
                  }
                  ;(null == d ? void 0 : d.current) && d.current(a)
                }
              }))
        }
        function r(a) {
          return g.use ? { fetchPriority: a } : { fetchpriority: a }
        }
        globalThis.__NEXT_IMAGE_IMPORTED = !0
        let s = (0, g.forwardRef)((a, b) => {
          let {
              src: c,
              srcSet: d,
              sizes: e,
              height: h,
              width: i,
              decoding: j,
              className: k,
              style: l,
              fetchPriority: m,
              placeholder: n,
              loading: p,
              unoptimized: s,
              fill: t,
              onLoadRef: u,
              onLoadingCompleteRef: v,
              setBlurComplete: w,
              setShowAltText: x,
              sizesInput: y,
              onLoad: z,
              onError: A,
              ...B
            } = a,
            C = (0, g.useCallback)(
              (a) => {
                a && (A && (a.src = a.src), a.complete && q(a, n, u, v, w, s, y))
              },
              [c, n, u, v, w, A, s, y],
            ),
            D = (0, o.useMergedRef)(b, C)
          return (0, f.jsx)('img', {
            ...B,
            ...r(m),
            loading: p,
            width: i,
            height: h,
            decoding: j,
            'data-nimg': t ? 'fill' : '1',
            className: k,
            style: l,
            sizes: e,
            srcSet: d,
            src: c,
            ref: D,
            onLoad: (a) => {
              q(a.currentTarget, n, u, v, w, s, y)
            },
            onError: (a) => {
              ;(x(!0), 'empty' !== n && w(!0), A && A(a))
            },
          })
        })
        function t(a) {
          let { isAppRouter: b, imgAttributes: c } = a,
            d = {
              as: 'image',
              imageSrcSet: c.srcSet,
              imageSizes: c.sizes,
              crossOrigin: c.crossOrigin,
              referrerPolicy: c.referrerPolicy,
              ...r(c.fetchPriority),
            }
          return b && h.default.preload
            ? (h.default.preload(c.src, d), null)
            : (0, f.jsx)(i.default, {
                children: (0, f.jsx)(
                  'link',
                  { rel: 'preload', href: c.srcSet ? void 0 : c.src, ...d },
                  '__nimg-' + c.src + c.srcSet + c.sizes,
                ),
              })
        }
        let u = (0, g.forwardRef)((a, b) => {
          let c = (0, g.useContext)(m.RouterContext),
            d = (0, g.useContext)(l.ImageConfigContext),
            e = (0, g.useMemo)(() => {
              var a
              let b = p || d || k.imageConfigDefault,
                c = [...b.deviceSizes, ...b.imageSizes].sort((a, b) => a - b),
                e = b.deviceSizes.sort((a, b) => a - b),
                f = null == (a = b.qualities) ? void 0 : a.sort((a, b) => a - b)
              return { ...b, allSizes: c, deviceSizes: e, qualities: f }
            }, [d]),
            { onLoad: h, onLoadingComplete: i } = a,
            o = (0, g.useRef)(h)
          ;(0, g.useEffect)(() => {
            o.current = h
          }, [h])
          let q = (0, g.useRef)(i)
          ;(0, g.useEffect)(() => {
            q.current = i
          }, [i])
          let [r, u] = (0, g.useState)(!1),
            [v, w] = (0, g.useState)(!1),
            { props: x, meta: y } = (0, j.getImgProps)(a, {
              defaultLoader: n.default,
              imgConf: e,
              blurComplete: r,
              showAltText: v,
            })
          return (0, f.jsxs)(f.Fragment, {
            children: [
              (0, f.jsx)(s, {
                ...x,
                unoptimized: y.unoptimized,
                placeholder: y.placeholder,
                fill: y.fill,
                onLoadRef: o,
                onLoadingCompleteRef: q,
                setBlurComplete: u,
                setShowAltText: w,
                sizesInput: a.sizes,
                ref: b,
              }),
              y.priority ? (0, f.jsx)(t, { isAppRouter: !c, imgAttributes: x }) : null,
            ],
          })
        })
        ;('function' == typeof b.default || ('object' == typeof b.default && null !== b.default)) &&
          void 0 === b.default.__esModule &&
          (Object.defineProperty(b.default, '__esModule', { value: !0 }),
          Object.assign(b.default, b),
          (a.exports = b.default))
      },
      41025: (a) => {
        'use strict'
        a.exports = require('next/dist/server/app-render/dynamic-access-async-storage.external.js')
      },
      49656: (a, b) => {
        'use strict'
        function c(a) {
          var b
          let { config: c, src: d, width: e, quality: f } = a,
            g =
              f ||
              (null == (b = c.qualities)
                ? void 0
                : b.reduce((a, b) => (Math.abs(b - 75) < Math.abs(a - 75) ? b : a))) ||
              75
          return (
            c.path +
            '?url=' +
            encodeURIComponent(d) +
            '&w=' +
            e +
            '&q=' +
            g +
            (d.startsWith('/_next/static/media/'), '')
          )
        }
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'default', {
            enumerable: !0,
            get: function () {
              return d
            },
          }),
          (c.__next_img_default = !0))
        let d = c
      },
      57684: (a, b, c) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'default', {
            enumerable: !0,
            get: function () {
              return f
            },
          }))
        let d = c(38301),
          e = () => {}
        function f(a) {
          var b
          let { headManager: c, reduceComponentsToState: f } = a
          function g() {
            if (c && c.mountedInstances) {
              let b = d.Children.toArray(Array.from(c.mountedInstances).filter(Boolean))
              c.updateHead(f(b, a))
            }
          }
          return (
            null == c || null == (b = c.mountedInstances) || b.add(a.children),
            g(),
            e(() => {
              var b
              return (
                null == c || null == (b = c.mountedInstances) || b.add(a.children),
                () => {
                  var b
                  null == c || null == (b = c.mountedInstances) || b.delete(a.children)
                }
              )
            }),
            e(
              () => (
                c && (c._pendingUpdate = g),
                () => {
                  c && (c._pendingUpdate = g)
                }
              ),
            ),
            null
          )
        }
      },
      63033: (a) => {
        'use strict'
        a.exports = require('next/dist/server/app-render/work-unit-async-storage.external.js')
      },
      63725: (a, b, c) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          !(function (a, b) {
            for (var c in b) Object.defineProperty(a, c, { enumerable: !0, get: b[c] })
          })(b, {
            default: function () {
              return p
            },
            defaultHead: function () {
              return l
            },
          }))
        let d = c(35288),
          e = c(55823),
          f = c(21124),
          g = e._(c(38301)),
          h = d._(c(57684)),
          i = c(81578),
          j = c(19746),
          k = c(15217)
        function l(a) {
          void 0 === a && (a = !1)
          let b = [(0, f.jsx)('meta', { charSet: 'utf-8' }, 'charset')]
          return (
            a ||
              b.push(
                (0, f.jsx)('meta', { name: 'viewport', content: 'width=device-width' }, 'viewport'),
              ),
            b
          )
        }
        function m(a, b) {
          return 'string' == typeof b || 'number' == typeof b
            ? a
            : b.type === g.default.Fragment
              ? a.concat(
                  g.default.Children.toArray(b.props.children).reduce(
                    (a, b) => ('string' == typeof b || 'number' == typeof b ? a : a.concat(b)),
                    [],
                  ),
                )
              : a.concat(b)
        }
        c(21507)
        let n = ['name', 'httpEquiv', 'charSet', 'itemProp']
        function o(a, b) {
          let { inAmpMode: c } = b
          return a
            .reduce(m, [])
            .reverse()
            .concat(l(c).reverse())
            .filter(
              (function () {
                let a = new Set(),
                  b = new Set(),
                  c = new Set(),
                  d = {}
                return (e) => {
                  let f = !0,
                    g = !1
                  if (e.key && 'number' != typeof e.key && e.key.indexOf('$') > 0) {
                    g = !0
                    let b = e.key.slice(e.key.indexOf('$') + 1)
                    a.has(b) ? (f = !1) : a.add(b)
                  }
                  switch (e.type) {
                    case 'title':
                    case 'base':
                      b.has(e.type) ? (f = !1) : b.add(e.type)
                      break
                    case 'meta':
                      for (let a = 0, b = n.length; a < b; a++) {
                        let b = n[a]
                        if (e.props.hasOwnProperty(b))
                          if ('charSet' === b) c.has(b) ? (f = !1) : c.add(b)
                          else {
                            let a = e.props[b],
                              c = d[b] || new Set()
                            ;('name' !== b || !g) && c.has(a) ? (f = !1) : (c.add(a), (d[b] = c))
                          }
                      }
                  }
                  return f
                }
              })(),
            )
            .reverse()
            .map((a, b) => {
              let c = a.key || b
              return g.default.cloneElement(a, { key: c })
            })
        }
        let p = function (a) {
          let { children: b } = a,
            c = (0, g.useContext)(i.AmpStateContext),
            d = (0, g.useContext)(j.HeadManagerContext)
          return (0, f.jsx)(h.default, {
            reduceComponentsToState: o,
            headManager: d,
            inAmpMode: (0, k.isInAmpMode)(c),
            children: b,
          })
        }
        ;('function' == typeof b.default || ('object' == typeof b.default && null !== b.default)) &&
          void 0 === b.default.__esModule &&
          (Object.defineProperty(b.default, '__esModule', { value: !0 }),
          Object.assign(b.default, b),
          (a.exports = b.default))
      },
      63974: (a, b, c) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'getImgProps', {
            enumerable: !0,
            get: function () {
              return i
            },
          }),
          c(21507))
        let d = c(78757),
          e = c(3001),
          f = ['-moz-initial', 'fill', 'none', 'scale-down', void 0]
        function g(a) {
          return void 0 !== a.default
        }
        function h(a) {
          return void 0 === a
            ? a
            : 'number' == typeof a
              ? Number.isFinite(a)
                ? a
                : NaN
              : 'string' == typeof a && /^[0-9]+$/.test(a)
                ? parseInt(a, 10)
                : NaN
        }
        function i(a, b) {
          var c, i
          let j,
            k,
            l,
            {
              src: m,
              sizes: n,
              unoptimized: o = !1,
              priority: p = !1,
              loading: q,
              className: r,
              quality: s,
              width: t,
              height: u,
              fill: v = !1,
              style: w,
              overrideSrc: x,
              onLoad: y,
              onLoadingComplete: z,
              placeholder: A = 'empty',
              blurDataURL: B,
              fetchPriority: C,
              decoding: D = 'async',
              layout: E,
              objectFit: F,
              objectPosition: G,
              lazyBoundary: H,
              lazyRoot: I,
              ...J
            } = a,
            { imgConf: K, showAltText: L, blurComplete: M, defaultLoader: N } = b,
            O = K || e.imageConfigDefault
          if ('allSizes' in O) j = O
          else {
            let a = [...O.deviceSizes, ...O.imageSizes].sort((a, b) => a - b),
              b = O.deviceSizes.sort((a, b) => a - b),
              d = null == (c = O.qualities) ? void 0 : c.sort((a, b) => a - b)
            j = { ...O, allSizes: a, deviceSizes: b, qualities: d }
          }
          if (void 0 === N)
            throw Object.defineProperty(
              Error(
                'images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config',
              ),
              '__NEXT_ERROR_CODE',
              { value: 'E163', enumerable: !1, configurable: !0 },
            )
          let P = J.loader || N
          ;(delete J.loader, delete J.srcSet)
          let Q = '__next_img_default' in P
          if (Q) {
            if ('custom' === j.loader)
              throw Object.defineProperty(
                Error(
                  'Image with src "' +
                    m +
                    '" is missing "loader" prop.\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader',
                ),
                '__NEXT_ERROR_CODE',
                { value: 'E252', enumerable: !1, configurable: !0 },
              )
          } else {
            let a = P
            P = (b) => {
              let { config: c, ...d } = b
              return a(d)
            }
          }
          if (E) {
            'fill' === E && (v = !0)
            let a = {
              intrinsic: { maxWidth: '100%', height: 'auto' },
              responsive: { width: '100%', height: 'auto' },
            }[E]
            a && (w = { ...w, ...a })
            let b = { responsive: '100vw', fill: '100vw' }[E]
            b && !n && (n = b)
          }
          let R = '',
            S = h(t),
            T = h(u)
          if ((i = m) && 'object' == typeof i && (g(i) || void 0 !== i.src)) {
            let a = g(m) ? m.default : m
            if (!a.src)
              throw Object.defineProperty(
                Error(
                  'An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ' +
                    JSON.stringify(a),
                ),
                '__NEXT_ERROR_CODE',
                { value: 'E460', enumerable: !1, configurable: !0 },
              )
            if (!a.height || !a.width)
              throw Object.defineProperty(
                Error(
                  'An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ' +
                    JSON.stringify(a),
                ),
                '__NEXT_ERROR_CODE',
                { value: 'E48', enumerable: !1, configurable: !0 },
              )
            if (((k = a.blurWidth), (l = a.blurHeight), (B = B || a.blurDataURL), (R = a.src), !v))
              if (S || T) {
                if (S && !T) {
                  let b = S / a.width
                  T = Math.round(a.height * b)
                } else if (!S && T) {
                  let b = T / a.height
                  S = Math.round(a.width * b)
                }
              } else ((S = a.width), (T = a.height))
          }
          let U = !p && ('lazy' === q || void 0 === q)
          ;((!(m = 'string' == typeof m ? m : R) ||
            m.startsWith('data:') ||
            m.startsWith('blob:')) &&
            ((o = !0), (U = !1)),
            j.unoptimized && (o = !0),
            Q && !j.dangerouslyAllowSVG && m.split('?', 1)[0].endsWith('.svg') && (o = !0))
          let V = h(s),
            W = Object.assign(
              v
                ? {
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    objectFit: F,
                    objectPosition: G,
                  }
                : {},
              L ? {} : { color: 'transparent' },
              w,
            ),
            X =
              M || 'empty' === A
                ? null
                : 'blur' === A
                  ? 'url("data:image/svg+xml;charset=utf-8,' +
                    (0, d.getImageBlurSvg)({
                      widthInt: S,
                      heightInt: T,
                      blurWidth: k,
                      blurHeight: l,
                      blurDataURL: B || '',
                      objectFit: W.objectFit,
                    }) +
                    '")'
                  : 'url("' + A + '")',
            Y = f.includes(W.objectFit)
              ? 'fill' === W.objectFit
                ? '100% 100%'
                : 'cover'
              : W.objectFit,
            Z = X
              ? {
                  backgroundSize: Y,
                  backgroundPosition: W.objectPosition || '50% 50%',
                  backgroundRepeat: 'no-repeat',
                  backgroundImage: X,
                }
              : {},
            $ = (function (a) {
              let {
                config: b,
                src: c,
                unoptimized: d,
                width: e,
                quality: f,
                sizes: g,
                loader: h,
              } = a
              if (d) return { src: c, srcSet: void 0, sizes: void 0 }
              let { widths: i, kind: j } = (function (a, b, c) {
                  let { deviceSizes: d, allSizes: e } = a
                  if (c) {
                    let a = /(^|\s)(1?\d?\d)vw/g,
                      b = []
                    for (let d; (d = a.exec(c)); ) b.push(parseInt(d[2]))
                    if (b.length) {
                      let a = 0.01 * Math.min(...b)
                      return { widths: e.filter((b) => b >= d[0] * a), kind: 'w' }
                    }
                    return { widths: e, kind: 'w' }
                  }
                  return 'number' != typeof b
                    ? { widths: d, kind: 'w' }
                    : {
                        widths: [
                          ...new Set(
                            [b, 2 * b].map((a) => e.find((b) => b >= a) || e[e.length - 1]),
                          ),
                        ],
                        kind: 'x',
                      }
                })(b, e, g),
                k = i.length - 1
              return {
                sizes: g || 'w' !== j ? g : '100vw',
                srcSet: i
                  .map(
                    (a, d) =>
                      h({ config: b, src: c, quality: f, width: a }) +
                      ' ' +
                      ('w' === j ? a : d + 1) +
                      j,
                  )
                  .join(', '),
                src: h({ config: b, src: c, quality: f, width: i[k] }),
              }
            })({ config: j, src: m, unoptimized: o, width: S, quality: V, sizes: n, loader: P })
          return {
            props: {
              ...J,
              loading: U ? 'lazy' : q,
              fetchPriority: C,
              width: S,
              height: T,
              decoding: D,
              className: r,
              style: { ...W, ...Z },
              sizes: $.sizes,
              srcSet: $.srcSet,
              src: x || $.src,
            },
            meta: { unoptimized: o, priority: p, placeholder: A, fill: v },
          }
        }
      },
      64255: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 17742))
      },
      78757: (a, b) => {
        'use strict'
        function c(a) {
          let {
              widthInt: b,
              heightInt: c,
              blurWidth: d,
              blurHeight: e,
              blurDataURL: f,
              objectFit: g,
            } = a,
            h = d ? 40 * d : b,
            i = e ? 40 * e : c,
            j = h && i ? "viewBox='0 0 " + h + ' ' + i + "'" : ''
          return (
            "%3Csvg xmlns='http://www.w3.org/2000/svg' " +
            j +
            "%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='" +
            (j
              ? 'none'
              : 'contain' === g
                ? 'xMidYMid'
                : 'cover' === g
                  ? 'xMidYMid slice'
                  : 'none') +
            "' style='filter: url(%23b);' href='" +
            f +
            "'/%3E%3C/svg%3E"
          )
        }
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          Object.defineProperty(b, 'getImageBlurSvg', {
            enumerable: !0,
            get: function () {
              return c
            },
          }))
      },
      81578: (a, b, c) => {
        'use strict'
        a.exports = c(56796).vendored.contexts.AmpContext
      },
      86439: (a) => {
        'use strict'
        a.exports = require('next/dist/shared/lib/no-fallback-error.external')
      },
      87516: (a, b, c) => {
        'use strict'
        ;(Object.defineProperty(b, '__esModule', { value: !0 }),
          !(function (a, b) {
            for (var c in b) Object.defineProperty(a, c, { enumerable: !0, get: b[c] })
          })(b, {
            default: function () {
              return i
            },
            getImageProps: function () {
              return h
            },
          }))
        let d = c(35288),
          e = c(63974),
          f = c(40106),
          g = d._(c(49656))
        function h(a) {
          let { props: b } = (0, e.getImgProps)(a, {
            defaultLoader: g.default,
            imgConf: {
              deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
              imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
              qualities: [75, 95],
              path: '/read/_next/image',
              loader: 'default',
              dangerouslyAllowSVG: !1,
              unoptimized: !0,
            },
          })
          for (let [a, c] of Object.entries(b)) void 0 === c && delete b[a]
          return { props: b }
        }
        let i = f.Image
      },
    }))
  var b = require('../webpack-runtime.js')
  b.C(a)
  var c = b.X(0, [331, 103, 298, 576, 963, 818, 951], () => b((b.s = 34174)))
  module.exports = c
})()
