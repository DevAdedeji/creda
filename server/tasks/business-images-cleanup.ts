import { cleanupBusinessImages } from '@server/domains/businesses/image-storage'

export default defineTask({
  meta: {
    name: 'business-images-cleanup',
    description: 'Remove unused Byteship business and review images.',
  },
  async run() {
    const processed = await cleanupBusinessImages()
    return { result: { processed } }
  },
})
