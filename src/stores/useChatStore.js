import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChatStore = create(
    persist(
        (set, get) => ({
            // Separate thread metadata from messages
            threads: [], // Only metadata: {id, title, createdAt, updatedAt}
            messages: {}, // Messages by threadId: { [threadId]: [messages] }
            currentThreadId: null,

            isLoading: false,
            isStreaming: false,

            getCurrentMessages: () => {
                const { messages, currentThreadId } = get()
                return messages[currentThreadId] || []
            },
            getCurrentThread: () => {
                const { threads, currentThreadId } = get()
                return threads.find(t => t.id === currentThreadId)
            },

            // Thread actions
            createThread: (title) => {
                const threadId = Date.now().toString()
                const newThread = {
                    id: threadId,
                    title: title.substring(0, 50) || 'New Chat',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
                set(state => ({
                    threads: [...state.threads, newThread],
                    messages: { ...state.messages, [threadId]: [] },
                    currentThreadId: threadId
                }))

                return threadId
            },
            deleteThread: (threadId) => {
                set(state => {
                    const { [threadId]: deleted, ...remainingMessages } = state.messages
                    return {
                        threads: state.threads.filter(t => t.id !== threadId),
                        messages: remainingMessages,
                        currentThreadId: state.currentThreadId === threadId
                            ? null
                            : state.currentThreadId,
                    }
                })
            },

            loadThread: (threadId) => {
                set({ currentThreadId: threadId })
            },

            // Message actions
            addMessage: (message) => {
                set(state => {
                    const currentThreadId = state.currentThreadId
                    const currentMessages = state.messages[currentThreadId] || []
                    
                    return {
                        messages: {
                            ...state.messages,
                            [currentThreadId]: [...currentMessages, message]
                        }
                    }
                })
            },

            updateLastMessage: (content) => {
                set(state => {
                    const currentThreadId = state.currentThreadId
                    const currentMessages = state.messages[currentThreadId] || []
                    
                    if (currentMessages.length === 0) return state
                    
                    const updatedMessages = [...currentMessages]
                    updatedMessages[updatedMessages.length - 1] = {
                        ...updatedMessages[updatedMessages.length - 1],
                        content,
                    }
                    
                    return {
                        messages: {
                            ...state.messages,
                            [currentThreadId]: updatedMessages
                        }
                        // Don't update threads array to avoid Sidebar re-renders
                    }
                })
            },
            
            // Update thread timestamp (call this when conversation is complete if needed)
            updateThreadTimestamp: (threadId) => {
                set(state => ({
                    threads: state.threads.map(thread =>
                        thread.id === threadId
                            ? { ...thread, updatedAt: Date.now() }
                            : thread
                    )
                }))
            },
            
            setLoading: (isLoading) => set({ isLoading }),

            setStreaming: (isStreaming) => set({ isStreaming }),

            clearCurrentThread: () => set({ currentThreadId: null }),
        }),
        {
            name: 'chat-storage',
            version: 1,
            // Only persist threads, messages and currentThreadId, NOT isLoading/isStreaming
            partialize: (state) => ({
                threads: state.threads,
                messages: state.messages,
                currentThreadId: state.currentThreadId,
            }),
        }
    )
)