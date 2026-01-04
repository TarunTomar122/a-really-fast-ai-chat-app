import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Search, PanelLeftClose, Moon, Sun } from 'lucide-react'
import { Button } from './ui/Button'
import { ScrollArea } from './ui/ScrollArea'
import { Input } from './ui/Input'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

export default function Sidebar({ isOpen, onToggle }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { threadId } = useParams()
  const [threads, setThreads] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadThreads()
    window.addEventListener('storage', loadThreads)
    return () => window.removeEventListener('storage', loadThreads)
  }, [])

  const loadThreads = () => {
    const savedThreads = localStorage.getItem('chat-threads')
    if (savedThreads) {
      const parsedThreads = JSON.parse(savedThreads)
      // Sort by updatedAt (most recent first)
      const sortedThreads = parsedThreads.sort((a, b) => b.updatedAt - a.updatedAt)
      setThreads(sortedThreads)
    }
  }

  const createNewChat = () => {
    navigate('/')
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  const deleteThread = (threadIdToDelete, e) => {
    e.stopPropagation() // Prevent navigating to the thread
    
    const threads = JSON.parse(localStorage.getItem('chat-threads') || '[]')
    const filteredThreads = threads.filter(t => t.id !== threadIdToDelete)
    // Sort by updatedAt (most recent first)
    const sortedThreads = filteredThreads.sort((a, b) => b.updatedAt - a.updatedAt)
    localStorage.setItem('chat-threads', JSON.stringify(sortedThreads))
    
    // Update state directly - no need for storage event since we're already here
    setThreads(sortedThreads)
    
    // If we're deleting the currently active thread, navigate to home
    if (threadId === threadIdToDelete) {
      navigate('/')
    }
  }

  const groupThreadsByDate = (threads) => {
    const now = new Date()
    const today = []
    const yesterday = []
    const last7Days = []
    const last30Days = []
    const older = []

    threads.forEach(thread => {
      const threadDate = new Date(thread.updatedAt)
      const diffDays = Math.floor((now - threadDate) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) today.push(thread)
      else if (diffDays === 1) yesterday.push(thread)
      else if (diffDays < 7) last7Days.push(thread)
      else if (diffDays < 30) last30Days.push(thread)
      else older.push(thread)
    })

    return [
      { label: 'Today', threads: today },
      { label: 'Yesterday', threads: yesterday },
      { label: 'Last 7 Days', threads: last7Days },
      { label: 'Last 30 Days', threads: last30Days },
      { label: 'Older', threads: older }
    ].filter(group => group.threads.length > 0)
  }

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedThreads = groupThreadsByDate(filteredThreads)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-border flex flex-col bg-card transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between">
            <a className="text-lg font-semibold px-2 cursor-pointer" href="/">Gemini</a>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden lg:flex"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="lg:hidden"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-2 my-2">
          <div className="space-y-4 pb-4">
            {groupedThreads.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.threads.map((thread) => (
                    <div
                      key={thread.id}
                      className={cn(
                        "group relative w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer",
                        threadId === thread.id && "bg-accent"
                      )}
                      onClick={() => {
                        navigate(`/chat/${thread.id}`)
                        // Close sidebar on mobile after selecting a thread
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 pr-6">
                          <p className="text-sm truncate">
                            {thread.title || 'New Chat'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteThread(thread.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
        <Button 
            onClick={createNewChat} 
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>
    </>
  )
}

