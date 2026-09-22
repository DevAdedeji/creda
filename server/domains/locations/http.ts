import { createError } from 'h3'
export async function locationRequest<T>(operation: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch {
    console.error(
      JSON.stringify({
        domain: 'locations',
        operation,
        outcome: 'failure',
        code: 'locations_unavailable',
      }),
    )
    throw createError({
      statusCode: 503,
      message: 'Locations could not be loaded. Please try again.',
    })
  }
}
