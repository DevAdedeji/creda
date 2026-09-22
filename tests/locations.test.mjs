import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const source = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const businesses = moduleUrl(await source('../shared/businesses.ts'))
const states = moduleUrl(await source('../shared/nigeriaStates.ts'))
const categories = moduleUrl(
  (await source('../shared/seo/categories.ts')).replace(
    "'../businesses'",
    JSON.stringify(businesses),
  ),
)
const { collectionPage, collectionPagePath } = await import(categories)
const { locationStates, citySlug, parseLocationParts, businessLocationPath, locationSitemapPaths } =
  await import(
    moduleUrl(
      (await source('../shared/seo/locations.ts'))
        .replace("'../nigeriaStates'", JSON.stringify(states))
        .replace("'./categories'", JSON.stringify(categories)),
    )
  )
test('36 states and FCT have unique canonical destinations', () => {
  assert.equal(locationStates.length, 37)
  assert.equal(new Set(locationStates.map((s) => s.slug)).size, 37)
  assert.equal(
    parseLocationParts(['federal-capital-territory']).state.name,
    'Federal Capital Territory',
  )
})
test('city normalization rejects URL syntax and unknown routes', () => {
  assert.equal(citySlug(' Port   Harcourt '), 'port-harcourt')
  for (const input of ['%', '_', '../ikeja', 'Lagos/Nigeria', '<script>', ''])
    assert.equal(citySlug(input), null)
  for (const parts of [
    [],
    ['unknown'],
    ['Lagos'],
    ['lagos', 'Ikeja'],
    ['lagos', 'ikeja', 'unknown'],
    ['lagos', 'ikeja', 'retail', 'extra'],
  ])
    assert.equal(parseLocationParts(parts), null)
  assert.equal(parseLocationParts(['lagos', 'ikeja', 'retail']).category.value, 'retail')
})
test('online headquarters are not represented as in-person destinations', () => {
  assert.equal(
    businessLocationPath({ state: 'Lagos', city: 'Ikeja', operationMode: 'online' }),
    null,
  )
  assert.equal(
    businessLocationPath({ state: 'Lagos State', city: 'Ikeja', operationMode: 'physical' }),
    '/locations/lagos/ikeja',
  )
  assert.equal(
    businessLocationPath({ state: 'FCT', city: null, operationMode: 'hybrid' }),
    '/locations/federal-capital-territory',
  )
})
test('sitemaps omit empty places and category combinations with fewer than three listings', () => {
  assert.deepEqual(
    locationSitemapPaths([
      { state: 'lagos', city: 'ikeja', category: 'retail', total: 3 },
      { state: 'lagos', city: 'ikeja', category: 'food', total: 2 },
      { state: 'oyo', city: 'ibadan', category: 'retail', total: 0 },
      { state: 'unknown', city: 'ikeja', category: 'retail', total: 9 },
    ]),
    ['/locations', '/locations/lagos', '/locations/lagos/ikeja', '/locations/lagos/ikeja/retail'],
  )
  assert.deepEqual(locationSitemapPaths([]), [])
})
test('pagination rejects invalid offsets and keeps distinct canonical URLs', () => {
  for (const value of ['0', '-1', '01', '2.5', '10000', ['1', '2']]) {
    assert.equal(collectionPage(value), null)
  }
  assert.equal(collectionPage(undefined), 1)
  assert.equal(collectionPagePath('/locations/lagos/ikeja', 1), '/locations/lagos/ikeja')
  assert.equal(collectionPagePath('/locations/lagos/ikeja', 2), '/locations/lagos/ikeja?page=2')
})
