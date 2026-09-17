import { createError } from 'h3'
import { BusinessDomainError } from './service'

export function rethrowBusinessError(error: unknown): never {
  if (error instanceof BusinessDomainError) {
    const statusCode = error.code === 'duplicate' ? 409 : error.code === 'not_found' ? 404 : 409
    throw createError({ statusCode, statusMessage: error.message })
  }
  throw error
}
