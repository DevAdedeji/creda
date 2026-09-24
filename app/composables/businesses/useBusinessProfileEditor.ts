import type { ManagedBusiness } from '~~/shared/businesses'
import {
  businessProfileDetailsSchema,
  emptyBusinessProfile,
  priceToMinor,
  type BusinessOffering,
  type BusinessProfileDetails,
} from '~~/shared/business-profile'
import { saveBusinessProfileDetails } from '@/services/business-profile'
import { apiErrorMessage } from '@/utils/apiError'

export interface OfferingDraft {
  key: number
  name: string
  kind: 'service' | 'product'
  description: string
  priceType: BusinessOffering['price']['type']
  amount: string
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR'
  unit: 'once' | 'item' | 'session' | 'hour' | 'day' | 'month' | 'year'
}
export function useBusinessProfileEditor(business: ManagedBusiness) {
  let nextKey = 0
  const offerings = ref<OfferingDraft[]>([])
  let starterKey: number | null = null
  const faqs = ref<{ key: number; question: string; answer: string }[]>([])
  const practical = ref<BusinessProfileDetails['practical']>({})
  const saved = ref<BusinessProfileDetails>(
    businessProfileDetailsSchema.parse(business.profileDetails ?? emptyBusinessProfile()),
  )
  const revision = ref(business.profileDetailsRevision)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const baseline = ref('')
  const toast = useAppToast()
  const isEmptyStarter = (item: OfferingDraft) =>
    item.key === starterKey &&
    !item.name.trim() &&
    !item.description.trim() &&
    item.kind === 'service' &&
    item.priceType === 'unspecified' &&
    !item.amount &&
    item.currency === 'NGN' &&
    item.unit === 'once'
  const offeringCount = computed(
    () => offerings.value.filter((item) => !isEmptyStarter(item)).length,
  )
  const snapshot = () =>
    JSON.stringify({
      offerings: offerings.value
        .filter((item) => !isEmptyStarter(item))
        .map(({ key: _key, ...item }) => item),
      practical: practical.value,
      faqs: faqs.value.map(({ key: _key, ...item }) => item),
    })
  function ensureStarter() {
    if (offerings.value.length) return
    addOffering()
    starterKey = offerings.value[0]!.key
  }
  function reset() {
    offerings.value = saved.value.offerings.map((item) => ({
      key: nextKey++,
      name: item.name,
      kind: item.kind,
      description: item.description,
      priceType: item.price.type,
      amount: 'amountMinor' in item.price ? (item.price.amountMinor / 100).toFixed(2) : '',
      currency: 'currency' in item.price ? item.price.currency : 'NGN',
      unit: 'unit' in item.price ? item.price.unit : 'once',
    }))
    starterKey = null
    ensureStarter()
    practical.value = { ...saved.value.practical }
    faqs.value = saved.value.faqs.map((item) => ({ key: nextKey++, ...item }))
    error.value = ''
    fieldErrors.value = {}
    baseline.value = snapshot()
  }
  reset()
  const dirty = computed(() => snapshot() !== baseline.value)
  function addOffering() {
    offerings.value.push({
      key: nextKey++,
      name: '',
      kind: 'service',
      description: '',
      priceType: 'unspecified',
      amount: '',
      currency: 'NGN',
      unit: 'once',
    })
  }
  function removeOffering(index: number) {
    offerings.value.splice(index, 1)
    fieldErrors.value = {}
    ensureStarter()
  }
  function addFaq() {
    faqs.value.push({ key: nextKey++, question: '', answer: '' })
  }
  async function save(): Promise<boolean> {
    if (saving.value) return false
    error.value = ''
    fieldErrors.value = {}
    const offeringRows = offerings.value
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !isEmptyStarter(item))
    const result = businessProfileDetailsSchema.safeParse({
      offerings: offeringRows.map(({ item }) => ({
        name: item.name,
        kind: item.kind,
        description: item.description,
        price:
          item.priceType === 'fixed' || item.priceType === 'from'
            ? {
                type: item.priceType,
                amountMinor: priceToMinor(item.amount),
                currency: item.currency,
                unit: item.unit,
              }
            : { type: item.priceType },
      })),
      practical: practical.value,
      faqs: faqs.value.map(({ question, answer }) => ({ question, answer })),
    })
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = [...issue.path]
        if (path[0] === 'offerings' && typeof path[1] === 'number') {
          path[1] = offeringRows[path[1]]!.index
        }
        const key = path.join('.')
        fieldErrors.value[key] = key.endsWith('amountMinor')
          ? 'Enter a valid price with up to two decimal places.'
          : issue.message
      }
      error.value = 'Check the highlighted details before saving.'
      return false
    }
    saving.value = true
    try {
      const response = await saveBusinessProfileDetails(business.id, result.data, revision.value)
      saved.value = response.details
      revision.value = response.revision
      reset()
      toast.success(
        'Business details saved',
        'Your services, business information and FAQs are updated.',
      )
      return true
    } catch (cause) {
      error.value = apiErrorMessage(cause, 'Could not save your details. Please try again.')
      return false
    } finally {
      saving.value = false
    }
  }
  return {
    offerings,
    faqs,
    practical,
    saving,
    error,
    fieldErrors,
    dirty,
    addOffering,
    removeOffering,
    offeringCount,
    addFaq,
    reset,
    save,
  }
}
