/**
 * Brand mark: renders "HIVE™" (or any brand word) with a refined,
 * properly-styled superscript trademark symbol. Use inside headings so
 * every HIVE title carries a consistent trademark treatment.
 */
export function HiveMark({ word = "HIVE" }: { word?: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold tracking-[0.02em]">{word}</span>
      <sup
        aria-label="trademark"
        className="ml-[0.06em] align-super text-[0.42em] font-semibold tracking-normal text-current opacity-80"
      >
        ™
      </sup>
    </span>
  );
}
