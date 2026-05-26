import { FiSearch } from 'react-icons/fi';
import MobileAccountMenu from './MobileAccountMenu';

export default function HomeSearchBar({ value, onChange, placeholder = 'Search chats...', user, logout }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 border-b border-white/5 bg-[rgba(8,8,8,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-screen-md items-center gap-3 px-3 sm:px-4">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-white/5 bg-[rgba(255,255,255,0.04)] px-4 text-[var(--wa-text-secondary)] shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-200 focus-within:border-[rgba(10,132,255,0.35)] focus-within:bg-[rgba(20,20,20,0.96)] focus-within:shadow-[0_10px_34px_rgba(0,0,0,0.2)]">
          <FiSearch className="shrink-0 text-[18px]" />
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full w-full bg-transparent text-[14px] text-[var(--wa-text)] outline-none placeholder:text-[var(--wa-text-secondary)]"
          />
        </label>
        {user ? <MobileAccountMenu user={user} logout={logout} className="shrink-0" /> : null}
      </div>
    </div>
  );
}
