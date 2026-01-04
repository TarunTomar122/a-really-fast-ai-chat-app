import { useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { streamMessageFromGemini } from '@/lib/gemini'

export default function ChatView() {
  const { threadId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const currentThreadIdRef = useRef(null)
  const messagesRef = useRef(messages)
  const abortControllerRef = useRef(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (threadId) {
      loadThread(threadId)
      currentThreadIdRef.current = threadId
    } else {
      setMessages([])
      currentThreadIdRef.current = null
    }
  }, [threadId])

  const loadThread = (id) => {
    const threads = JSON.parse(localStorage.getItem('chat-threads') || '[]')
    const thread = threads.find(t => t.id === id)
    if (thread) {
      setMessages(thread.messages || [])
    }
  }

  const saveThread = (newMessages) => {
    const threads = JSON.parse(localStorage.getItem('chat-threads') || '[]')
    
    // Use ref to persist threadId across multiple saveThread calls
    if (!currentThreadIdRef.current) {
      currentThreadIdRef.current = threadId || Date.now().toString()
    }
    const currentThreadId = currentThreadIdRef.current
    
    const existingThreadIndex = threads.findIndex(t => t.id === currentThreadId)
    const isNewThread = existingThreadIndex < 0
    
    const threadData = {
      id: currentThreadId,
      title: newMessages[0]?.content.substring(0, 50) || 'New Chat',
      messages: newMessages,
      updatedAt: Date.now()
    }

    if (existingThreadIndex >= 0) {
      threads[existingThreadIndex] = threadData
    } else {
      threads.push(threadData)
    }

    // Sort threads by updatedAt (most recent first)
    threads.sort((a, b) => b.updatedAt - a.updatedAt)

    localStorage.setItem('chat-threads', JSON.stringify(threads))
    
    if (!threadId) {
      navigate(`/chat/${currentThreadId}`, { replace: true })
    }

    // Only trigger sidebar refresh when creating a NEW thread
    // Don't refresh on every message update (optimization!)
    if (isNewThread) {
      window.dispatchEvent(new Event('storage'))
    }
  }

  // Stop streaming handler
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [])

  // useCallback ensures stable function reference
  // Prevents ChatInput from re-rendering during streaming
  const handleSendMessage = useCallback(async (content) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    }

    // Use ref to get current messages without depending on messages state
    const newMessages = [...messagesRef.current, userMessage]
    setMessages(newMessages)
    setIsLoading(true)
    setIsStreaming(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Create a placeholder AI message that will be updated as chunks arrive
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }

    // Don't add the AI message yet - wait for first chunk
    try {
      let fullResponse = ''
      let isFirstChunk = true
      
      // Pass the entire conversation history to maintain context
      for await (const chunk of streamMessageFromGemini(newMessages)) {
        // Check if aborted
        if (signal.aborted) {
          break
        }

        fullResponse += chunk
        
        // On first chunk: hide loading indicator and add AI message
        if (isFirstChunk) {
          setIsLoading(false)
          setMessages([...newMessages, { ...aiMessage, content: fullResponse }])
          isFirstChunk = false
        } else {
          // For subsequent chunks: just update the content
          // flushSync needed for streaming UX (forces immediate render)
          flushSync(() => {
            setMessages(prevMessages => {
              const updated = [...prevMessages]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: fullResponse
              }
              return updated
            })
          })
        }
      }
      
      // Save whatever we got (even if stopped early)
      const finalMessages = [...newMessages, { ...aiMessage, content: fullResponse }]
      saveThread(finalMessages)
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: 'Sorry, I encountered an error.',
        timestamp: Date.now(),
        isError: true
      }
      const updatedMessages = [...newMessages, errorMessage]
      setMessages(updatedMessages)
      saveThread(updatedMessages)
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [threadId, navigate])

  return (
    <div className="flex flex-col h-full pt-8">
      <MessageList 
        messages={messages} 
        isLoading={isLoading}
        threadId={threadId}
      />
      <ChatInput 
        onSendMessage={handleSendMessage} 
        onStop={handleStopStreaming}
        isStreaming={isStreaming} 
      />
    </div>
  )
}

