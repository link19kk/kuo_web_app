import './TypingIndicator.css'

export default function TypingIndicator() {
  return (
    <div className="typing">
      <div className="typing__header">
        <span className="typing__role">[ GEMINI ]</span>
        <span className="typing__separator">────</span>
        <span className="typing__label">PROCESSING</span>
      </div>
      <div className="typing__body">
        <span className="typing__dot" />
        <span className="typing__dot" />
        <span className="typing__dot" />
      </div>
    </div>
  )
}
