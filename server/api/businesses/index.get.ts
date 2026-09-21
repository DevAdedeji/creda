import { createError, getQuery } from 'h3'
import { businessListQuerySchema } from '@server/domains/businesses/validation'
import { listPublicBusinesses } from '@server/domains/businesses/service'
import { discoveryInterpretationSchema } from '~~/shared/discovery'
import { searchDiscovery } from '@server/domains/discovery/search'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const parsed = businessListQuerySchema.safeParse(query)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid search filters.' })
  }
  if (query.mode === 'ai' && query.intent === undefined)
    return { items: [], total: 0, page: 1, pageSize: 12 }
  if (query.mode === 'ai' && query.intent !== undefined) {
    let input: unknown
    try {
      if (typeof query.intent !== 'string' || query.intent.length > 4096)
        throw new Error('Invalid intent')
      input = JSON.parse(query.intent)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid search filters.' })
    }
    const interpretation = discoveryInterpretationSchema.safeParse(input)
    if (!interpretation.success)
      throw createError({ statusCode: 400, statusMessage: 'Invalid search filters.' })
    const discovery = interpretation.data
    discovery.criteria = {
      ...discovery.criteria,
      categories: parsed.data.category,
      city: parsed.data.city,
      state: parsed.data.state,
      operationModes: parsed.data.operationMode,
      sort: parsed.data.sort,
    }
    if (!discovery.searchable)
      return { items: [], total: 0, page: 1, pageSize: 12, reasons: {}, discovery }
    // Reuse the interpreted filters on refresh, shared links and pagination. No AI call here.
    const results = await searchDiscovery(discovery.criteria, parsed.data.page)
    return { ...results, discovery }
  }
  return listPublicBusinesses(parsed.data)
})
