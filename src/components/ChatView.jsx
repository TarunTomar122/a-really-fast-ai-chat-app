import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { streamMessageFromGemini } from '@/lib/gemini'
import { useChatStore } from '@/stores/useChatStore'

export default function ChatView() {
  
  const { threadId } = useParams()
  const navigate = useNavigate()
  const abortControllerRef = useRef(null)

  // Get store actions
  const createThread = useChatStore(state => state.createThread)
  const addMessage = useChatStore(state => state.addMessage)
  const updateLastMessage = useChatStore(state => state.updateLastMessage)
  const updateThreadTimestamp = useChatStore(state => state.updateThreadTimestamp)
  const setLoading = useChatStore(state => state.setLoading)
  const setStreaming = useChatStore(state => state.setStreaming)
  const loadThread = useChatStore(state => state.loadThread)
  const clearCurrentThread = useChatStore(state => state.clearCurrentThread)
  const getCurrentMessages = useChatStore(state => state.getCurrentMessages)

  // Load thread when threadId changes
  useEffect(() => {
    if (threadId) {
      loadThread(threadId)
    } else {
      clearCurrentThread()
    }
  }, [threadId, loadThread, clearCurrentThread])

  // Stop streaming handler
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setLoading(false)
      setStreaming(false)
    }
  }

  // Send message handler
  const handleSendMessage = async (content) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    }

    // If no thread exists, create one and navigate to it
    let currentThreadId = threadId
    const isNewThread = !currentThreadId
    if (!currentThreadId) {
      currentThreadId = createThread(content)
      navigate(`/chat/${currentThreadId}`, { replace: true })
    }

    // Add user message
    addMessage(userMessage)
    // Update thread timestamp immediately to reorder in sidebar (skip for new threads, already set)
    if (!isNewThread) {
      updateThreadTimestamp(currentThreadId)
    }
    setLoading(true)
    setStreaming(true)

    // Create abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Create AI message
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }

    try {
      let fullResponse = ''
      let isFirstChunk = true

      // Get current conversation history
      const conversationHistory = getCurrentMessages()

      // Stream response
      for await (const chunk of streamMessageFromGemini(conversationHistory)) {
        // Check if aborted
        if (signal.aborted) {
          break
        }

        fullResponse += chunk

        // On first chunk: add AI message
        if (isFirstChunk) {
          setLoading(false)
          addMessage({ ...aiMessage, content: fullResponse })
          isFirstChunk = false
        } else {
          // Update existing message
          updateLastMessage(fullResponse)
        }
      }

      setStreaming(false)
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
      addMessage(errorMessage)
      setLoading(false)
      setStreaming(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-full pt-8">
      <MessageList />
      <ChatInput
        onSendMessage={handleSendMessage}
        onStop={handleStopStreaming}
      />
    </div>
  )
}