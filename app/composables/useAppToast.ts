export function useAppToast() {
  const toast = useToast()

  return {
    success(title: string, description?: string) {
      toast.add({
        title,
        description,
        icon: 'i-lucide-circle-check',
        color: 'success',
      })
    },
    error(title: string, description?: string) {
      toast.add({
        title,
        description,
        icon: 'i-lucide-circle-alert',
        color: 'error',
      })
    },
    warning(title: string, description?: string) {
      toast.add({
        title,
        description,
        icon: 'i-lucide-triangle-alert',
        color: 'warning',
      })
    },
  }
}
