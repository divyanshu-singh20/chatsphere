import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--wa-bg)] p-6 text-center text-white">
      <div className="max-w-xl rounded-[2rem] border border-[var(--wa-border)] bg-[var(--wa-chat-bg)] p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--wa-primary)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-[var(--wa-text-secondary)]">The route you requested does not exist.</p>
        <Link to="/app/chat" className="mt-6 inline-flex rounded-2xl bg-[var(--wa-primary)] px-5 py-3 font-medium text-white">
          Go to chats
        </Link>
      </div>
    </div>
  );
}