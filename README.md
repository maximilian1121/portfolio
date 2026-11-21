# Portfolio

A personal portfolio built with Next.js App Router. It includes project, game,
blog, and tool pages, plus Supabase-backed sign-in and account features.

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project for authentication, profiles, and blog data

## Setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set the values for your Supabase
   project. The service role key is used only by the server-side account
   deletion route. Keep it private and never prefix it with `NEXT_PUBLIC_`.
3. Start the development server with `npm run dev`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Next.js in development mode with webpack |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

- `app/` contains Next.js routes, layouts, and route handlers.
- `features/` groups account, blog, game, tool, and transcription code by domain.
- `components/` contains shared auth, layout, explorer, error, and MDX UI.
- `hooks/` contains shared client and server authentication hooks.
- `utils/supabase/` contains browser and cookie-backed server clients.
- `types/` contains global TypeScript declarations.
- `workers/` contains the transcription Web Worker.
- `public/` contains static assets, including the FFmpeg WebAssembly core.

The media conversion pages require cross-origin isolation headers. Those headers
are configured in `next.config.ts` for the Shitify tool and its FFmpeg assets.
