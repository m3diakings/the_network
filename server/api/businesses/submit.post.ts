import { serverSupabaseClient } from '#supabase/server'

type SubmissionBody = {
  categoryId: string
  businessName: string
  phone: string
  website: string
  bio: string
  address: string
  email: string
  licenseNumber: string
  licenseState?: string
  licenseExpiresAt?: string | null
  insuranceCarrier?: string | null
  insuranceExpiresAt?: string | null
  emergencyAvailable?: boolean
  yearsInBusiness?: number | null
  logoPath: string
  licensePath: string
  insurancePath: string
  honeypot?: string
  turnstileToken?: string
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 5
const submissionLog = new Map<string, number[]>()

function pruneAttempts(timestamps: number[], now: number) {
  return timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
}

async function verifyTurnstile(token: string | undefined, secret: string, ip: string) {
  if (!secret) return true
  if (!token) return false
  try {
    const response = await $fetch<{ success: boolean }>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: ip
        })
      }
    )
    return Boolean(response?.success)
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmissionBody>(event)

  if (body?.honeypot) {
    return { ok: true }
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const recent = pruneAttempts(submissionLog.get(ip) ?? [], now)
  if (recent.length >= RATE_LIMIT_MAX) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many submissions from this network. Please try again later.'
    })
  }

  const config = useRuntimeConfig()
  const captchaOk = await verifyTurnstile(body.turnstileToken, config.turnstileSecretKey, ip)
  if (!captchaOk) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CAPTCHA verification failed. Please refresh and try again.'
    })
  }

  const required: Array<keyof SubmissionBody> = [
    'categoryId',
    'businessName',
    'phone',
    'website',
    'bio',
    'address',
    'email',
    'licenseNumber',
    'logoPath',
    'licensePath',
    'insurancePath'
  ]
  for (const key of required) {
    if (!body[key] || typeof body[key] !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${key}`
      })
    }
  }

  if (body.bio.length > 5000 || body.businessName.length > 200 || body.email.length > 320) {
    throw createError({ statusCode: 400, statusMessage: 'One or more fields exceed the maximum length.' })
  }
  if (body.licenseNumber.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'License number is too long.' })
  }

  const isoDate = /^\d{4}-\d{2}-\d{2}$/
  if (body.licenseExpiresAt && !isoDate.test(body.licenseExpiresAt)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid license expiration date.' })
  }
  if (body.insuranceExpiresAt && !isoDate.test(body.insuranceExpiresAt)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid insurance expiration date.' })
  }

  const years = typeof body.yearsInBusiness === 'number' && Number.isFinite(body.yearsInBusiness)
    ? Math.floor(body.yearsInBusiness)
    : null
  if (years !== null && (years < 0 || years > 200)) {
    throw createError({ statusCode: 400, statusMessage: 'Years in business is out of range.' })
  }

  const licenseState = (body.licenseState ?? 'FL').trim().toUpperCase().slice(0, 2) || 'FL'

  const supabase = await serverSupabaseClient(event)
  const { error } = await supabase.from('businesses').insert({
    category_id: body.categoryId,
    name: body.businessName,
    phone: body.phone,
    website_url: body.website,
    bio: body.bio,
    address: body.address,
    logo_path: body.logoPath,
    license_document_path: body.licensePath,
    insurance_document_path: body.insurancePath,
    submitter_email: body.email,
    license_number: body.licenseNumber.trim(),
    license_state: licenseState,
    license_expires_at: body.licenseExpiresAt || null,
    insurance_carrier: body.insuranceCarrier?.trim() || null,
    insurance_expires_at: body.insuranceExpiresAt || null,
    emergency_available: Boolean(body.emergencyAvailable),
    years_in_business: years,
    status: 'pending_review'
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  submissionLog.set(ip, [...recent, now])

  return { ok: true }
})
