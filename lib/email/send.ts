import { z } from 'zod'
import { emailDeliverySchema, type AccountEmail, type EmailDelivery } from './message'

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  )
}

function renderEmail(message: AccountEmail) {
  const actionUrl = new URL(message.action.url)
  if (!['http:', 'https:'].includes(actionUrl.protocol)) {
    throw new Error('Account email link must use HTTP or HTTPS')
  }

  const text = `${message.heading}\n\n${message.body}\n\n${message.action.label}: ${actionUrl}\n\n${message.footer}\n\n— Creda`
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(message.subject)}</title></head>
<body style="margin:0;padding:32px 16px;background:#f7f9f3;color:#172f27;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
    <tr><td style="padding:0 0 20px;font-size:24px;font-weight:700;color:#143e32">creda.</td></tr>
    <tr><td style="padding:36px;border:1px solid #dfe6dc;border-radius:16px;background:#fff">
      <h1 style="margin:0 0 18px;font-size:27px;line-height:1.2;color:#143e32">${escapeHtml(message.heading)}</h1>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#52645a">${escapeHtml(message.body).replaceAll('\n', '<br>')}</p>
      <a href="${escapeHtml(actionUrl.toString())}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#143e32;color:#fff;font-size:15px;font-weight:700;text-decoration:none">${escapeHtml(message.action.label)}</a>
      <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#657069">If the button does not work, copy this link:<br><a href="${escapeHtml(actionUrl.toString())}" style="color:#143e32;word-break:break-all">${escapeHtml(actionUrl.toString())}</a></p>
      <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #dfe6dc;font-size:13px;line-height:1.6;color:#657069">${escapeHtml(message.footer)}</p>
    </td></tr>
  </table>
</body>
</html>`

  return { text, html }
}

export class EmailDeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly permanent = false,
    readonly retryAfterSeconds = 60,
  ) {
    super(code)
    this.name = 'EmailDeliveryError'
  }
}

export function prepareEmail(message: AccountEmail): EmailDelivery {
  const { text, html } = renderEmail(message)
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    (process.env.NODE_ENV !== 'production' ? 'Creda <no-reply@creda.ng>' : '')
  const parsed = emailDeliverySchema.safeParse({
    from,
    to: [message.to],
    subject: message.subject,
    text,
    html,
  })
  if (!parsed.success) throw new EmailDeliveryError('email_payload_invalid', true)
  return parsed.data
}

export async function deliverEmail(
  payload: EmailDelivery,
  idempotencyKey?: string,
): Promise<string | null> {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[Creda development email] Preview only; no email sent', {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    })
    return null
  }
  const key = process.env.RESEND_API_KEY
  if (!key) throw new EmailDeliveryError('email_configuration_missing')
  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new EmailDeliveryError('email_provider_network')
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const providerError = z.object({ name: z.string() }).safeParse(body)
    const mismatchedPayload =
      response.status === 409 &&
      providerError.success &&
      providerError.data.name === 'invalid_idempotent_request'
    const permanent =
      mismatchedPayload ||
      (response.status >= 400 &&
        response.status < 500 &&
        ![401, 403, 408, 409, 429].includes(response.status))
    const retryAfter = Number(response.headers.get('retry-after'))
    throw new EmailDeliveryError(
      `email_provider_${response.status}`,
      permanent,
      Number.isFinite(retryAfter) ? Math.min(3600, Math.max(60, retryAfter)) : 60,
    )
  }
  const result = z.object({ id: z.string().min(1).max(128) }).safeParse(body)
  if (!result.success) throw new EmailDeliveryError('email_provider_invalid_response')
  return result.data.id
}

export async function sendAccountEmail(message: AccountEmail): Promise<void> {
  await deliverEmail(prepareEmail(message))
}
