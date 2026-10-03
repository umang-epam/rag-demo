export function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || !text.trim()) {
    return []
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  const chunks = []
  let start = 0

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length)
    const chunk = normalized.slice(start, end)
    chunks.push(chunk)

    if (end >= normalized.length) {
      break
    }

    start = Math.max(0, end - overlap)
  }

  return chunks
}

export function estimateTokens(text) {
  if (!text) {
    return 0
  }
  return Math.ceil(text.length / 4)
}
