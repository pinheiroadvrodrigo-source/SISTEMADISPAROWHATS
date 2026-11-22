export interface Canal {
  id: number
  name: string
  phone_number_id: string
  waba_id: string
  display_phone: string
  verified_name: string
  quality_rating: string | null
  token_end: string
  created_at: string
}

export function useCanais() {
  const canais = useState<Canal[]>('canais', () => [])
  const loading = ref(false)
  async function load() {
    loading.value = true
    try {
      canais.value = await api<Canal[]>('/api/channels')
    } finally {
      loading.value = false
    }
  }
  return { canais, loading, load }
}
