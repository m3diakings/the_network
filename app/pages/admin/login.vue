<script setup lang="ts">
definePageMeta({
  title: 'Admin Sign In'
})

useSeoMeta({
  title: 'Admin Sign In',
  robots: 'noindex, nofollow'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const redirectTarget = computed(() => {
  const q = route.query.redirect
  if (typeof q === 'string' && q.startsWith('/admin')) return q
  return '/admin/listings'
})

if (route.query.error === 'not-admin') {
  errorMessage.value = 'That account does not have admin access.'
}

async function checkAdminAndRedirect(userId: string) {
  if (!userId) return false
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data?.is_admin) return false
  await navigateTo(redirectTarget.value)
  return true
}

onMounted(async () => {
  let existingId = user.value?.id
  if (!existingId) {
    const { data } = await supabase.auth.getSession()
    existingId = data.session?.user?.id
  }
  if (existingId) {
    await checkAdminAndRedirect(existingId)
  }
})

async function onSubmit() {
  errorMessage.value = null

  if (!email.value || !password.value) {
    errorMessage.value = 'Email and password are required.'
    return
  }

  submitting.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })
    if (error || !data?.user?.id) {
      errorMessage.value = error?.message ?? 'Invalid credentials.'
      return
    }

    const ok = await checkAdminAndRedirect(data.user.id)
    if (!ok) {
      await supabase.auth.signOut()
      errorMessage.value = 'That account does not have admin access.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-elevated/40 px-4 py-12">
    <UCard
      :ui="{
        root: 'w-full max-w-md rounded-2xl bg-default shadow-lg shadow-black/10'
      }"
    >
      <template #header>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary">
            Florida Trade Specialists
          </p>
          <h1 class="text-xl font-semibold text-highlighted">
            Admin sign in
          </h1>
          <p class="text-sm text-muted">
            Manage submissions and listings.
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="submitting"
            size="md"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            :disabled="submitting"
            size="md"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="submitting"
          :disabled="submitting"
        >
          Sign in
        </UButton>
      </form>

      <template #footer>
        <p class="text-xs text-muted">
          Access is granted manually. Contact your administrator to request an account.
        </p>
      </template>
    </UCard>
  </div>
</template>
