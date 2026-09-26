export default function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null;

  let text;

  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names.length} people are typing`;
  }

  return (
    <div className="typing-indicator">
      <span className="typing-text">{text}</span>

      <span className="typing-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  );
}