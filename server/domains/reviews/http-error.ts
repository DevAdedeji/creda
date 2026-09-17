import { createError } from 'h3'
import { ReviewDomainError } from './service'

export function rethrowReviewError(error: unknown): never {
  if (error instanceof ReviewDomainError) {
    throw createError({ statusCode: error.statusCode, statusMessage: error.message })
  }
  throw error
}
