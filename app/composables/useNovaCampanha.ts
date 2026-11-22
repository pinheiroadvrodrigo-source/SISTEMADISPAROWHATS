import type { Template, Mapping } from '#shared/template'

export interface NovaCampanha {
  name: string
  fileName: string
  columns: string[]
  rows: Record<string, unknown>[]
  phoneColumn: string
  nameColumn: string
  channelId: number | null
  template: Template | null
  mapping: Mapping
  headerMediaUrl: string
  when: 'now' | 'later'
  scheduledLocal: string
  ratePerSecond: number
}

const vazio = (): NovaCampanha => ({
  name: '',
  fileName: '',
  columns: [],
  rows: [],
  phoneColumn: '',
  nameColumn: '',
  channelId: null,
  template: null,
  mapping: {},
  headerMediaUrl: '',
  when: 'now',
  scheduledLocal: '',
  ratePerSecond: 20,
})

export function useNovaCampanha() {
  const state = useState<NovaCampanha>('nova-campanha', vazio)
  const reset = () => (state.value = vazio())
  return { c: state, reset }
}
