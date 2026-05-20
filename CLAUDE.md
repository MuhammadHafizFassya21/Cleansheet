# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 template with shadcn/ui components and sidebar layout. Uses App Router, TypeScript, and Tailwind CSS v4.

## Commands

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server  
npm run start

# Lint
npm run lint
```

## Architecture

### Path Mapping
- `@/*` → `./src/*` - Always use this for imports

### Project Structure
- **App Router**: Pages and layouts in `src/app/`
- **Components**: Custom components in `src/components/`, UI primitives in `src/components/ui/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Utilities**: Helper functions in `src/lib/utils.ts`

### Key Patterns

**Sidebar System**
- Main layout wraps content with `SidebarProvider` from `@/components/ui/sidebar`
- `AppSidebar` component handles navigation structure
- Mobile responsive with sheet overlay
- State persisted via cookies

**Component Development**
- shadcn/ui components are in `src/components/ui/` - add new ones via shadcn CLI, not manually
- Use `cn()` from `@/lib/utils` for conditional classNames
- Components use CSS variables for theming (defined in `globals.css`)

**Styling**
- Tailwind CSS v4 with PostCSS
- CSS custom properties for design tokens
- New York style from shadcn/ui
- Lucide icons for iconography

## Important Notes

1. **No testing framework** currently set up
2. **Turbopack** used in development for faster builds
3. **TypeScript strict mode** is enabled
4. **React Server Components** enabled for shadcn/ui