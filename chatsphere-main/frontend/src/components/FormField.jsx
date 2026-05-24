export default function FormField({ label, error, className = '', children, hint }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white">{label}</span>
        {hint ? <span className="text-xs text-[var(--wa-text-secondary)]">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-sm text-[#ff8f86]">{error}</p> : null}
    </label>
  );
}