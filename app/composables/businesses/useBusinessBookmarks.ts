import type { Ref } from 'vue'
import { authClient } from '~~/lib/auth-client'
import type { BusinessListItem } from '~~/shared/businesses'

export function useBusinessBookmarks(businesses: Ref<BusinessListItem[]>) {
  const sessionState = authClient.useSession()
  const session = computed(() => sessionState.value.data)
  const savedIds = ref(new Set<string>())
  const savingId = ref<string | null>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const mounted = ref(false)
  const appToast = useAppToast()
  const route = useRoute()
  let controller: AbortController | undefined
  const userId = computed(() => (session.value?.user.emailVerified ? session.value.user.id : null))
  const ids = computed(() => [...new Set(businesses.value.map((item) => item.id))].join(','))
  const pending = computed(
    () =>
      !mounted.value ||
      sessionState.value.isPending ||
      !!savingId.value ||
      status.value === 'pending',
  )

  async function loadSaved(): Promise<boolean> {
    controller?.abort()
    savedIds.value = new Set()
    status.value = 'idle'
    if (!userId.value || !ids.value) return false
    const request = new AbortController()
    controller = request
    status.value = 'pending'
    try {
      const result = await $fetch<{ ids: string[] }>('/api/my/saved-businesses/status', {
        query: { ids: ids.value },
        signal: request.signal,
        retry: 0,
      })
      if (!request.signal.aborted) {
        savedIds.value = new Set(result.ids)
        status.value = 'success'
        return true
      }
    } catch {
      if (!request.signal.aborted) status.value = 'error'
    }
    return false
  }
  onMounted(() => {
    mounted.value = true
  })
  watch([mounted, userId, ids], () => {
    if (mounted.value) void loadSaved()
  })
  onScopeDispose(() => controller?.abort())

  async function toggleSaved(item: BusinessListItem) {
    if (pending.value) return
    if (!session.value) {
      await navigateTo({ path: '/login', query: { returnTo: route.fullPath } })
      return
    }
    if (!userId.value) {
      appToast.warning('Verify your email to save businesses')
      return
    }
    const owner = userId.value
    if (status.value !== 'success') {
      if (!(await loadSaved())) {
        appToast.error('Could not load saved businesses', 'Please try again.')
        return
      }
    }
    if (userId.value !== owner) return
    savingId.value = item.id
    try {
      const result = await $fetch<{ saved: boolean }>(`/api/my/saved-businesses/${item.id}`, {
        method: savedIds.value.has(item.id) ? 'DELETE' : 'PUT',
        retry: 0,
      })
      if (userId.value !== owner) return
      const next = new Set(savedIds.value)
      if (result.saved) next.add(item.id)
      else next.delete(item.id)
      savedIds.value = next
      appToast.success(result.saved ? 'Business saved' : 'Business removed from saved')
    } catch {
      if (userId.value === owner)
        appToast.error('Could not update saved businesses', 'Please try again.')
    } finally {
      savingId.value = null
    }
  }
  return { savedIds, pending, toggleSaved }
}
