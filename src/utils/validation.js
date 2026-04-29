export const BD_PHONE_RE = /^(\+88)?01[3-9]\d{8}$/;

export function isBdPhone(value) {
  return BD_PHONE_RE.test(value.trim());
}
