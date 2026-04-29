<p align="center">
  <img src="gemma-extruded-app.png" alt="Gemma Chat" width="180" />
</p>

<h1 align="center">Gemma Chat</h1>

<p align="center">
  <strong>Vibe code from a desktop app.</strong><br/>
  A coding agent powered by Google's Gemini API.<br/>
  Bring your own API key.
</p>

---

<img width="960" height="593" alt="Gemma4-Vibecoding" src="https://github.com/user-attachments/assets/b4149e63-48df-456e-8007-c607b7d46f37" />


## The Idea

What if your coding assistant lived in a dedicated desktop app instead of another browser tab?

**Gemma Chat** is an open-source Electron app that uses Gemini API models for chat and coding tasks. You describe what you want to build, and it writes the code — HTML, CSS, JavaScript, multi-file projects — with a live preview that updates as the model types.

It keeps the app shell, workspace, preview server, and local speech-to-text on your machine, while the model itself runs through the Gemini Developer API.

## How It Works

1. **Describe what you want to build** — "A retro calculator app" or "A landing page for a coffee shop"
2. **Watch it code** — the agent writes files character-by-character with a live preview
3. **Iterate** — Ask for changes, it edits the files and the preview updates in real-time

The app shell, workspace sandbox, and speech-to-text run locally. Model inference happens through the Gemini Developer API.

## Features

- 🛠 **Build Mode** — Coding agent with a live preview canvas. Writes multi-file projects into a sandboxed workspace.
- 💬 **Chat Mode** — Conversational AI with tool use (web search, URL fetch, calculator, bash).
- 🔄 **Model Switching** — Switch model targets without changing the app flow.
- 🎤 **Voice Input** — Local speech-to-text via in-browser Whisper.
- 🔑 **Env-based Auth** — Reads `GEMINI_API_KEY` or `GOOGLE_API_KEY` from the environment.
- 📁 **Workspace Preview** — Generated files stream into a per-chat workspace with live preview, code view, and file browser.

## Available Models

| Model | Size | Best For |
|---|---|---|
| **Gemini 3 Flash Preview** | **API** | **Recommended.** Fast chat and coding tasks |

## Getting Started

**Requirements:** Node 20+ and a Gemini API key.

```bash
git clone https://github.com/dyglo/deplyze-chat.git
cd deplyze-chat
npm install
npm run dev
```

Set one of these environment variables before launch. The app reads them from the process environment and also supports a local `.env` file in the project root:

```bash
export GEMINI_API_KEY=your_key_here
# or
export GOOGLE_API_KEY=your_key_here
```

Example `.env`:

```bash
GEMINI_API_KEY=your_key_here
```

If you are on Windows PowerShell, you can also launch the dev app with:

```powershell
$env:GEMINI_API_KEY="your_key_here"
npm run dev
```

### Building a Distributable

```bash
npm run dist
```

Build output is generated in `dist/` using Electron Builder for your current platform.

## Tech Stack

| Layer | Tech |
|---|---|
| App Shell | Electron + Vite + React 19 + TypeScript + Tailwind |
| Model Runtime | Gemini Developer API via `@google/genai` |
| Speech-to-Text | transformers.js (Whisper, runs in-browser via WASM) |
| Workspace | Per-conversation sandboxed filesystem + local HTTP server |

## Architecture

```
src/
├── main/              Electron main process
│   ├── index.ts       Window + IPC + agent loop
│   ├── gemini.ts      Gemini API client / validation / chat streaming
│   ├── workspace.ts   Per-conversation workspace + static file server
│   └── tools.ts       Tool definitions + system prompts + XML action parser
├── preload/           contextBridge API surface
├── renderer/src/
│   ├── components/
│   │   ├── Setup.tsx      First-run onboarding + download progress
│   │   ├── Chat.tsx       Main layout + model switcher
│   │   ├── Canvas.tsx     Preview / Code / Files tabs (Build mode)
│   │   ├── Message.tsx    Chat bubbles + tool cards + activity bar
│   │   ├── Composer.tsx   Input + mic button
│   │   └── Sidebar.tsx    Conversation list
│   └── lib/whisper.ts     Browser Whisper pipeline
└── shared/types.ts    IPC types + model registry
```

### Under the Hood

**Agent Loop** — In Build mode, each assistant turn streams tokens from the Gemini API. XML `<action>` blocks are parsed from the stream, executed (file writes, bash commands, etc.), and results are fed back for the next turn. Up to 40 rounds per user message.

**Live Streaming** — As the model generates file content, partial writes are flushed to disk every ~450ms. The preview iframe reloads in real-time so you watch the page build itself.

**Tool Protocol** — Small models handle XML more reliably than JSON function calling, so tools are invoked via an XML-based format:

```xml
<action name="write_file">
<path>index.html</path>
<content>
<!doctype html>
...
</content>
</action>
```

**Environment Loading** — The Gemini client checks `GEMINI_API_KEY` first, then `GOOGLE_API_KEY`, and also loads values from a project-root `.env` file for local development.

## Credits

- [Gemini API](https://ai.google.dev/gemini-api/docs) by Google DeepMind
- [Electron](https://www.electronjs.org/)
- [transformers.js](https://github.com/huggingface/transformers.js) by Hugging Face

Created by [@ammaar](https://x.com/ammaar) and AI :) 

## License

MIT
