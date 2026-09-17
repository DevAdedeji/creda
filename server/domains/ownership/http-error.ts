import { createError } from 'h3'
import { OwnershipDomainError } from './service'

export function rethrowOwnershipError(error: unknown): never {
  if (error instanceof OwnershipDomainError) {
    throw createError({
      statusCode: error.code === 'not_found' ? 404 : 409,
      statusMessage: error.message,
    })
  }
  throw error
}
