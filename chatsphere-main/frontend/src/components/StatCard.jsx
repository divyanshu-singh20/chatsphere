export default function StatCard({ label, value, delta }) {
  return (
    <div className="rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <p className="text-sm text-[var(--wa-text-secondary)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold text-white">{value}</span>
        {delta ? <span className="rounded-full bg-[rgba(10,132,255,0.14)] px-3 py-1 text-xs font-medium text-white">{delta}</span> : null}
      </div>
    </div>
  );
}