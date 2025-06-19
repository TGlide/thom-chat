<div align="center">
  <img src="static/favicon.png" alt="thom.chat" width="180" height="180">
  <h1>thom.chat</h1>
  <p><em>Open-source self-hostable T3 Chat.</em></p>

  <p>
    <img src="https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/Convex-FF6B6B?style=for-the-badge&logo=convex&logoColor=white" alt="Convex">
  </p>

  <p>
    <img src="https://img.shields.io/github/license/tglide/thom-chat?style=flat-square" alt="License">
    <img src="https://img.shields.io/github/stars/tglide/thom-chat?style=flat-square" alt="Stars">
    <img src="https://img.shields.io/github/forks/tglide/thom-chat?style=flat-square" alt="Forks">
    <img src="https://img.shields.io/github/issues/tglide/thom-chat?style=flat-square" alt="Issues">
  </p>
</div>

---

## ✨ About

**thom.chat** is an open-source alternative/clone to [T3 Chat](https://t3.chat/), built for [Theo's cloneathon](https://x.com/theo/status/1931515264497254402).

It is self-hostable, by self-hosting your own app and [https://www.convex.dev/](Convex) instance.

While thom.chat is a clone, the featureset is not identical to T3 Chat.

## 🎯 Key Features

### 🤖 **AI & Models**

- **400+ AI Models** via OpenRouter integration
- **Free Tier** with 10 messages using premium models
- **Unlimited Free Models** (models ending in `:free`)
- **Bring Your Own Key** for unlimited access

### 💬 **Chat Experience**

- **Real-time streaming** responses
- **Streaming on the server** for interruption-free chats, even when reloading
- **Chat branching** for exploring different conversation paths
- **Full-text search** across your entire chat history
- **Privacy mode** for secure screen sharing

### 📁 **Rich Content**

- **File uploads** with image support
- **Web search** integration for real-time information
- **Markdown rendering** with syntax highlighting
- **Chat sharing** with public links

### ⚡ **Productivity**

- **Cursor-like rules** for consistent AI behavior
- **Keyboard shortcuts** for power users
- **Enhance prompt** button for better prompts
- **Message regeneration** capabilities

## 🛠️ Tech Stack

<table>
<tr>
<td>

**Frontend**

- 🔥 SvelteKit
- 📝 TypeScript
- 🎨 Tailwind CSS
- 🍨 Melt UI Components

</td>
<td>

**Backend**

- 🔧 Convex Database
- 🔐 BetterAuth
- 🤖 OpenRouter API
- 🦾 Blood, sweat, and tears

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- OpenRouter API key (optional for free tier)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tglide/thom-chat.git
   cd thom-chat
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🎮 Usage

### Free Tier

- Sign up and get **10 free messages** with premium models
- Use **unlimited free models** (ending in `:free`)
- No credit card required

### Premium Features

- Add your own OpenRouter API key for unlimited access
- Access to all 400+ models

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [T3 Chat](https://t3.chat/)
- Built with [SvelteKit](https://kit.svelte.dev/)
- Powered by [OpenRouter](https://openrouter.ai/)
- Database by [Convex](https://convex.dev/)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/tglide">Thomas G. Lopes</a> and <a href="https://github.com/ieedan">Aidan Blesar</a></p>
  <p>
    <a href="https://thom.chat">🌐 Live Demo</a> •
    <a href="#-quick-start">📖 Documentation</a> •
    <a href="https://github.com/yourusername/thom-chat/issues">🐛 Report Bug</a> •
    <a href="https://github.com/yourusername/thom-chat/issues">💡 Request Feature</a>
  </p>
</div>

