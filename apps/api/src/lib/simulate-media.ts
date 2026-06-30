export interface SimulatedMediaEntry {
  base64: string
  mimeType: string
}

const store = new Map<string, SimulatedMediaEntry>()

export function storeSimulatedMedia(id: string, entry: SimulatedMediaEntry) {
  store.set(id, entry)
}

export function getSimulatedMedia(id: string): SimulatedMediaEntry | undefined {
  return store.get(id)
}

export function clearSimulatedMedia(id: string) {
  store.delete(id)
}
