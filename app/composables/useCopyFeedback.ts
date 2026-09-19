export function useCopyFeedback(resetAfter = 2000) {
  const copiedKey = ref<string | null>(null)
  const appToast = useAppToast()
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  async function copyText(value: string, key = 'default') {
    try {
      await navigator.clipboard.writeText(value)
      copiedKey.value = key
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        if (copiedKey.value === key) copiedKey.value = null
      }, resetAfter)
      return true
    } catch {
      appToast.error('Could not copy the link', 'Please try again.')
      return false
    }
  }

  function isCopied(key = 'default') {
    return copiedKey.value === key
  }

  onScopeDispose(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return { copyText, isCopied }
}
