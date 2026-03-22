import { execSync } from 'node:child_process'

import NextBundleAnalyzer from '@next/bundle-analyzer'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { config } from 'dotenv'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

process.title = 'Shiro (NextJS)'

const env = config().parsed || {}
const isProd = process.env.NODE_ENV === 'production'

let commitHash = ''
let commitUrl = ''
const repoInfo = getRepoInfo()

if (repoInfo) {
  commitHash = repoInfo.hash
  commitUrl = repoInfo.url
}

/** @type {import('next').NextConfig} */

const browserPage =
  'public, max-age=0, must-revalidate, stale-while-revalidate=30'
const browserApi =
  'public, max-age=0, must-revalidate, stale-while-revalidate=10'
const browserFeed = 'public, max-age=300, stale-while-revalidate=3600'
const browserOg = 'public, max-age=3600, stale-while-revalidate=30'

function pageHeaders(edgeMaxAge = 30, edgeSWR = 86400) {
  return [
    { key: 'Cache-Control', value: browserPage },
    {
      key: 'CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    {
      key: 'Vercel-CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    { key: 'Cloudflare-CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
  ]
}

function apiHeaders(edgeMaxAge = 10, edgeSWR = 60) {
  return [
    { key: 'Cache-Control', value: browserApi },
    {
      key: 'CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    {
      key: 'Vercel-CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    { key: 'Cloudflare-CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
  ]
}

function ogHeaders(edgeMaxAge = 3600, edgeSWR = 86400) {
  return [
    { key: 'Cache-Control', value: browserOg },
    {
      key: 'CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    {
      key: 'Vercel-CDN-Cache-Control',
      value: `max-age=${edgeMaxAge}, stale-while-revalidate=${edgeSWR}`,
    },
    { key: 'Cloudflare-CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
  ]
}

function feedHeaders(edgeMaxAge = 86400) {
  return [
    { key: 'Cache-Control', value: browserFeed },
    { key: 'CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
    { key: 'Vercel-CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
    { key: 'Cloudflare-CDN-Cache-Control', value: `max-age=${edgeMaxAge}` },
  ]
}

let nextConfig = {
  env: {
    COMMIT_HASH: commitHash,
    COMMIT_URL: commitUrl,
    BUILD_TIME: new Date().toISOString(),
  },

  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  assetPrefix: isProd ? env.ASSETPREFIX || undefined : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    // reactRemoveProperties: { properties: ['^data-id$', '^data-(\\w+)-id$'] },
  },
  experimental: {
    serverMinification: true,
    webpackBuildWorker: true,
    globalNotFound: true,
    turbopackImportTypeText: true,
  },
  images: {
    unoptimized:
      // Squoosh has memory leak issue, but it will remove in next.js 14.3.0
      // !process.env.VERCEL && isProd && eval('!process.env.NEXT_SHARP_PATH'),
      process.env.NODE_ENV !== 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox; style-src 'unsafe-inline';",
  },

  async headers() {
    return [
      { source: '/', headers: pageHeaders(30, 86400) },
      { source: '/notes', headers: pageHeaders(30, 86400) },
      { source: '/:locale/notes', headers: pageHeaders(60, 86400) },
      { source: '/posts', headers: pageHeaders(30, 86400) },
      { source: '/:locale/posts', headers: pageHeaders(30, 86400) },
      { source: '/posts/:path*', headers: pageHeaders(30, 86400) },
      { source: '/:locale/posts/:path*', headers: pageHeaders(30, 86400) },
      { source: '/notes/:path*', headers: pageHeaders(30, 86400) },
      { source: '/:locale/notes/:path*', headers: pageHeaders(30, 86400) },
      { source: '/og', headers: ogHeaders(3600, 86400) },
      { source: '/:locale/og', headers: ogHeaders(3600, 86400) },
      { source: '/api/:path*', headers: apiHeaders(10, 60) },
      { source: '/feed', headers: feedHeaders(86400) },
    ]
  },

  async redirects() {
    return [
      {
        source: '/notes/topics',
        destination: '/notes/series',
        permanent: true,
      },
      {
        source: '/notes/topics/:slug',
        destination: '/notes/series/:slug',
        permanent: true,
      },
      {
        source: '/:locale/notes/topics',
        destination: '/:locale/notes/series',
        permanent: true,
      },
      {
        source: '/:locale/notes/topics/:slug',
        destination: '/:locale/notes/series/:slug',
        permanent: true,
      },
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/atom.xml', destination: '/feed' },
        { source: '/feed.xml', destination: '/feed' },
        { source: '/sitemap.xml', destination: '/sitemap' },
      ],
    }
  },
  turbopack: {
    rules: codeInspectorPlugin({ bundler: 'turbopack', hotKeys: ['altKey'] }),
  },

  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    })

    config.plugins.push(
      codeInspectorPlugin({ bundler: 'webpack', hotKeys: ['altKey'] }),
    )

    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/source',
    })

    return config
  },
}

