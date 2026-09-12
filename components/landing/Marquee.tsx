const PHRASES = [
  "Your dignity is optional",
  "We're about to find out",
  "Unfortunately, we found patterns",
  "Preparing emotional damage",
  "This seemed like a good idea",
  "Your friends have been waiting for this",
  "That was… specific",
  "Okay. This is getting uncomfortable",
];

export function Marquee() {
  const items = [...PHRASES, ...PHRASES];
  return (
    <div className="relative flex overflow-hidden border-y border-white/5 bg-white/[0.02] py-4">
      <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
        {items.map((phrase, i) => (
          <span
            key={`${phrase}-${i}`}
            className="flex items-center gap-8 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] text-muted/70"
          >
            {phrase}
            <span className="text-flame">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
