/**
 * Utility to sanitize and extract article content.
 * - Sanitizes HTML with DOMPurify
 * - Extracts article using Readability + Defuddle
 * - Adds lazy-loading to images
 * - Transforms anchors (href -> data-href)
 * - Removes first <time> tag
 * - Detects duplicate images
 */

import Defuddle from 'defuddle'
import { Readability } from '@mozilla/readability'
import dompurify from 'dompurify'

/** ----------------- Helpers ----------------- */

// Parse HTML string into Document
function parseDom(html) {
  return new DOMParser().parseFromString(html, 'text/html')
}

// Add loading="lazy" to all <img>
function addLazyTags(doc) {
  doc.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy')
  })
  return doc
}

// Convert <a href> -> <a data-href>
function transformAnchors(doc) {
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')
    a.removeAttribute('href')
    if (href) a.setAttribute('data-href', href)
  })
  return doc
}

// Remove only the first <time> tag
function removeFirstTimeTag(doc) {
  const firstTime = doc.querySelector('time')
  if (firstTime) firstTime.remove()
  return doc
}

// Sanitize with DOMPurify
function purifyHtml(html) {
  return dompurify.sanitize(html)
}

// Extract filename without noisy suffixes/extensions
function cleanFilename(name) {
  if (!name) return ''
  name = name.replace(/-\d{3,4}-\d{2,3}/, '')
  const parts = name.toLowerCase().split('.')
  return parts.length > 2 ? parts.slice(0, -1).join('.') : name.toLowerCase()
}

// Normalize a URL (absolute or relative)
function normalizeUrl(url) {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    const stripped = url.split('?')[0].split('#')[0]
    try {
      const u = new URL(stripped, 'http://dummy.com')
      return u.pathname
    } catch {
      return stripped
    }
  }
}

// Check if image exists in HTML
function imageExistsInHtml(imageUrl, htmlContent) {
  if (!imageUrl || !htmlContent) return false

  const targetNormalized = normalizeUrl(imageUrl)
  const targetFilename = cleanFilename(imageUrl.split('/').pop())

  const doc = parseDom(htmlContent)
  for (const img of doc.querySelectorAll('img[src]')) {
    const src = img.getAttribute('src')
    if (!src) continue

    const srcNormalized = normalizeUrl(src)
    const srcFilename = cleanFilename(src.split('/').pop())

    if (srcNormalized === targetNormalized || srcNormalized.endsWith(targetNormalized) || targetNormalized.endsWith(srcNormalized) || (srcFilename && srcFilename === targetFilename)) {
      return true
    }
  }
  return false
}

/** ----------------- Core ----------------- */

// Extract article content and choose main image
// Default image has higher preference over extracted image
function parseArticle(html, defaultImage) {
  const dom = parseDom(html)
  const readability = new Readability(dom).parse()
  const defuddle = new Defuddle(dom).parse()

  const content = readability?.content || ''
  const extractedImage = defuddle?.image || ''
  const image = defaultImage || extractedImage

  return { content, image }
}

// Sanitize article content (apply DOM transformations and detect duplicates)
function sanitizeArticle(html, image) {
  let doc = parseDom(html)
  doc = addLazyTags(doc)
  doc = transformAnchors(doc)
  doc = removeFirstTimeTag(doc)

  const sanitized = purifyHtml(doc.body.innerHTML)
  const isDuplicateImage = imageExistsInHtml(image, sanitized)

  return {
    content: sanitized,
    image,
    isDuplicateImage,
  }
}

// Orchestration: parse then sanitize
function sanitizeAndParseArticle(html = '', defaultImage) {
  if (!html) {
    return { content: '', image: defaultImage || '', isDuplicateImage: false }
  }

  const { content, image } = parseArticle(html, defaultImage)
  return sanitizeArticle(content, image)
}

/** ----------------- Expose to Window ----------------- */

;(function expose() {
  if (window) {
    window.setArticleParseScriptAvailable?.(true)
    window.sanitizeAndParseArticle = sanitizeAndParseArticle
    window.sanitizeArticle = sanitizeArticle
    window.isImageInHtml = imageExistsInHtml
    window.getParseScriptVersion = () => process.env.VERSION
  }
})()
