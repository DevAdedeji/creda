import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const businessesUrl = moduleUrl(
  await readFile(new URL('../shared/businesses.ts', import.meta.url), 'utf8'),
)
const categoriesSource = await readFile(
  new URL('../shared/seo/categories.ts', import.meta.url),
  'utf8',
)
const { categoryCatalog, getBusinessCategory, categoryPath, collectionPage, collectionPagePath } =
  await import(
    moduleUrl(categoriesSource.replace("'../businesses'", JSON.stringify(businessesUrl)))
  )
const { businessCategoryValues } = await import(businessesUrl)

test('every supported category has one canonical destination and useful introduction', () => {
  assert.deepEqual(
    categoryCatalog.map((category) => category.value),
    businessCategoryValues,
  )
  assert.equal(
    new Set(categoryCatalog.map((category) => category.slug)).size,
    businessCategoryValues.length,
  )
  for (const category of categoryCatalog) {
    assert.match(category.slug, /^[a-z]+(?:-[a-z]+)*$/)
    assert.equal(categoryPath(category.value), `/categories/${category.slug}`)
    assert.equal(getBusinessCategory(category.slug)?.value, category.value)
    assert.ok(category.intro.length > 90)
  }
})

test('unrecognized categories cannot resolve to a public category page', () => {
  for (const slug of ['__proto__', 'unknown', 'Finance', 'home_services', '../finance', '']) {
    assert.equal(getBusinessCategory(slug), undefined)
  }
})

test('pagination rejects arrays, malformed, zero and unbounded offsets', () => {
  assert.equal(collectionPage(undefined), 1)
  assert.equal(collectionPage('1'), 1)
  assert.equal(collectionPage('9999'), 9999)
  for (const page of [
    null,
    1,
    [],
    ['1', '2'],
    '',
    '0',
    '-1',
    '1.5',
    '01',
    '1e2',
    '10000',
    'Infinity',
    ' 2',
  ]) {
    assert.equal(collectionPage(page), null, String(page))
  }
})

test('page one and subsequent pages have distinct canonical URLs', () => {
  assert.equal(collectionPagePath('/categories/finance', 1), '/categories/finance')
  assert.equal(collectionPagePath('/categories/finance', 2), '/categories/finance?page=2')
  assert.notEqual(
    collectionPagePath('/categories/software', 1),
    collectionPagePath('/categories/software', 2),
  )
})
