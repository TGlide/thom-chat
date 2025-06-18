# thom-chat

Clone of [T3 Chat](https://t3.chat/)

## 🚀 Features

- Fast chat goes brrrr
- Self-hostable

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

## 📦 Self-hosting

TODO: test self-hosting, including Convex self-hosting perhaps
TODO: add instructions

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
- [ ] Eliminate FOUC
- [x] Cascade deletes
- [ ] Google Auth
- [ ] Fix light mode (urgh)
- [x] Privacy mode

### Chat

- [x] loading state
- [x] deal with error states, both on creation attempt and message generation failure
- [x] delete conversations option
- [x] conversation title generation
- [x] kbd powered popover model picker
- [x] autosize
- [x] AbortController for message generation
- [ ] Per route msg persistance

### Extra

- [x] Web Search
- [ ] Chat branching
- [ ] Regenerate message
- ~[ ] Image generation~
- [x] Chat sharing
- [ ] 404 page/redirect
- ~[ ] Test link with free credits~
- [x] Cursor-like Rules (@ieedan's idea!)
