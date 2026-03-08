'use client';

interface ReactionCounts {
  like: number;
  heart: number;
  wow: number;
}

interface Props {
  reactions: ReactionCounts;
  userReaction: string | null;
  commentCount: number;
  onReact: (type: 'like' | 'heart' | 'wow') => void;
  onToggleComments: () => void;
  commentsOpen: boolean;
}

const REACTIONS = [
  { type: 'like' as const, emoji: '👍', label: 'Gilla' },
  { type: 'heart' as const, emoji: '❤️', label: 'Älska' },
  { type: 'wow' as const, emoji: '😮', label: 'Wow' },
];

export default function ReactionBar({
  reactions,
  userReaction,
  commentCount,
  onReact,
  onToggleComments,
  commentsOpen,
}: Props) {
  const totalReactions = reactions.like + reactions.heart + reactions.wow;

  return (
    <div className="space-y-2">
      {/* Reaction counts summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
          {reactions.like > 0 && <span>👍 {reactions.like}</span>}
          {reactions.heart > 0 && <span>❤️ {reactions.heart}</span>}
          {reactions.wow > 0 && <span>😮 {reactions.wow}</span>}
          <span className="ml-auto">{commentCount > 0 ? `${commentCount} kommentar${commentCount !== 1 ? 'er' : ''}` : ''}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {REACTIONS.map(({ type, emoji, label }) => {
          const isActive = userReaction === type;
          return (
            <button
              key={type}
              onClick={() => onReact(type)}
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-amber-700 bg-amber-100 hover:bg-amber-200 shadow-sm'
                  : 'text-slate-500 hover:bg-stone-100 hover:text-slate-800'
              }`}
              aria-label={label}
            >
              <span className={`transition-transform duration-150 group-hover:scale-125 ${isActive ? 'scale-110' : ''}`}>
                {emoji}
              </span>
              <span className="hidden sm:inline text-xs">{label}</span>
            </button>
          );
        })}

        <button
          onClick={onToggleComments}
          className={`group ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
            commentsOpen
              ? 'text-amber-700 bg-amber-100 hover:bg-amber-200 shadow-sm'
              : 'text-slate-500 hover:bg-stone-100 hover:text-slate-800'
          }`}
        >
          <span className="transition-transform duration-150 group-hover:scale-125">💬</span>
          <span className="text-xs">
            {commentsOpen ? 'Dölj' : commentCount > 0 ? `${commentCount} kommentarer` : 'Kommentera'}
          </span>
        </button>
      </div>
    </div>
  );
}
