# thom-chat

Clone of [T3 Chat](https://t3.chat/)

## 🚀 Features

- Fast chat goes brrrr
- Self-hostable

## 🛠️ Tech Stack

- **Framework**: SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind
- **Components**: Melt UI (next-gen)
- **Testing**: Humans
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Formatting**: Prettier

### Discussion

- Vercel SDK?
  - Nah, too limited

## 📦 Self-hosting

IDK, calm down

## TODO

- [x] Login & Auth
- [x] useCachedQuery
- [x] Convex schemas for chats
- [x] Actual fucking UI for chat
- [ ] Providers (BYOK)
  - [x] Openrouter
  - ~[ ] HuggingFace~
  - ~[ ] OpenAI~
- [ ] File upload
- [x] Ensure responsiveness
- [ ] File support
- [x] Streams on the server
- [x] Syntax highlighting with Shiki/markdown renderer
- [ ] Eliminate FOUC
- [ ] Cascade deletes and shit in Convex
- [ ] Error notification central, specially for BYOK models like o3
- [ ] Google Auth
- [ ] Fix light mode (urgh)
- [ ] Privacy mode

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
