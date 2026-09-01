export function normalizeAnswer(
  answer: string,
): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function answerMatches(
  answer: string,
  acceptedAnswers: string[],
): boolean {
  const normalized = normalizeAnswer(answer);

  return acceptedAnswers.some(
    (accepted) =>
      normalizeAnswer(accepted) === normalized,
  );
}