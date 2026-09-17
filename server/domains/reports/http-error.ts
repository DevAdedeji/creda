import { createError } from 'h3'
import { ReportDomainError } from './service'

export function rethrowReportError(error: unknown): never {
  if (error instanceof ReportDomainError)
    throw createError({ statusCode: error.statusCode, statusMessage: error.message })
  throw error
}
