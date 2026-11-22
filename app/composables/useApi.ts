// $fetch com redirecionamento para o login quando a sessão expira
export function api<T = any>(url: string, opts: any = {}) {
  return $fetch<T>(url, opts).catch((e: any) => {
    if (e?.statusCode === 401 || e?.response?.status === 401) {
      useState('user').value = null
      navigateTo('/login')
    }
    throw e
  })
}

export function errorText(e: any) {
  return e?.data?.statusMessage || e?.data?.message || e?.statusMessage || e?.message || 'Erro inesperado'
}
