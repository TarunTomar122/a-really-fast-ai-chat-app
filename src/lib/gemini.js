import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API key from environment variable
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

// Convert our message format to Gemini's format
const formatMessagesForGemini = (messages) => {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }))
}

// Raw streaming - yields chunks as they arrive from Gemini
const streamMessageFromGeminiRaw = async function* (messages) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('No API key found. Please set VITE_GEMINI_API_KEY in your .env file')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Format messages for Gemini API
    const formattedMessages = formatMessagesForGemini(messages)
    
    const result = await model.generateContentStream({
      contents: formattedMessages
    })
    
    // Gemini returns DELTA chunks (each chunk is new text only), not cumulative
    // So we just yield each chunk directly!
    for await (const chunk of result.stream) {
      try {
        const chunkText = chunk.text()
        if (chunkText) {
          yield chunkText
        }
      } catch (chunkError) {
        // If a single chunk fails, log it but don't stop the stream
        console.error('Error processing chunk:', chunkError)
        continue
      }
    }
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('Failed to get response from Gemini AI')
  }
}

// Character-by-character streaming simulator
// Takes chunks from Gemini and splits them into individual characters
// with a small delay for typewriter effect
export const streamMessageFromGemini = async function* (messages) {
  const CHAR_DELAY_MS = 0
  
  for await (const chunk of streamMessageFromGeminiRaw(messages)) {
    // Split chunk into individual characters
    for (const char of chunk) {
      yield char
      // Small delay between characters for typewriter effect
      await new Promise(resolve => setTimeout(resolve, CHAR_DELAY_MS))
    }
  }
}

// Non-streaming version - identical structure to streaming but returns full text at once
export const sendMessageToGemini = async (messages) => {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    throw new Error('No API key found. Please set VITE_GEMINI_API_KEY in your .env file')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Format messages for Gemini API (same as streaming version)
    const formattedMessages = formatMessagesForGemini(messages)
    
    // Use generateContent instead of generateContentStream
    const result = await model.generateContent({
      contents: formattedMessages
    })
    
    const response = await result.response
    const text = response.text()
    
    return text
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('Failed to get response from Gemini AI')
  }
}
