import { memo } from 'react';

const TypingIndicator = ({ names }) => {
  if (!names || names.length === 0) return null;

  const displayText = names.length === 1 
    ? `${names[0]} is typing` 
    : names.length === 2 
    ? `${names[0]} and ${names[1]} are typing` 
    : `${names.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-slideInUp">
      <div className="typing-indicator">
        <span className="rounded-full inline-block bg-[var(--wa-primary)]" style={{width: '8px', height: '8px'}}></span>
        <span className="rounded-full inline-block bg-[var(--wa-primary)]" style={{width: '8px', height: '8px'}}></span>
        <span className="rounded-full inline-block bg-[var(--wa-primary)]" style={{width: '8px', height: '8px'}}></span>
      </div>
      <span className="text-sm text-[var(--wa-text-secondary)]">{displayText}</span>
    </div>
  );
};

export default memo(TypingIndicator);
