import React from 'react';

export default function IconButton({ children, className = '', size = 40, ...props }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-[9999px] text-[var(--wa-primary)] transition-all hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.16),0_0_16px_rgba(10,132,255,0.12)] ${className}`}
      style={{ width: s, height: s }}
    >
      {children}
    </button>
  );
}
