import type { LocationQueryRaw } from 'vue-router'
import {
  businessCategories,
  businessDays,
  operationModes,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'
import { otherStateFilterValue } from '~~/shared/nigeriaStates'
import {
  discoveryInterpretationSchema,
  type DiscoveryInterpretation,
  type DirectorySearchResponse,
} from '~~/shared/discovery'
import { interpretBusinessSearch, searchFailureNotice } from '@/services/discovery'

export function useBusinessDiscovery() {
  const route = useRoute()
  const interpreting = ref(false)
  const searchNotice = ref('')
  let searchController: AbortController | undefined
  function cancelInterpretation() {
    searchController?.abort()
    searchController = undefined
    interpreting.value = false
  }
  onBeforeUnmount(cancelInterpretation)
  const routeInterpretation = computed<DiscoveryInterpretation | null>(() => {
    if (route.query.mode !== 'ai') return null
    if (typeof route.query.intent !== 'string' || route.query.intent.length > 4096) return null
    try {
      const parsed = discoveryInterpretationSchema.safeParse(JSON.parse(route.query.intent))
      if (!parsed.success) return null
      return {
        ...parsed.data,
        criteria: {
          ...parsed.data.criteria,
          categories: selectedValues(route.query.category, businessCategories),
          city: typeof route.query.city === 'string' ? route.query.city : '',
          state: typeof route.query.state === 'string' ? route.query.state : '',
          operationModes: selectedValues(route.query.operationMode, operationModes),
          sort: sortOptions.find((item) => item.value === route.query.sort)?.value ?? 'relevance',
        },
      }
    } catch {
      return null
    }
  })
  const filtersOpen = ref(false)
  const aiSearch = ref(route.query.mode === 'ai')
  const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
  function selectedValues<T extends string>(value: unknown, options: readonly { value: T }[]): T[] {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    return [
      ...new Set(
        values.filter((item): item is T => options.some((option) => option.value === item)),
      ),
    ]
  }
  const category = ref<BusinessCategory[]>(selectedValues(route.query.category, businessCategories))
  const city = ref(typeof route.query.city === 'string' ? route.query.city : '')
  const state = ref(typeof route.query.state === 'string' ? route.query.state : '')
  const operationMode = ref<OperationMode[]>(
    selectedValues(route.query.operationMode, operationModes),
  )
  const sortOptions = [
    { label: 'Best match', value: 'relevance' },
    { label: 'Top rated', value: 'top_rated' },
    { label: 'Most reviewed', value: 'most_reviewed' },
    { label: 'Newest', value: 'newest' },
  ] as const
  type DirectorySort = (typeof sortOptions)[number]['value']
  const sort = ref<DirectorySort>(
    sortOptions.find((item) => item.value === route.query.sort)?.value ?? 'relevance',
  )
  const apiQuery = computed(() => ({
    q: typeof route.query.q === 'string' ? route.query.q : undefined,
    mode: route.query.mode === 'ai' ? 'ai' : undefined,
    intent:
      route.query.mode === 'ai' && typeof route.query.intent === 'string'
        ? route.query.intent
        : undefined,
    category: route.query.category ?? undefined,
    location: typeof route.query.location === 'string' ? route.query.location : undefined,
    city: typeof route.query.city === 'string' ? route.query.city : undefined,
    state: typeof route.query.state === 'string' ? route.query.state : undefined,
    operationMode: route.query.operationMode ?? undefined,
    sort: typeof route.query.sort === 'string' ? route.query.sort : undefined,
    page: route.query.page ?? undefined,
  }))
  const request = useFetch<DirectorySearchResponse>('/api/businesses', { query: apiQuery })
  const { data, status, error, refresh } = request
  const searchPending = computed(
    () =>
      interpreting.value ||
      status.value === 'pending' ||
      (route.query.mode === 'ai' && !routeInterpretation.value && !searchNotice.value),
  )
  const extraCriteria = computed(() => {
    const c = data.value?.discovery?.criteria
    if (!c) return []
    const values: {
      key: 'verifiedOnly' | 'minRating' | 'minReviews' | 'openDay'
      label: string
    }[] = []
    if (c.verifiedOnly) values.push({ key: 'verifiedOnly', label: 'Ownership verified' })
    if (c.minRating !== null) values.push({ key: 'minRating', label: `${c.minRating}+ stars` })
    if (c.minReviews !== null) values.push({ key: 'minReviews', label: `${c.minReviews}+ reviews` })
    if (c.openDay !== null)
      values.push({
        key: 'openDay',
        label: `${businessDays.find((day) => day.value === c.openDay)?.label} hours listed`,
      })
    return values
  })
  type FilterKey = 'q' | 'category' | 'operationMode' | 'state' | 'city' | 'location'
  const activeFilters = computed(() => {
    const filters: { key: FilterKey; value: string; label: string }[] = []
    for (const key of ['q', 'state', 'city', 'location'] as const) {
      const value = route.query[key]
      if (typeof value === 'string' && value.trim())
        filters.push({ key, value, label: key === 'q' ? `Search: ${value}` : value })
    }
    for (const [key, options] of [
      ['category', businessCategories],
      ['operationMode', operationModes],
    ] as const) {
      for (const option of options) {
        const values = route.query[key]
        if (Array.isArray(values) ? values.includes(option.value) : values === option.value)
          filters.push({ key, value: option.value, label: option.label })
      }
    }
    return filters
  })

  function removeFilter(key: FilterKey, value: string) {
    if (searchPending.value) return
    const query: LocationQueryRaw = { ...route.query, page: undefined }
    const current = query[key]
    query[key] = Array.isArray(current) ? current.filter((item) => item !== value) : undefined
    // Removing the prompt also removes its AI-only constraints.
    if (key === 'q') {
      query.mode = undefined
      query.intent = undefined
    }
    return navigateTo({ path: '/explore', query })
  }

  watch(
    () => route.query,
    () => {
      if (interpreting.value) {
        cancelInterpretation()
      }
      searchNotice.value = ''
      aiSearch.value = route.query.mode === 'ai'
      search.value = typeof route.query.q === 'string' ? route.query.q : ''
      category.value = selectedValues(route.query.category, businessCategories)
      city.value = typeof route.query.city === 'string' ? route.query.city : ''
      state.value = typeof route.query.state === 'string' ? route.query.state : ''
      operationMode.value = selectedValues(route.query.operationMode, operationModes)
      sort.value = sortOptions.find((item) => item.value === route.query.sort)?.value ?? 'relevance'
    },
  )

  async function applyFilters() {
    if (interpreting.value) return
    filtersOpen.value = false
    searchNotice.value = ''
    const queryText = search.value.trim()
    const selected = {
      categories: [...category.value],
      city: city.value.trim(),
      state: state.value === otherStateFilterValue ? '' : state.value.trim(),
      operationModes: [...operationMode.value],
      sort: sort.value,
    }
    let interpreted =
      aiSearch.value && routeInterpretation.value
        ? structuredClone(toRaw(routeInterpretation.value))
        : null
    if (aiSearch.value && queryText.length < 3) {
      searchNotice.value = 'Enter at least 3 characters for AI search, or search normally.'
      return
    }
    if (
      aiSearch.value &&
      (queryText !== (typeof route.query.q === 'string' ? route.query.q : '') || !interpreted)
    ) {
      interpreted = null
      const request = new AbortController()
      searchController = request
      interpreting.value = true
      try {
        const response = await interpretBusinessSearch(queryText, request.signal)
        if (searchController !== request) return
        interpreted = {
          criteria: response.criteria,
          searchable: response.searchable,
          clarification: response.clarification,
          unsupported: response.unsupported,
        }
        // Explicit filter edits take precedence. Otherwise allow a new search to change inferred filters.
        const previous = routeInterpretation.value?.criteria
        if (
          (!previous && selected.categories.length) ||
          (previous && JSON.stringify(selected.categories) !== JSON.stringify(previous.categories))
        )
          interpreted.criteria.categories = selected.categories
        if ((!previous && selected.city) || (previous && selected.city !== previous.city))
          interpreted.criteria.city = selected.city
        if ((!previous && selected.state) || (previous && selected.state !== previous.state))
          interpreted.criteria.state = selected.state
        if (
          (!previous && selected.operationModes.length) ||
          (previous &&
            JSON.stringify(selected.operationModes) !== JSON.stringify(previous.operationModes))
        )
          interpreted.criteria.operationModes = selected.operationModes
        if (
          (!previous && selected.sort !== 'relevance') ||
          (previous && selected.sort !== previous.sort)
        )
          interpreted.criteria.sort = selected.sort
      } catch (error) {
        if (searchController !== request) return
        searchNotice.value = searchFailureNotice(error)
        return
      } finally {
        if (searchController === request) {
          interpreting.value = false
          searchController = undefined
        }
      }
    } else if (interpreted) {
      interpreted.criteria = { ...interpreted.criteria, ...selected }
    }
    const filters = interpreted?.criteria ?? selected
    await navigateTo({
      path: '/explore',
      query: {
        q: queryText || undefined,
        mode: aiSearch.value ? 'ai' : undefined,
        category: filters.categories.length ? filters.categories : undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        operationMode: filters.operationModes.length ? filters.operationModes : undefined,
        sort: filters.sort === 'relevance' ? undefined : filters.sort,
        intent: interpreted ? JSON.stringify(interpreted) : undefined,
      },
    })
  }

  onMounted(() => {
    watch(
      () => route.fullPath,
      () => {
        if (route.query.mode === 'ai' && !routeInterpretation.value) void applyFilters()
      },
      { immediate: true },
    )
  })

  function removeExtraCriterion(key: 'verifiedOnly' | 'minRating' | 'minReviews' | 'openDay') {
    const interpreted = routeInterpretation.value
      ? structuredClone(toRaw(routeInterpretation.value))
      : null
    if (!interpreted || searchPending.value) return
    if (key === 'verifiedOnly') interpreted.criteria.verifiedOnly = false
    else interpreted.criteria[key] = null
    navigateTo({
      path: '/explore',
      query: { ...route.query, intent: JSON.stringify(interpreted), page: undefined },
    })
  }

  async function searchNormally() {
    cancelInterpretation()
    aiSearch.value = false
    await applyFilters()
  }

  function clearFilters() {
    cancelInterpretation()
    searchNotice.value = ''
    aiSearch.value = false
    search.value = ''
    category.value = []
    city.value = ''
    state.value = ''
    operationMode.value = []
    sort.value = 'relevance'
    filtersOpen.value = false
    navigateTo('/explore')
  }

  function pageLink(page: number) {
    const query = { ...route.query }
    if (page === 1) delete query.page
    else query.page = String(page)
    return { path: '/explore', query }
  }

  function applySort() {
    navigateTo({
      path: '/explore',
      query: {
        ...route.query,
        sort: sort.value === 'relevance' ? undefined : sort.value,
        page: undefined,
      },
    })
  }

  return {
    request,
    data,
    status,
    error,
    refresh,
    search,
    aiSearch,
    searchNormally,
    category,
    city,
    state,
    operationMode,
    sort,
    sortOptions,
    filtersOpen,
    interpreting,
    searchPending,
    searchNotice,
    extraCriteria,
    activeFilters,
    removeFilter,
    applyFilters,
    clearFilters,
    applySort,
    pageLink,
    removeExtraCriterion,
  }
}
