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
- [ ] Providers (BYOK)
  - [x] Openrouter
  - [ ] HuggingFace
  - [ ] OpenAI
- [ ] File upload
- [x] Ensure responsiveness
- [x] Streams on the server (Resumable streams)
- [x] Syntax highlighting with Shiki/markdown renderer
- [ ] Eliminate FOUC
- [x] Cascade deletes
- [ ] Error notification central, specially for BYOK models like o3
- [ ] Google Auth
- [ ] Fix light mode (urgh)
- [ ] Streamer mode

### Chat

- [x] loading state
- [ ] deal with error states, both on creation attempt and message generation failure
- [x] delete conversations option
- [x] conversation title generation
- [ ] kbd powered popover model picker
- [x] autosize

### Extra

- [ ] Web Search
- [ ] MCPs
- [ ] Chat branching
- [ ] Image generation
- [ ] Chat sharing
- [ ] 404 page/redirect
- [ ] Test link with free credits
- [x] Cursor-like Rules (@ieedan's idea!)
