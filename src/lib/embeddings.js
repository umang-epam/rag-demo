async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Request failed: ${response.status}`)
  }

  return response.json()
}

export async function embedTexts(inputs) {
  const data = await postJson('/api/embed', { inputs })
  return data
}

export async function upsertVectors(payload) {
  const data = await postJson('/api/rag/upsert', payload)
  return data
}

export async function retrieveTopK(queryEmbedding, topK) {
  const data = await postJson('/api/rag/search', { queryEmbedding, topK })
  return data.matches
}
