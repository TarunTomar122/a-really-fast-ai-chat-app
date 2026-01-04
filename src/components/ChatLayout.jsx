import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { PanelLeft } from 'lucide-react'
import Sidebar from './Sidebar'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

export default function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check if desktop on mount
  useEffect(() => {
    const checkDesktop = () => {
      setIsSidebarOpen(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toggle button - always visible on mobile, hidden on desktop when sidebar is open */}
        <div className={cn(
          "border-b border-border p-2 flex items-center justify-between",
          "lg:hidden"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="w-2/3">
            <p className="text-sm text-muted-foreground">Chat with Gemini Flash 2.5</p>
          </div>
        </div>
        
        <Outlet />
      </main>
    </div>
  )
}

