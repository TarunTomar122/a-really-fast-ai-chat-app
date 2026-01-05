# a really fast ai chat app

## context

The whole idea is to make something super minimal and **fast** for chatting with Gemini AI. No backend, no database drama, just pure frontend magic.

The app streams responses character by character which makes it feel really snappy and fun to use. Plus I added some quality of life features like being able to stop the AI mid-response, copy messages, and all that jazz.

----

## what's inside

- **Streaming responses** - characters appear one by one like a typewriter
- **Multiple chat threads** - create different conversations and switch between them
- **Search functionality** - find your old chats quickly
- **Stop button** - cancel AI responses mid-stream if you want
- **Auto-scroll control** - scroll to bottom button appears when you scroll up (no annoying forced scrolling during streaming)
- **Dark mode ready** - works with your system theme
- **Mobile responsive** - collapsible sidebar and all that
- **Copy messages** - one click to copy AI responses

----

## tech stack

Built with React + Vite because that's the fastest way to get started. Used Tailwind for styling (obviously) and shadcn/ui components for the UI bits. Everything is stored in localStorage so no server needed. The app talks directly to Gemini's API using their SDK.

**Stack:**
- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- Google Gemini API (Flash 2.5)
- React Router for navigation
- Zustand for state management
- localStorage for persistence (via Zustand persist middleware)

----

## how the re-render optimization works

So the main thing that makes this fast is how we handle state with Zustand. Basically we split thread metadata from the actual messages so components only re-render when they actually need to.

### The store structure

```javascript
{
  threads: [],      // just metadata: {id, title, createdAt, updatedAt}
  messages: {},     // actual messages: { [threadId]: [messages] }
  currentThreadId: null
}
```

By keeping these separate, when messages stream in only the `messages` object changes. The `threads` array stays the same so the Sidebar doesn't re-render.

### What each component subscribes to

**Sidebar**
```javascript
const threads = useChatStore((state) => state.threads)
```
Only gets thread metadata. Doesn't care about messages at all so it stays static during streaming.

**MessageList**
```javascript
const messages = useChatStore((state) => 
  state.currentThreadId && state.messages[state.currentThreadId] 
    ? state.messages[state.currentThreadId]
    : EMPTY_MESSAGES
)
```
Only subscribes to the current thread's messages. Uses a stable `EMPTY_MESSAGES` constant to avoid creating new array references.

**ChatInput**
```javascript
const isStreaming = useChatStore((state) => state.isStreaming)
```
Only cares about streaming state, nothing else.

### Other optimizations

- Individual messages are wrapped in `React.memo` so they only update if their content changes
- Functions selected from the store don't cause re-renders (they're stable references)
- Thread timestamps only update when the conversation completes, not during streaming

So basically when AI is streaming: MessageList updates to show new content, everything else stays static. That's it.

----

## setup

Okay so here's how you run this thing locally:

**1. Clone the repo**
```bash
git clone https://github.com/TarunTomar122/a-really-fast-ai-chat-app.git
cd a-really-fast-ai-chat-app
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a .env file**
```bash
# Create .env in the root directory
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

**4. Run it**
```bash
npm run dev
```

That's it! Open http://localhost:5173 and start chatting.

----

## potential improvements

Some things that could be better:  

**1. Handle reload/navigation during AI responses**

Right now if you reload the page or switch to another chat while the AI is responding, that response just gets lost. Should probably save partial responses to localStorage so they persist. Would need to track streaming state and resume properly.

**2. IndexDB instead of localStorage**

localStorage is fine for now but has a 5-10MB limit. With lots of chats and long conversations, you'd eventually hit that. IndexDB would be better for storing all the messages and threads. Plus it's faster for large datasets.

**3. Image input/output**

Gemini supports images but we're only doing text right now. Would be cool to:
- Let users upload images with their messages
- Show images in AI responses (Gemini can generate/analyze them)
- Handle image compression/storage properly

These would make the app more useful but honestly it works pretty well as is.

----

## contributing

If you want to contribute or found a bug, feel free to open an issue or PR. I'm pretty responsive on GitHub (most of the time).

----

## license

MIT - do whatever you want with it :)

