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

  return (
    <div className={`group flex min-w-0 w-full items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} transition-all`}>
      {!mine ? (
        <div className="mt-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Avatar src={message.sender?.avatar} name={message.sender?.fullName} size="sm" />
        </div>
      ) : null}

      <div className={`flex min-w-0 flex-col ${mine ? 'items-end' : 'items-start'} gap-1`}>
        <div
          className={`message-bubble inline-flex min-w-0 max-w-[75vw] flex-col gap-2 px-4 py-3 text-left transition-transform duration-200 hover:-translate-y-0.5 md:max-w-[70%] lg:max-w-[65%] ${mine ? 'message-bubble--mine' : 'message-bubble--other'}`}
        >
          {message.replyTo ? (
            <div className="rounded-[14px] border-l-2 border-white/15 bg-black/10 px-3 py-2">
              <p className="text-[10px] font-[var(--fw-semibold)] uppercase tracking-[0.22em] text-white/60">Replying to</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/80">{message.replyTo.content}</p>
            </div>
          ) : null}

          {message.mediaUrl ? (
            message.mediaType === 'image' ? (
              <div className="overflow-hidden rounded-[18px] bg-black/10">
                <img src={message.mediaUrl} alt="attachment" className="max-h-72 w-full object-cover" loading="lazy" />
              </div>
            ) : isAudioMessage ? (
              <div className="rounded-[18px] border border-white/10 bg-black/10 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-white/60">
                  <span>Voice note</span>
                  <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-white/70 underline underline-offset-2 hover:text-white">
                    Open
                  </a>
                </div>
                <audio controls preload="metadata" className="mt-2 w-full min-w-0" src={message.mediaUrl} />
              </div>
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-black/10 px-3 py-2 text-[13px] text-white/90 transition hover:bg-black/20">
                📎 Open attachment
              </a>
            )
          ) : null}

          {message.content ? (
            <p className={`whitespace-pre-wrap break-words text-[15px] leading-[1.45] ${message.deletedForEveryone ? 'italic opacity-75' : 'text-white'}`}>
              {message.content}
            </p>
          ) : null}

          {reactions.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {reactions.map((reaction) => (
                <button
                  type="button"
                  key={reaction.emoji}
                  onClick={() => onReact?.(message, reaction.emoji)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none text-white/90 transition hover:bg-white/10"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count || 1}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1 pt-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {defaultReactions.map((emoji) => (
              <button key={emoji} type="button" onClick={() => onReact?.(message, emoji)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none text-white/85 transition hover:bg-white/10">
                {emoji}
              </button>
            ))}
            <button type="button" onClick={() => onReply?.(message)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none text-white/85 transition hover:bg-white/10">
              Reply
            </button>
            {mine ? (
              <>
                <button type="button" onClick={() => onEdit?.(message)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none text-white/85 transition hover:bg-white/10">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete?.(message)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] leading-none text-white/85 transition hover:bg-white/10">
                  Delete
                </button>
              </>
            ) : null}
          </div>

          <div className={`flex items-center justify-end gap-1 whitespace-nowrap text-[10px] leading-none ${mine ? 'text-white/75' : 'text-white/55'}`}>
            <span>{formatTime(message.createdAt || Date.now())}</span>
            {mine ? <span className="font-semibold text-white/80">{message.seenAt ? '✓✓' : message.deliveredAt ? '✓✓' : '✓'}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubbleComponent);