import { useEffect, useRef } from 'react'
import './ChatMessage.css'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isUser = message.role === 'user'

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const timeStr = message.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div ref={ref} className={`msg ${isUser ? 'msg--user' : 'msg--ai'}`}>
      <div className="msg__header">
        <span className="msg__role">
          {isUser ? '[ USER ]' : '[ GEMINI ]'}
        </span>
        <span className="msg__separator">────</span>
        <span className="msg__time">{timeStr}</span>
      </div>
      <div className="msg__body">
        <pre className="msg__content">{message.content}</pre>
      </div>
    </div>
  )
}
