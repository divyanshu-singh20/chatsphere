export default function StatusPage() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--wa-bg)] px-4 pt-4 text-[var(--wa-text)] lg:hidden">
      <div className="rounded-2xl bg-[var(--wa-card-hover)] p-4 border border-[var(--wa-border)]">
        <p className="text-[16px] font-semibold text-[var(--wa-text)]">Status</p>
        <p className="mt-1 text-[13px] text-[var(--wa-text-secondary)]">
          Status updates can be shown here without affecting the chat flow.
        </p>
      </div>
    </div>
  );
}
