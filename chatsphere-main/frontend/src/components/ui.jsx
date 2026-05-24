import { FiPaperclip, FiSmile, FiSend, FiMic, FiSearch } from 'react-icons/fi';

export const IconButton = ({ children, ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-3 text-white transition duration-200 hover:bg-[rgba(10,132,255,0.12)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.16),0_0_16px_rgba(10,132,255,0.12)] ${props.className || ''}`}
  >
    {children}
  </button>
);

export const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full rounded-2xl border border-[var(--wa-border)] bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-[var(--wa-text-secondary)] focus:border-[var(--wa-primary)] transition-colors duration-200 ${className}`}
  />
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full resize-none rounded-2xl border border-[var(--wa-border)] bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-[var(--wa-text-secondary)] focus:border-[var(--wa-primary)] transition-colors duration-200 ${className}`}
  />
);

export const PrimaryButton = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-2xl bg-[var(--wa-primary)] px-5 py-3 font-medium text-white transition duration-200 hover:bg-[#0b93ff] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  />
);

export const SearchIcon = FiSearch;
export const AttachIcon = FiPaperclip;
export const EmojiIcon = FiSmile;
export const SendIcon = FiSend;
export const MicIcon = FiMic;