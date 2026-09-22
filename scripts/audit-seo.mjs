import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'

const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi'))].map(([tag]) =>
    attributes(tag),
  )
const decode = (text) =>
  text.replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([a-f\d]+));/gi, (entity, decimal, hex) => {
    if (decimal || hex) {
      const point = Number.parseInt(decimal || hex, hex ? 16 : 10)
      return point <= 0x10ffff ? String.fromCodePoint(point) : entity
    }
    return (
      { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' }[
        entity.toLowerCase()
      ] ?? entity
    )
  })
const textContent = (html) =>
  decode(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(
      ([, key, double, single, bare]) => [key.toLowerCase(), decode(double ?? single ?? bare)],
    ),
  )
}

export function inspectHtml(
  html,
  { canonical, canonicalRequired = true, indexable = true, robotsHeader = '' },
) {
  const failures = []
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
  const meta = tags(head, 'meta')
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
  if (titles.length !== 1 || !textContent(titles[0]?.[1] ?? ''))
    failures.push('Expected one nonempty title')
  if (!meta.some((tag) => tag.name?.toLowerCase() === 'description' && tag.content?.trim()))
    failures.push('Missing description')
  const canonicals = tags(head, 'link').filter((tag) =>
    tag.rel?.toLowerCase().split(/\s+/).includes('canonical'),
  )
  if (
    (canonicalRequired || canonicals.length > 0) &&
    (canonicals.length !== 1 || canonicals[0]?.href !== canonical)
  )
    failures.push(`Canonical must be ${canonical}`)
  const robots = [
    robotsHeader,
    ...meta
      .filter((tag) => ['robots', 'googlebot'].includes(tag.name?.toLowerCase()))
      .map((tag) => tag.content),
  ].join(',')
  const noindex = /\b(noindex|none)\b/i.test(robots)
  if (noindex === indexable)
    failures.push(indexable ? 'Public page is noindex' : 'Private page must be noindex')
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
  if (headings.length !== 1 || !textContent(headings[0]?.[1] ?? ''))
    failures.push('Expected one server-rendered H1')
  const jsonLd = [
    ...html.matchAll(/<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi),
  ].filter(([, attrs]) => attributes(attrs).type === 'application/ld+json')
  if (indexable && !jsonLd.length) failures.push('Missing server-rendered JSON-LD')
  for (const [, , source] of jsonLd) {
    try {
      const document = JSON.parse(source)
      if (!document || typeof document !== 'object')
        failures.push('JSON-LD must contain an object or array')
    } catch {
      failures.push('Invalid JSON-LD JSON')
    }
  }
  const images = tags(html, 'img')
  const unsizedImages = images.filter((image) => !image.width || !image.height).length
  const oversizedFixedImages = images.filter(
    (image) => Number(image.width) >= 1200 && !image.sizes,
  ).length
  return {
    failures,
    title: textContent(titles[0]?.[1] ?? ''),
    htmlBytes: Buffer.byteLength(html),
    imageCount: images.length,
    unsizedImages,
    oversizedFixedImages,
    scriptCount: tags(html, 'script').filter((script) => script.src).length,
  }
}

export function sitemapLocations(xml, origin) {
  if (!/<(?:sitemapindex|urlset)\b/i.test(xml)) throw new Error('Expected a sitemap XML document')
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(([, value]) => {
    const url = new URL(decode(value.trim()))
    if (url.origin !== origin || url.username || url.password || url.hash)
      throw new Error('Sitemap contains an unexpected origin or URL')
    return url
  })
}

