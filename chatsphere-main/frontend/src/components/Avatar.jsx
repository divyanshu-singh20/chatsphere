const avatarBaseUrl = import.meta.env.VITE_AVATAR_BASE_URL;

const buildAvatarUrl = (seed) => {
  if (!avatarBaseUrl) return undefined;
  return `${avatarBaseUrl}${encodeURIComponent(seed)}`;
};

export default function Avatar({ src, name, online = false, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl',
    header: 'h-10 w-10 text-base'
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={src || buildAvatarUrl(name || 'User')}
        alt={name || 'avatar'}
        className={`rounded-full object-cover ${sizes[size]}`}
      />
      {online ? <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[var(--wa-bg)] bg-[var(--wa-accent)]" /> : null}
    </div>
  );
}