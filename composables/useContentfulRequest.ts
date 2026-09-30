export async function requestContentful<T>(
  path: string,
  fallback: () => T,
  signal?: AbortSignal,
): Promise<T> {
  try {

    const data: unknown = await $fetch(path, { signal, retry: 0 })
    return data as T
  } catch (error) {
    if (import.meta.dev) {
      console.warn(`[contentful] Could not load ${path} — using the built-in copy.`, error)
    }
    return fallback()
  }
}
