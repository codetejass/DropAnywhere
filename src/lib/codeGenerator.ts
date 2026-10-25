/**
 * Generates a random 6-digit numeric locker code (e.g., 849201).
 */
export function generateNumeric6DigitCode(): string {
  const codeNum = Math.floor(100000 + Math.random() * 900000);
  return codeNum.toString();
}
