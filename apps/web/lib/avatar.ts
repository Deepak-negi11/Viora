// The four LimeZu characters we ship as game-ready 384x32 run sheets in /public/assets.
// All share the same frame layout, so they use identical walk animations in Phaser.
export const CHARACTERS = ["adam", "alex", "bob", "amelia"] as const;
export type CharacterKey = (typeof CHARACTERS)[number];

// An avatar's imageUrl is its run sheet, e.g. "/assets/alex-run.png".
// This maps that back to the character key the Phaser scene uses. Falls back to "adam".
export function charFromImageUrl(url: string | null | undefined): CharacterKey {
  const match = url?.match(/\/assets\/(adam|alex|bob|amelia)-run\.png$/);
  return (match?.[1] as CharacterKey) ?? "adam";
}