export async function auditSite(
  { origin, canonicalOrigin = origin, sample = 5, indexable = true },
  request = fetch,
) {
  const results = []
  const fetchPage = async (path) => {
    const start = performance.now()
    const response = await request(new URL(path, origin), {
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
      headers: { 'User-Agent': 'Creda-SEO-Audit/1.0' },
    })
    const html = await response.text()
    return { response, html, elapsedMs: Math.round(performance.now() - start) }
  }
  const record = (path, failures, metrics = {}) => results.push({ path, failures, ...metrics })
  const robots = await fetchPage('/robots.txt')
  const robotsFailures = []
  if (robots.response.status !== 200) robotsFailures.push('Expected HTTP 200 for robots.txt')
  if (indexable) {
    if (!/^Sitemap:\s*/im.test(robots.html))
      robotsFailures.push('Expected robots.txt with a sitemap')
  } else {
    if (/^Sitemap:\s*/im.test(robots.html))
      robotsFailures.push('Private robots.txt must not advertise a sitemap')
    if (!/\bnoindex\b/i.test(robots.response.headers.get('x-robots-tag') ?? ''))
      robotsFailures.push('Private robots.txt must have X-Robots-Tag: noindex')
    const sitemap = await fetchPage('/sitemap.xml')
    const failures = []
    if (sitemap.response.status !== 404) failures.push('Private sitemap must return HTTP 404')
    if (!/\bnoindex\b/i.test(sitemap.response.headers.get('x-robots-tag') ?? ''))
      failures.push('Private sitemap must have X-Robots-Tag: noindex')
    record('/sitemap.xml', failures)
  }
  record('/robots.txt', robotsFailures)
  const queue = indexable ? ['/sitemap.xml'] : []
  const visited = new Set()
  const pageUrls = new Set()
  while (queue.length && visited.size < 10) {
    const path = queue.shift()
    if (visited.has(path)) continue
    visited.add(path)
    const { response, html } = await fetchPage(path)
    const failures = []
    if (response.status !== 200) failures.push(`Sitemap returned HTTP ${response.status}`)
    else {
      try {
        for (const url of sitemapLocations(html, canonicalOrigin)) {
          if (/<sitemapindex\b/i.test(html)) queue.push(url.pathname + url.search)
          else pageUrls.add(url.pathname + url.search)
        }
      } catch (error) {
        failures.push(error.message)
      }
    }
    record(path, failures)
  }
  if (queue.length) record('/sitemap.xml', ['Sitemap index exceeds the audit limit of 10 files'])
  if (indexable && !pageUrls.size) record('/sitemap.xml', ['Public sitemap contains no pages'])
  const sampled = [...pageUrls]
    .filter((path) => path !== '/' && path !== '/explore')
    .slice(0, sample)
  for (const path of new Set(['/', '/explore', '/explore?page=2', '/login', ...sampled])) {
    const { response, html, elapsedMs } = await fetchPage(path)
    // A directory with a single page legitimately returns 404 for page two.
    if (path === '/explore?page=2' && response.status === 404) {
      record(path, [])
      continue
    }
    const report = inspectHtml(html, {
      canonical: new URL(path, canonicalOrigin).href,
      canonicalRequired: path !== '/login',
      indexable: indexable && path !== '/login',
      robotsHeader: response.headers.get('x-robots-tag') ?? '',
    })
    if (response.status !== 200)
      report.failures.unshift(`Expected HTTP 200, received ${response.status}`)
    if (!indexable && !/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? ''))
      report.failures.push('Private page must have X-Robots-Tag: noindex')
    record(path, report.failures, { ...report, elapsedMs })
  }
  const missing = '/businesses/seo-audit-missing-' + randomUUID()
  const absent = await fetchPage(missing)
  record(
    '/businesses/[nonexistent]',
    absent.response.status === 404 ? [] : [`Expected HTTP 404, received ${absent.response.status}`],
  )
  return results
}

async function main() {
  const { values } = parseArgs({
    options: {
      origin: { type: 'string' },
      'canonical-origin': { type: 'string' },
      sample: { type: 'string', default: '5' },
      private: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })
  if (values.help || !values.origin) {
    console.log(
      'Usage: npm run seo:audit -- --origin https://creda.ng [--sample 5] [--private] [--canonical-origin https://creda.ng]\nRead-only, sequential HTTP audit. Timing is diagnostic, not Core Web Vitals. Private mode expects noindex on staging/local pages.',
    )
    if (!values.help) process.exitCode = 1
    return
  }
  const origin = new URL(values.origin)
  const canonical = new URL(values['canonical-origin'] ?? origin.href)
  for (const url of [origin, canonical])
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error('Supply a plain HTTP(S) origin without credentials, path, query or fragment')
  const sample = Number(values.sample)
  if (!Number.isInteger(sample) || sample < 0 || sample > 20)
    throw new Error('Sample must be an integer from 0 to 20')
  const results = await auditSite({
    origin: origin.origin,
    canonicalOrigin: canonical.origin,
    sample,
    indexable: !values.private,
  })
  for (const result of results) console.log(JSON.stringify(result))
  const failures = results.reduce((count, result) => count + result.failures.length, 0)
  console.log(
    `${results.length} checks; ${failures} failures. HTML/image/script counts and elapsedMs are diagnostics, not field performance metrics.`,
  )
  if (failures) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(`SEO audit failed: ${error.message}`)
    process.exitCode = 1
  })
