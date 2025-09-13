const TerminalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <style>{`
        @keyframes blinkCursor {
          50% {
            border-right-color: transparent;
          }
        }

        @keyframes typeAndDelete {
          0%, 10% {
            width: 0;
          }
          45%, 55% {
            width: 6.2em;
          }
          90%, 100% {
            width: 0;
          }
        }

        .terminal-text {
          animation: typeAndDelete 4s steps(11) infinite, blinkCursor 0.5s step-end infinite alternate;
        }
      `}</style>
      
      <div className="terminal-loader relative overflow-hidden rounded border border-gray-700 bg-gray-900 font-mono text-base text-green-400 shadow-lg" style={{ width: '12em', padding: '1.5em 1em' }}>
        {/* Terminal Header */}
        <div className="absolute left-0 right-0 top-0 flex h-6 items-center justify-between rounded-t bg-gray-700 px-2">
          <div className="text-sm text-gray-300">Status</div>
          <div className="flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        {/* Terminal Content */}
        <div 
          className="terminal-text inline-block whitespace-nowrap overflow-hidden border-r-2 border-green-400 mt-6"
          style={{ borderRightWidth: '0.2em' }}
        >
          Loading...
        </div>
      </div>
    </div>
  )
}

export default TerminalLoader
