import { useState, useEffect } from 'react'

interface LoadingMessage {
  id: number
  text: string
  duration: number
}

const PostLoginLoader = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const messages: LoadingMessage[] = [
    { id: 1, text: 'Initializing system...', duration: 800 },
    { id: 2, text: 'Loading user permissions...', duration: 700 },
    { id: 3, text: 'Setting up dashboard...', duration: 600 },
    { id: 4, text: 'Almost ready...', duration: 500 },
    { id: 5, text: 'Welcome to Metahuman!', duration: 400 }
  ]

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      return
    }

    const currentMessage = messages[currentMessageIndex]
    let charIndex = 0
    setDisplayText('')
    setIsTyping(true)

    const typingInterval = setInterval(() => {
      if (charIndex < currentMessage.text.length) {
        setDisplayText(currentMessage.text.substring(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)
        
        // Wait for message duration then move to next
        setTimeout(() => {
          setCurrentMessageIndex(prev => prev + 1)
        }, currentMessage.duration)
      }
    }, 50) // Typing speed

    return () => clearInterval(typingInterval)
  }, [currentMessageIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <style>{`
        @keyframes blinkCursor {
          50% {
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .loading-dots::after {
          content: '';
          animation: pulse 1.5s infinite;
        }
      `}</style>
      
      <div className="terminal-loader relative overflow-hidden rounded border border-gray-700 bg-gray-900 font-mono text-base text-green-400 shadow-xl" style={{ width: '20em', padding: '2em 1.5em' }}>
        {/* Terminal Header */}
        <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-between rounded-t bg-gray-700 px-3">
          <div className="text-sm text-gray-300">Metahuman Console</div>
          <div className="flex space-x-1">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4 mt-8">
          <div className="mb-2 text-xs text-gray-400">
            Loading Progress: {Math.round(((currentMessageIndex + 1) / messages.length) * 100)}%
          </div>
          <div className="h-1 w-full bg-gray-700 rounded">
            <div 
              className="h-1 bg-green-500 rounded transition-all duration-300 ease-out"
              style={{ width: `${((currentMessageIndex + 1) / messages.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Terminal Content */}
        <div className="space-y-2">
          {/* Previous messages */}
          {messages.slice(0, currentMessageIndex).map((message) => (
            <div key={message.id} className="text-gray-500">
              <span className="text-green-600">$</span> {message.text}
              <span className="ml-2 text-green-600">✓</span>
            </div>
          ))}
          
          {/* Current message */}
          {currentMessageIndex < messages.length && (
            <div className="flex items-center">
              <span className="text-green-600">$</span>
              <span className="ml-1">{displayText}</span>
              {isTyping && (
                <span className="ml-1 inline-block w-2 h-5 bg-green-400" style={{ animation: 'blinkCursor 1s infinite' }}></span>
              )}
              {!isTyping && currentMessageIndex < messages.length - 1 && (
                <span className="ml-2 loading-dots">...</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          Powered by  Metahuman AI
        </div>
      </div>
    </div>
  )
}

export default PostLoginLoader
