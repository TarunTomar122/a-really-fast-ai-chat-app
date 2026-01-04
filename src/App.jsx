import { Routes, Route } from 'react-router-dom'
import ChatLayout from './components/ChatLayout'
import ChatView from './components/ChatView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatLayout />}>
        <Route index element={<ChatView />} />
        <Route path="chat/:threadId" element={<ChatView />} />
      </Route>
    </Routes>
  )
}

export default App

