import { requestContentful } from '~/composables/useContentfulRequest'
import { emptyHomepageContent, type HomepageContent } from '~/lib/contentful'

export function useHomepage() {
  return useAsyncData<HomepageContent>(
    'homepage',
    (_nuxtApp, { signal }) =>
      requestContentful('/api/contentful/homepage', emptyHomepageContent, signal),
    { default: emptyHomepageContent },
  )
}
