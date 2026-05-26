import { FiSearch } from 'react-icons/fi';

export default function HomeSearchBar({ value, onChange, placeholder = 'Search chats...', user, logout }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--wa-border)] bg-[rgba(0,0,0,0.95)] backdrop-blur-md">
      <div className="mx-auto flex h-[56px] max-w-screen-md items-center gap-3 px-3 sm:px-4">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full bg-[var(--wa-card-hover)] px-4 text-[var(--wa-text-secondary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] transition-all duration-200 focus-within:bg-[rgba(26,26,26,0.98)] focus-within:shadow-[inset_0_0_0_1px_rgba(10,132,255,0.35)]">
          <FiSearch className="shrink-0 text-[18px]" />
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full w-full bg-transparent text-[14px] text-[var(--wa-text)] outline-none placeholder:text-[var(--wa-text-secondary)]"
          />
        </label>
      </div>
    </div>
  );
}
