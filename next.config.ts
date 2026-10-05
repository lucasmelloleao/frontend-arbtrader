import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
  // Shell estático + buraco dinâmico em streaming. NÃO é cache: cada request
  // busca fresco; o que fica pré-renderizado é só a casca sem dado. A parte que
  // lê cookie/dado precisa ficar sob um `<Suspense>` (ver src/app/perfil/page.tsx).
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    turbopackRustReactCompiler: true,
    useTypeScriptCli: true,
  },
  productionBrowserSourceMaps: false,
  images: {
    minimumCacheTTL: 86_400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Proxy same-origin: o browser chama `/api/*` (mesmo origin, sem CORS) e o
  // servidor Next encaminha para o backend REST em `INTERNAL_API_URL`. O
  // `NEXT_PUBLIC_API_URL` fica em "/" no browser (ver `lib/api/base-url.ts`).
  // Ativo sempre que houver uma URL absoluta de backend; com `NEXT_PUBLIC_API_URL="/"`
  // em produção (backend same-site), `INTERNAL_API_URL` também é `/` e o
  // rewrite fica desligado naturalmente.
  async rewrites() {
    const apiBaseUrl = process.env.INTERNAL_API_URL;

    const proxyRewrites = [
      {
        source: "/api/proxy/clob/:path*",
        destination: "https://clob.polymarket.com/:path*",
      },
      {
        source: "/api/proxy/gamma/:path*",
        destination: "https://gamma-api.polymarket.com/:path*",
      },
      {
        source: "/api/proxy/data/:path*",
        destination: "https://data-api.polymarket.com/:path*",
      },
    ];

    if (!apiBaseUrl || apiBaseUrl === "/") {
      return proxyRewrites;
    }

    return [...proxyRewrites, { source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Alt-Svc",
            value: "clear",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
