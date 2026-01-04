import { useState, memo } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'

function ChatInput({ onSendMessage, onStop, isStreaming }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isStreaming) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleStop = (e) => {
    e.preventDefault()
    onStop()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming) {
        handleSubmit(e)
      }
    }
  }

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative rounded-xl border border-border bg-background shadow-sm py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isStreaming}
            className="min-h-[60px] max-h-[200px] border-0 bg-transparent px-4 py-2 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
            rows={2}
          />
          {isStreaming ? (
            <Button 
              type="button"
              onClick={handleStop}
              size="icon"
              variant="destructive"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
              title="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!message.trim()}
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

// Memoize to prevent re-renders during streaming
// Only re-renders when props (onSendMessage, disabled) actually change
export default memo(ChatInput)

