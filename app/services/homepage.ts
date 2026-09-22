import type { HomepageSelectionInput } from '~~/shared/homepage'

export function saveHomepageSelection(
  input: HomepageSelectionInput,
): Promise<{ revision: string }> {
  return $fetch('/api/admin/homepage', { method: 'PUT', body: input, retry: 0 })
}
