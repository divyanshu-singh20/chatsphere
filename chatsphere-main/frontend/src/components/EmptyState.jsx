export default function EmptyState({ title, description, action, variant = 'default' }) {
  if (variant === 'conversation') {
    return (
      <div className="flex min-h-[18rem] flex-1 items-center justify-center px-6 py-10 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/6 bg-white/5 text-2xl text-[var(--wa-green)] shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            💬
          </div>
          <h3 className="text-xl font-semibold text-[var(--wa-text)]">{title}</h3>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[var(--wa-text-secondary)]">{description}</p>
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[22rem] place-items-center rounded-[22px] border border-white/5 bg-[rgba(255,255,255,0.03)] p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
      <div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-3 max-w-lg text-[var(--wa-text-secondary)]">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}