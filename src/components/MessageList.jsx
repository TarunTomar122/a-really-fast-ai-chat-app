import { useEffect, useRef, memo, useState } from 'react'
import { Copy, Check, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from './ui/ScrollArea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Memoized User Message Component - only re-renders if props change
const UserMessage = memo(({ content }) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="bg-secondary/100 rounded-xl px-4 py-3 max-w-[80%]">
        <p className="text-m whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>
    </div>
  )
})
UserMessage.displayName = 'UserMessage'

// Memoized AI Message Component - handles its own copy state
const AIMessage = memo(({ content, isError }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      // Auto-reset after 2 seconds
      setTimeout(() => setIsCopied(false), 1000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex gap-3 group mb-6">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none overflow-x-auto break-words",
          isError && "text-destructive"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        
        {content && (
          <button
            onClick={handleCopy}
            className="self-start opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1.5 bg-background border border-border rounded-md hover:bg-accent flex items-center gap-1.5 text-xs"
            title={isCopied ? "Copied!" : "Copy message"}
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
})
AIMessage.displayName = 'AIMessage'

function MessageList({ messages, isLoading, threadId }) {
  const bottomRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const prevMessageCountRef = useRef(messages.length)

  // Auto-scroll when threadId changes (navigating between chats)
  useEffect(() => {
    // Use setTimeout to ensure content is rendered before scrolling
    const timer = setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [threadId])

  // Auto-scroll when a new message is added (user message or first AI chunk)
  // But don't auto-scroll during streaming (when just content updates)
  useEffect(() => {
    const currentCount = messages.length
    const prevCount = prevMessageCountRef.current

    // If message count increased, scroll to bottom
    if (currentCount > prevCount) {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
    }

    prevMessageCountRef.current = currentCount
  }, [messages.length])

  // Check if user has scrolled away from bottom
  const handleScroll = (e) => {
    const element = e.target
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setShowScrollButton(!isAtBottom && messages.length > 0)
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Chat with Gemini Flash 2.5</h2>
            <p className="text-muted-foreground mt-2">
              Start a conversation by typing a message below
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative min-h-0">
      <ScrollArea className="absolute inset-0 p-4" onScroll={handleScroll} ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                <UserMessage content={message.content} />
              ) : (
                <AIMessage 
                  content={message.content}
                  isError={message.isError}
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="rounded-lg px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-background border border-border rounded-full p-2 px-4 shadow-lg hover:bg-accent transition-colors flex flex-row items-center gap-2"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />            
            <p>Scroll to bottom</p>
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(MessageList)

