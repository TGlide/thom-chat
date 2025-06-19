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
- Enhance prompt button
- Chat branching

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

### Extra

- [ ] Regenerate message
- ~[ ] Image generation~
- [ ] 404 page/redirect
- ~[ ] Test link with free credits~

### Final push

- [ ] make things prettier
- [ ] mobile adjustments
- [ ] cloud per chat persistance
