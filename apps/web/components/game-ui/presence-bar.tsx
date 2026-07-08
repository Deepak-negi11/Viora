"use client";

// One person shown in the presence bar.
export type PresencePerson = {
  id: string;
  name: string;
  isSelf: boolean;
};

type PresenceBarProps = {
  people: PresencePerson[];
};

// Top-left panel showing who is currently in the space (Gather-style presence).
// It reads straight from the socket data the page already has — no extra fetch.
// Like the control bar, it's a React overlay on top of the Phaser canvas.
export function PresenceBar({ people }: PresenceBarProps) {
  const MAX_SHOWN = 6;
  const shown = people.slice(0, MAX_SHOWN);
  const extra = people.length - shown.length;

  return (
    <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-2">
      {/* live count */}
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-neutral-900/90 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
        </span>
        <span className="text-sm font-medium text-white">
          {people.length} {people.length === 1 ? "person" : "people"} online
        </span>
      </div>

      {/* avatar circles */}
      <ul className="pointer-events-auto flex items-center gap-1.5" aria-label="People in this space">
        {shown.map((person) => (
          <li key={person.id} title={person.isSelf ? `${person.name} (you)` : person.name}>
            <span
              className={
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow ring-2 " +
                (person.isSelf ? "bg-indigo-500 ring-indigo-300" : "bg-neutral-700 ring-white/20")
              }
            >
              {person.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
          </li>
        ))}
        {extra > 0 && (
          <li title={`${extra} more`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-300 ring-2 ring-white/10">
              +{extra}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
