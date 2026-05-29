import { memo } from 'react';
import Avatar from './Avatar';

const formatTime = (value) => {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const defaultReactions = ['👍', '❤️', '😂', '😮'];

const MessageBubbleComponent = ({ message, mine, onReply, onReact, onEdit, onDelete }) => {
  const isAudioMessage = message.mediaType === 'audio';
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const senderName = message.sender?.fullName || message.sender?.username || 'Unknown user';

  return (
    <div className={`group flex min-w-0 w-full ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine ? (
        <div className="mr-2 mt-auto shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Avatar src={message.sender?.avatar} name={message.sender?.fullName} size="sm" />
        </div>
      ) : null}

      <div className={`flex min-w-0 max-w-full flex-col ${mine ? 'items-end' : 'items-start'} gap-0.5`}>
        <div
          className={`message-bubble inline-flex w-fit min-w-0 max-w-[84vw] flex-col gap-1 rounded-2xl px-3 py-2 text-left text-sm leading-snug break-words sm:max-w-[72vw] md:max-w-[65%] ${mine ? 'message-bubble--mine self-end' : 'message-bubble--other self-start'}`}
        >
          {!mine ? (
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="truncate">{senderName}</span>
            </div>
          ) : null}

          {message.replyTo ? (
            <div className="rounded-xl border-l-2 border-[rgba(0,0,0,0.2)] bg-black/5 px-3 py-2 text-[12px] dark:border-white/15 dark:bg-white/5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Replying to</p>
              <p className="mt-1 line-clamp-2 leading-snug text-zinc-700 dark:text-zinc-200">{message.replyTo.content}</p>
            </div>
          ) : null}

          {message.mediaUrl ? (
            message.mediaType === 'image' ? (
              <div className="overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                <img src={message.mediaUrl} alt="attachment" className="max-h-72 w-full object-cover" loading="lazy" />
              </div>
            ) : isAudioMessage ? (
              <div className="rounded-xl bg-black/5 px-3 py-2 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  <span>Voice note</span>
                  <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-zinc-600 underline underline-offset-2 dark:text-zinc-300">
                    Open
                  </a>
                </div>
                <audio controls preload="metadata" className="mt-2 w-full min-w-0" src={message.mediaUrl} />
              </div>
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-[13px] text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                📎 Open attachment
              </a>
            )
          ) : null}

          {message.content ? (
            <p className={`whitespace-pre-wrap break-words ${message.deletedForEveryone ? 'italic opacity-70' : ''}`}>
              {message.content}
            </p>
          ) : null}

          {reactions.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {reactions.map((reaction) => (
                <button
                  type="button"
                  key={reaction.emoji}
                  onClick={() => onReact?.(message, reaction.emoji)}
                  className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:bg-white/5 dark:text-zinc-200"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count || 1}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1 pt-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {defaultReactions.map((emoji) => (
              <button key={emoji} type="button" onClick={() => onReact?.(message, emoji)} className="rounded-full bg-black/5 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                {emoji}
              </button>
            ))}
            <button type="button" onClick={() => onReply?.(message)} className="rounded-full bg-black/5 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
              Reply
            </button>
            {mine ? (
              <>
                <button type="button" onClick={() => onEdit?.(message)} className="rounded-full bg-black/5 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete?.(message)} className="rounded-full bg-black/5 px-2 py-1 text-[11px] leading-none text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                  Delete
                </button>
              </>
            ) : null}
          </div>

          <div className={`flex items-center justify-end gap-1 whitespace-nowrap text-[10px] leading-none ${mine ? 'text-black/55 dark:text-white/55' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <span>{formatTime(message.createdAt || Date.now())}</span>
            {mine ? <span className="font-medium">{message.seenAt ? '✓✓' : message.deliveredAt ? '✓✓' : '✓'}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubbleComponent);