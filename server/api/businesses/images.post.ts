import { uploadImage } from '@server/domains/media/upload'

export default defineEventHandler((event) => uploadImage(event, 'businesses'))
