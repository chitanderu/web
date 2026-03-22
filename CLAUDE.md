# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Yohaku" (余白) - a private/closed-source iteration of the MX-Space blog system. It's a pnpm + Turborepo monorepo containing a Next.js-based personal blogging platform with advanced features including:

- Personal blog with posts, notes, pages, and "thinking" entries
- Real-time features with Socket.IO
- Activity tracking and owner status
- Comment system with authentication
- Search functionality powered by Algolia
- Dashboard for content management
- Theme customization with accent colors
- RSS feeds and sitemap generation

## Architecture

### Tech Stack
- **Monorepo**: pnpm workspaces + Turborepo
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom semantic theme tokens + UIKit-inspired colors
- **State Management**: Jotai for client state
- **Data Fetching**: TanStack Query (React Query)
- **API**: Custom API client from `@shiro/fetch` package
- **Authentication**: better-auth + custom token system
- **Animation**: Motion (Framer Motion) with lazy loading
- **Icons**: Tailwind CSS Icons with Mingcute and Material Symbols collections

### Project Structure
```
Shiroi/
├── apps/
│   └── web/                    # Next.js main application (@shiro/web)
│       ├── src/
│       │   ├── app/            # Next.js App Router pages and API routes
│       │   ├── components/     # React components (common/, layout/, modules/, ui/)
│       │   ├── providers/      # Context providers for state management
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utility functions and configurations
│       │   └── queries/        # TanStack Query definitions and hooks
│       ├── public/
│       ├── next.config.mjs
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── fetch/                  # @shiro/fetch - Custom API client
│   └── types/                  # shiro-types - Shared type definitions
├── package.json                # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── eslint.config.mjs
```

### Component Architecture
- Uses functional components with hooks
- Component composition with provider pattern
- Tailwind variants for styling with `tailwind-variants`
- Motion components for animations
- Modular UI components following atomic design principles

### State Management
- **Jotai**: Client-side state atoms (owner status, UI state, etc.)
- **TanStack Query**: Server state management and caching
- **Context Providers**: Feature-specific state (current note/post data)

### API & Data Fetching
- Custom API client (`@shiro/fetch`) that extends the MX-Space API
- TanStack Query for data fetching with proper caching
- Server-side data fetching for initial page loads
- Real-time updates via Socket.IO

## Development Commands

```bash
# Monorepo-wide (via Turborepo)
pnpm dev                 # Start all dev servers
pnpm build               # Build all packages
pnpm lint                # Lint all packages

# Web app specific
pnpm --filter @shiro/web dev       # Start Next.js dev server on port 2323
pnpm --filter @shiro/web build     # Production build
pnpm --filter @shiro/web lint      # ESLint with auto-fix

# Packages
pnpm --filter @shiro/fetch build          # Build fetch package
```

## Configuration Files

- **apps/web/next.config.mjs**: Next.js configuration with bundle analysis, image optimization, custom webpack config
- **apps/web/src/styles/tailwindcss.css**: Tailwind CSS v4 CSS-first config, semantic theme tokens, UIKit colors, plugins
- **eslint.config.mjs**: ESLint configuration using `@lobehub/lint` (root level)
- **apps/web/tsconfig.json**: TypeScript configuration
- **turbo.json**: Turborepo task pipeline configuration
- **pnpm-workspace.yaml**: Workspace package definitions

## Code Conventions

### Component Patterns
- Use `'use client'` directive for client components
- Export components as named exports when possible
- Use Tailwind variants with `tailwind-variants` library
- Implement proper loading states and error boundaries

### Color System & Theming
- **Dynamic Accent Colors**: Uses `AccentColorStyleInjector` with predefined color palettes for light/dark themes
  - Light theme: 浅葱 (`#33A6B8`), warm colors with 40-70% lightness
  - Dark theme: 桃 (`#F596AA`), complementary colors with 20-50% lightness
- **Neutral Scale (Pure)**: True gray 1-10, 3-tier, auto-inverts in dark mode. See `docs/neutral-color-spec.md`
  - **Tier 1 (1-4)**: Surface/fill — never for text
  - **Tier 2 (5-7)**: Border/icon/secondary text — n-5 no text, n-6 small text only, n-7 secondary text
  - **Tier 3 (8-10)**: Body/heading — n-9 is the default body color
  - `neutral-50~950` is banned
- **UIKit-inspired Color Palette**: Complete semantic color system (primary, secondary, tertiary, etc.)
- **CSS Variables**: Uses OKLCH color space for consistent color manipulation via `--a` variable
- **Page-specific Gradients**: `PageColorGradient` component creates dynamic background gradients based on content seed or base color
- **Noise Textures**: Background texture generation using PNG noise patterns with chroma.js color mixing
- **Material Design Backdrop**: Multiple backdrop blur levels (thick, default, thin, ultrathin) for glassmorphism effects

### Styling Conventions
- Tailwind CSS classes with custom semantic theme tokens
- UIKit-inspired color system with light/dark theme support
- Use `clsx` for conditional class names
- Consistent spacing and typography scales
- Access dynamic theme colors via `theme(colors.accent)` in CSS
- Custom CSS variables for gradients: `--gradient-from` and `--gradient-to`

### State Management Patterns
- Use Jotai atoms for simple client state
- TanStack Query for server state with proper keys
- Context providers for feature-specific data sharing
- Custom hooks for complex state logic

### API Patterns
- Use the custom `apiClient` from `@shiro/fetch`
- Define query keys in `apps/web/src/queries/keys/`
- Implement proper error handling and loading states
- Use Server Components for initial data fetching when possible

## Testing & Quality

- ESLint configuration with React and Next.js rules
- Prettier formatting (handled by lint-staged)
- Pre-commit hooks with simple-git-hooks
- Bundle size monitoring with Next.js bundle analyzer

## Key Dependencies

### Core
- `next` - Next.js framework
- `react` & `react-dom` - React 19
- `typescript` - TypeScript support
- `turbo` - Turborepo build system

### Styling & UI
- `tailwindcss` - Utility-first CSS
- `clsx` - Conditional classes
- `tailwind-variants` - Component variants

### State & Data
- `jotai` - State management
- `@tanstack/react-query` - Server state
- `motion` - Animations

### Content & Features
- `markdown-to-jsx` - Markdown rendering
- `socket.io-client` - Real-time features
- `better-auth` - Authentication
- Various content processing libraries (KaTeX, Shiki, etc.)

## Related Projects

- **mx-core** — Backend API server (NestJS + MongoDB), located at `../mx-core`
- **admin-vue3** — Dashboard (Vue 3), located at `../admin-vue3`
- **haklex (standalone)** — `../haklex` — extracted standalone repo for independent editor development

### haklex Rich Editor Integration

`@haklex/*` packages are an independent repo (`../haklex`)，published to npm. Shiroi consumes them as npm dependencies, not workspace links.

- Shiroi web app (`@shiro/web`) uses `@haklex/rich-editor`, `@haklex/rich-kit-shiro`, `@haklex/rich-static-renderer` for rich text editing and rendering
- Version updates: bump pinned versions in `apps/web/package.json` after haklex publishes a new release
- See `../haklex/CLAUDE.md` for full editor architecture docs
