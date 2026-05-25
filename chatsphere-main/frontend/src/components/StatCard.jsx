export default function StatCard({ label, value, delta, onClick, active }) {
  const base = 'rounded-3xl border p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]';
  const activeClasses = active
    ? 'border-[rgba(10,132,255,0.4)] bg-[rgba(10,132,255,0.06)] scale-[1.01]'
    : 'border-[var(--wa-border)] bg-[var(--wa-card-hover)]';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') onClick(e);
      }}
      onClick={onClick}
      className={`${base} ${activeClasses} ${onClick ? 'cursor-pointer transition-transform' : ''}`}
    >
      <p className="text-sm text-[var(--wa-text-secondary)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold text-white">{value}</span>
        {delta ? <span className="rounded-full bg-[rgba(10,132,255,0.14)] px-3 py-1 text-xs font-medium text-white">{delta}</span> : null}
      </div>
    </div>
  );
}