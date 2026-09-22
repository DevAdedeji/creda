export function getAdminEmails(): string[] {
  return [
    ...new Set(
      (process.env.CREDA_ADMIN_EMAILS ?? '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}
