export default function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center rounded-[18px] border border-[var(--wa-border)] bg-[var(--wa-card-hover)] text-[var(--wa-text-secondary)]">
      <div className="animate-pulseSoft rounded-full bg-[rgba(10,132,255,0.16)] px-6 py-3 text-sm tracking-[0.3em] uppercase text-white">{label}</div>
    </div>
  );
}