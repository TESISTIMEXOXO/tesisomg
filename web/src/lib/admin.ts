const SUPERADMIN_EMAIL = 'pinz.tesis@gmail.com'

export function esSuperadmin(email: string | null | undefined) {
  return email?.toLowerCase() === SUPERADMIN_EMAIL
}
