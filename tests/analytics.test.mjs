import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { isProductionHost } from '../shared/site.ts'

const analyticsSource = readFileSync(new URL('../app/utils/analytics.ts', import.meta.url), 'utf8')
function tracker({
  hostname = 'creda.ng',
  dev = false,
  client = true,
  dnt,
  gpc,
  ready = true,
  throws = false,
} = {}) {
  const sent = []
  const listeners = []
  const window = { location: { hostname } }
  const provider = {
    track: (...args) => {
      if (throws) throw new Error('Unavailable')
      sent.push(args)
    },
  }
  if (ready) window.sabilytics = provider
  const exports = {}
  const code = ts.transpileModule(
    analyticsSource
      .replaceAll('import.meta.dev', String(dev))
      .replaceAll('import.meta.client', String(client)),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText
  vm.runInNewContext(code, {
    exports,
    require: () => ({ isProductionHost }),
    window,
    navigator: { doNotTrack: dnt, globalPrivacyControl: gpc },
    document: { querySelector: () => ({ addEventListener: (_, cb) => listeners.push(cb) }) },
  })
  return {
    track: exports.trackAnalyticsEvent,
    sent,
    load() {
      window.sabilytics = provider
      listeners.forEach((cb) => cb())
    },
  }
}
test('events are restricted to production and never run on the server', () => {
  for (const options of [
    { dev: true },
    { client: false },
    { hostname: 'localhost' },
    { hostname: 'creda.adedeji.xyz' },
  ]) {
    const t = tracker(options)
    t.track('homepage_viewed')
    assert.equal(t.sent.length, 0)
  }
  const t = tracker()
  t.track('homepage_viewed')
  assert.equal(t.sent.length, 1)
})
test('browser privacy preferences prevent custom events', () => {
  for (const options of [{ dnt: '1' }, { gpc: true }]) {
    const t = tracker(options)
    t.track('business_link_clicked')
    assert.equal(t.sent.length, 0)
  }
})
test('events wait for the existing script and provider failures do not interrupt actions', () => {
  const t = tracker({ ready: false })
  t.track('search_submitted', { surface: 'homepage' })
  assert.equal(t.sent.length, 0)
  t.load()
  assert.equal(t.sent.length, 1)
  assert.doesNotThrow(() => tracker({ throws: true }).track('signup_completed'))
})
test('discovery page events deduplicate hydration and exclude private routes and search text', () => {
  const hooks = {}
  const events = []
  const route = { value: { path: '/' } }
  const source = readFileSync(
    new URL('../app/plugins/discovery-analytics.client.ts', import.meta.url),
    'utf8',
  )
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, {
    exports: {},
    require: () => ({ trackAnalyticsEvent: (...args) => events.push(args) }),
    defineNuxtPlugin: (fn) =>
      fn({
        hook: (name, fn) => {
          hooks[name] = fn
        },
      }),
    useRouter: () => ({ currentRoute: route }),
  })
  hooks['app:mounted']()
  hooks['page:finish']()
  assert.equal(events.length, 1)
  route.value = { path: '/explore', fullPath: '/explore?q=private+search' }
  hooks['page:finish']()
  hooks['page:finish']()
  assert.equal(events.length, 2)
  route.value = { path: '/dashboard/businesses' }
  hooks['page:finish']()
  assert.equal(events.length, 2)
  route.value = { path: '/' }
  hooks['page:finish']()
  assert.equal(events.length, 3)
  assert.equal(JSON.stringify(events).includes('private'), false)
})
