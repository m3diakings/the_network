import { serverSupabaseClient } from '#supabase/server'

type SubmissionBody = {
  categoryId: string
  businessName: string
  phone: string
  website: string
  bio: string
  address: string
  email: string
  servesStatewide?: boolean
  serviceAreas?: string[]
  logoPath: string
  licensePath: string
  insurancePath: string
  honeypot?: string
  turnstileToken?: string
}

const MAX_SERVICE_AREAS = 20

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

  const servesStatewide = Boolean(body.servesStatewide)
  const rawAreas = Array.isArray(body.serviceAreas) ? body.serviceAreas : []
  const serviceAreas = servesStatewide
    ? []
    : Array.from(new Set(rawAreas.filter(s => typeof s === 'string' && s.length > 0 && s.length <= 80)))

  if (!servesStatewide) {
    if (serviceAreas.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Select at least one service-area city or toggle "Serves all of Florida".' })
    }
    if (serviceAreas.length > MAX_SERVICE_AREAS) {
      throw createError({ statusCode: 400, statusMessage: `Pick at most ${MAX_SERVICE_AREAS} cities, or toggle "Serves all of Florida".` })
    }
  }

  const supabase = await serverSupabaseClient(event)

  if (serviceAreas.length > 0) {
    const { data: validCities, error: cityError } = await supabase
      .from('cities')
      .select('slug')
      .in('slug', serviceAreas)
    if (cityError) {
      throw createError({ statusCode: 500, statusMessage: cityError.message })
    }
    const validSet = new Set((validCities ?? []).map(c => c.slug))
    const unknown = serviceAreas.filter(s => !validSet.has(s))
    if (unknown.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `Unknown service-area cities: ${unknown.join(', ')}` })
    }
  }

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
    serves_statewide: servesStatewide,
    service_areas: serviceAreas,
    status: 'pending_review'
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  submissionLog.set(ip, [...recent, now])

  return { ok: true }
})
