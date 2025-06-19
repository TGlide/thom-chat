<div align="center">
  <img src="static/favicon.png" alt="thom.chat" width="180" height="180">
  <h1>thom.chat</h1>
</div>

Clone of [T3 Chat](https://t3.chat/)

## 🚀 Features

- Cached query for fast chat loading
- Openrouter provider for access to 400+ models
- File uploads
- Web search
- Full-text search over your chat history
- Cursor-like rules
- Privacy mode for streams and screen-sharing
- Markdown rendered messages with syntax highlighting
- Chat sharing
- Keyboard shortcuts

## 🛠️ Tech Stack

- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind
- **Backend**: Convex
- **Auth**: BetterAuth + Convex
- **Components**: Melt UI (next-gen)
- **Testing**: Humans
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Formatting**: Prettier

## 📦 Running locally

1. Clone the repo
2. Install dependencies with `pnpm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run `pnpm dev`
5. Open [http://localhost:5173](http://localhost:5173)

## TODO

- [x] Login & Auth
- [x] useCachedQuery
- [x] Convex schemas for chats
- [x] Actual fucking UI for chat
- [x] Providers (BYOK)
  - [x] Openrouter
  - ~[ ] HuggingFace~
  - ~[ ] OpenAI~
- [x] File upload
- [x] Ensure responsiveness
- [x] Streams on the server (Resumable streams)
- [x] Syntax highlighting with Shiki/markdown renderer
- [x] Eliminate FOUC
- [x] Cascade deletes
- [x] Google Auth
- [x] Fix light mode (urgh)
- [x] Privacy mode

### Chat

- [x] loading state
- [x] deal with error states, both on creation attempt and message generation failure
- [x] delete conversations option
- [x] conversation title generation
- [x] kbd powered popover model picker
- [x] autosize
- [x] AbortController for message generation
- [x] Per route msg persistance

### Extra

- [x] Web Search
- [ ] Chat branching
- [ ] Regenerate message
- ~[ ] Image generation~
- [x] Chat sharing
- [ ] 404 page/redirect
- ~[ ] Test link with free credits~
- [x] Cursor-like Rules (@ieedan's idea!)
- [x] Full-text search

### Final push

- [x] Private mode for greeting
- [ ] Free mode
- [ ] make things prettier
- [ ] mobile adjustments
- [ ] cloud per chat persistance
