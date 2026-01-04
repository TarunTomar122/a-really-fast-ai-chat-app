# a really fast ai chat app

## context

So I built this chat app in like... a few hours? The whole idea was to make something super minimal and **fast** for chatting with Gemini AI. No backend, no database drama, just pure frontend magic.

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

Oh and I spent way too much time optimizing re-renders using React.memo and useCallback so the streaming is buttery smooth :)

**Stack:**
- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- Google Gemini API (Flash 2.5)
- React Router for navigation
- localStorage for persistence

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

## things i learned

This was a fun project to build because I got to mess around with streaming APIs and optimize React rendering. The biggest challenge was making sure only the streaming message re-renders and not the entire chat history (which would be super laggy).

----

## future plans (maybe)

- [ ] Export chat history
- [ ] Image attachments
- [ ] Better markdown support with syntax highlighting
- [ ] Voice input/output
- [ ] IndexDB for better storage

But honestly this works great as is so idk if i'll do any of these lol.

----

## contributing

If you want to contribute or found a bug, feel free to open an issue or PR. I'm pretty responsive on GitHub (most of the time).

----

## license

MIT - do whatever you want with it :)

