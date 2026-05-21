# AGENT_RULES.md

This repository contains a Next.js application located in the `frontend/` directory. When working on the project, please follow the guidelines below so that the development experience — in particular Hot Module Replacement (HMR) — continues to work smoothly.

## 1. Use the Development Server, **not** `npm run build`

* **Always use `npm run dev` (or `pnpm dev`, `yarn dev`, etc.)** while iterating on the application. This starts Next.js in development mode with hot-reload enabled.
* **Do _not_ run `npm run build` inside the agent session.** Running the production build command switches the `.next` folder to production assets which disables hot reload and can leave the development server in an inconsistent state. If a production build is required, do it outside of the interactive agent workflow.

## 2. Keep Dependencies in Sync

If you add or update dependencies remember to:

1. Update the appropriate lockfile (`package-lock.json`, etc.).
2. Re-start the development server so that Next.js picks up the changes.

## 3. Coding Conventions

* Prefer TypeScript (`.tsx`/`.ts`) for new components and utilities.
* Co-locate component-specific styles in the same folder as the component when practical.
