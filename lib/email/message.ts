import { z } from 'zod'

export type AccountEmail = {
  to: string
  subject: string
  heading: string
  body: string
  action: { label: string; url: string }
  footer: string
}

// Persist the complete provider payload so retries remain identical across deployments.
export const emailDeliverySchema = z
  .object({
    from: z.string().min(1).max(320),
    to: z.array(z.email()).length(1),
    subject: z
      .string()
      .min(1)
      .max(500)
      .refine((value) => !/[\r\n]/.test(value)),
    html: z.string().min(1).max(100_000),
    text: z.string().min(1).max(30_000),
  })
  .strict()

export type EmailDelivery = z.output<typeof emailDeliverySchema>
