export default function EmptyState({ title, description, action }) {
  return (
    <div className="grid min-h-[28rem] place-items-center rounded-[18px] border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-8 text-center">
      <div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-3 max-w-lg text-[var(--wa-text-secondary)]">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}