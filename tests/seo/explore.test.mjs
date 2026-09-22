import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  directoryCanonicalPath,
  directoryPage,
  directoryPageOutOfRange,
} from '../../shared/seo/explore.ts'

test('directory pagination rejects malformed, repeated and unbounded page values', () => {
  for (const page of [
    '',
    null,
    '0',
    '-1',
    '1.5',
    '01',
    ' 2 ',
    '1e2',
    '10001',
    '9007199254740992',
    ['1', '2'],
  ]) {
    assert.equal(directoryPage(page), null, `unexpected valid page: ${JSON.stringify(page)}`)
  }
  assert.equal(directoryPage(undefined), 1)
  assert.equal(directoryPage('1'), 1)
  assert.equal(directoryPage('2'), 2)
  assert.equal(directoryPage('10000'), 10000)
})

test('each directory page has its own canonical and campaign links consolidate to it', () => {
  assert.equal(directoryCanonicalPath({}), '/explore')
  assert.equal(directoryCanonicalPath({ page: '1' }), '/explore')
  assert.equal(directoryCanonicalPath({ page: '2' }), '/explore?page=2')
  assert.equal(
    directoryCanonicalPath({
      page: '2',
      utm_source: 'newsletter',
      ref: 'friend',
      gclid: 'campaign',
    }),
    '/explore?page=2',
  )
})

test('search, filter, sorting and AI variants do not claim to duplicate the unfiltered directory', () => {
  for (const key of [
    'q',
    'category',
    'operationMode',
    'city',
    'state',
    'location',
    'sort',
    'mode',
    'intent',
    'unknown',
  ]) {
    assert.equal(directoryCanonicalPath({ [key]: 'value', page: '2' }), null, key)
  }
  assert.equal(directoryCanonicalPath({ category: ['fintech', 'software'] }), null)
  assert.equal(directoryCanonicalPath({ page: 'bad' }), null)
})

test('empty first pages stay valid but nonexistent subsequent pages are rejected', () => {
  assert.equal(directoryPageOutOfRange(1, 0, 12), false)
  assert.equal(directoryPageOutOfRange(2, 0, 12), true)
  assert.equal(directoryPageOutOfRange(2, 13, 12), false)
  assert.equal(directoryPageOutOfRange(3, 13, 12), true)
  assert.equal(directoryPageOutOfRange(2, 12, 12), true)
})