// if (env.SENTRY === 'true' && isProd) {
//   // @ts-expect-error
//   nextConfig = withSentryConfig(
//     nextConfig,
//     {
//       // For all available options, see:
//       // https://github.com/getsentry/sentry-webpack-plugin#options
//
//       // Suppresses source map uploading logs during build
//       silent: true,
//
//       org: 'inneis-site',
//       project: 'Shiro',
//     },
//     {
//       // For all available options, see:
//       // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
//
//       // Upload a larger set of source maps for prettier stack traces (increases build time)
//       widenClientFileUpload: true,
//
//       // Transpiles SDK to be compatible with IE11 (increases bundle size)
//       transpileClientSDK: true,
//
//       // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//       tunnelRoute: '/monitoring',
//
//       // Hides source maps from generated client bundles
//       hideSourceMaps: true,
//
//       // Automatically tree-shake Sentry logger statements to reduce bundle size
//       disableLogger: true,
//     },
//   )
// }

if (process.env.ANALYZE === 'true') {
  nextConfig = NextBundleAnalyzer({
    enabled: true,
  })(nextConfig)
}

export default withNextIntl(nextConfig)

function getRepoInfo() {
  if (process.env.VERCEL) {
    const { VERCEL_GIT_PROVIDER, VERCEL_GIT_REPO_SLUG, VERCEL_GIT_REPO_OWNER } =
      process.env

    switch (VERCEL_GIT_PROVIDER) {
      case 'github': {
        return {
          hash: process.env.VERCEL_GIT_COMMIT_SHA,
          url: `https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}/commit/${process.env.VERCEL_GIT_COMMIT_SHA}`,
        }
      }
    }
  } else {
    return getRepoInfoFromGit()
  }
}

function getRepoInfoFromGit() {
  try {
    // 获取最新的 commit hash
    // 获取当前分支名称
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim()
    // 获取当前分支跟踪的远程仓库名称
    const remoteName = execSync(`git config branch.${currentBranch}.remote`)
      .toString()
      .trim()
    // 获取当前分支跟踪的远程仓库的 URL
    let remoteUrl = execSync(`git remote get-url ${remoteName}`)
      .toString()
      .trim()

    // 获取最新的 commit hash
    const hash = execSync('git rev-parse HEAD').toString().trim()
    // 转换 git@ 格式的 URL 为 https:// 格式
    if (remoteUrl.startsWith('git@')) {
      remoteUrl = remoteUrl
        .replace(':', '/')
        .replace('git@', 'https://')
        .replace('.git', '')
    } else if (remoteUrl.endsWith('.git')) {
      // 对于以 .git 结尾的 https URL，移除 .git
      remoteUrl = remoteUrl.slice(0, -4)
    }

    // 根据不同的 Git 托管服务自定义 URL 生成规则
    let webUrl
    if (remoteUrl.includes('github.com')) {
      webUrl = `${remoteUrl}/commit/${hash}`
    } else if (remoteUrl.includes('gitlab.com')) {
      webUrl = `${remoteUrl}/-/commit/${hash}`
    } else if (remoteUrl.includes('bitbucket.org')) {
      webUrl = `${remoteUrl}/commits/${hash}`
    } else {
      // 对于未知的托管服务，可以返回 null 或一个默认格式
      webUrl = `${remoteUrl}/commits/${hash}`
    }

    return { hash, url: webUrl }
  } catch (error) {
    console.error('Error fetching repo info:', error?.stderr?.toString())
    return null
  }
}
