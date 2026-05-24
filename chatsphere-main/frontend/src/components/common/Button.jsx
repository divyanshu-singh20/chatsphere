import React from 'react';

export default function Button({ children, className = '', variant = 'default', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-[9999px] px-[12px] py-[8px] text-[14px] font-[var(--fw-medium)] transition-all';
  const variants = {
    default: 'bg-[var(--wa-primary)] text-white hover:bg-[#0b93ff]',
    outline: 'bg-transparent border border-[var(--wa-border)] text-[var(--wa-text)] hover:bg-[var(--wa-card-hover)]',
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}
