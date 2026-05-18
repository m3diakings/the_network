export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()

  let userId = useSupabaseUser().value?.id
  if (!userId) {
    const { data } = await supabase.auth.getSession()
    userId = data.session?.user?.id
  }

  if (!userId) {
    return navigateTo({
      path: '/admin/login',
      query: to.fullPath === '/admin' ? {} : { redirect: to.fullPath }
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.is_admin) {
    await supabase.auth.signOut()
    return navigateTo({
      path: '/admin/login',
      query: { error: 'not-admin' }
    })
  }
})
