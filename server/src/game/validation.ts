export function validateNickname(
  name: unknown,
): { valid: true; value: string } | {
  valid: false;
  reason: string;
} {
  if (typeof name !== "string") {
    return {
      valid: false,
      reason: "Invalid nickname.",
    };
  }

  const value = name.trim();

  if (value.length < 1 || value.length > 20) {
    return {
      valid: false,
      reason: "Nickname must be between 1 and 20 characters.",
    };
  }

  return {
    valid: true,
    value,
  };
}