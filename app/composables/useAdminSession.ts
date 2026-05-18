export function useAdminSession() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function signOut() {
    await supabase.auth.signOut()
    await navigateTo('/admin/login')
  }

  return { user, signOut }
}
