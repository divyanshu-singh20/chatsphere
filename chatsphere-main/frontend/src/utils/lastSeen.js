const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'last seen recently';

  const now = new Date();
  const seen = new Date(lastSeenAt);
  const diffMs = now.getTime() - seen.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes} minutes ago`;

  const isSameDay = now.toDateString() === seen.toDateString();
  if (isSameDay) return `last seen today at ${formatTime(seen)}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (seen.toDateString() === yesterday.toDateString()) {
    return 'last seen yesterday';
  }

  if (diffHours < 24) {
    return `last seen today at ${formatTime(seen)}`;
  }

  const dd = String(seen.getDate()).padStart(2, '0');
  const mm = String(seen.getMonth() + 1).padStart(2, '0');
  const yyyy = seen.getFullYear();
  return `last seen ${dd}/${mm}/${yyyy}`;
}

export function getPresenceLabel({ isOnline, lastSeenAt }) {
  return isOnline ? 'Online now' : formatLastSeen(lastSeenAt);
}
