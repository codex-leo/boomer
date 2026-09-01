const SCORE_BY_POSITION = [
  1000,
  800,
  600,
  400,
];

export function calculateScore(
  position: number,
): number {
  if (position < SCORE_BY_POSITION.length) {
    return SCORE_BY_POSITION[position];
  }

  return 250;
}