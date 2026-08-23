const EMAIL_SUFFIX = '@my-interview.local';
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

export function normalize(username) {
  return (username ?? '').trim().toLowerCase();
}

export function isValid(username) {
  return USERNAME_RE.test(username);
}

export function toEmail(username) {
  return `${username}${EMAIL_SUFFIX}`;
}

export function fromEmail(email) {
  if (!email || !email.endsWith(EMAIL_SUFFIX)) return email ?? '';
  return email.slice(0, -EMAIL_SUFFIX.length);
}
