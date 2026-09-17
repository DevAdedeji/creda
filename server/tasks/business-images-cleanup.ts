import { cleanupBusinessImages } from '@server/domains/businesses/image-storage'

export default defineTask({
  meta: { name: 'business-images-cleanup', description: 'Remove unused ByteShip business images.' },
  async run() {
    const processed = await cleanupBusinessImages()
    return { result: { processed } }
  },
})
