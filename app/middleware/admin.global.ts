export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.toLowerCase()
  if (path !== '/admin' && !path.startsWith('/admin/')) return

  const requestFetch = useRequestFetch()
  let viewer: { user: { isAdmin: boolean } }
  try {
    viewer = await requestFetch('/api/me', { cache: 'no-store' })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
      return navigateTo({ path: '/login', query: { returnTo: to.fullPath } })
    }
    return abortNavigation(
      createError({
        statusCode: 503,
        message: 'We could not check your access. Please try again.',
      }),
    )
  }
  if (viewer.user.isAdmin !== true) {
    return abortNavigation(
      createError({ statusCode: 403, message: 'Administrator access required.' }),
    )
  }
})
