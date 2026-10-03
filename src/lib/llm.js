function safeJsonParse(line) {
  try {
    return JSON.parse(line)
  } catch {
    return null
  }
}

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

  return response
}

export async function generateChat({ messages }) {
  const response = await postJson('/api/chat', { messages, stream: false })
  return response.json()
}

export async function streamChat({ messages, onDelta }) {
  const response = await postJson('/api/chat', { messages, stream: true })

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let usage = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const rawChunk of lines) {
      const line = rawChunk
        .split('\n')
        .find((part) => part.trim().startsWith('data:'))
        ?.replace('data:', '')
        .trim()

      if (!line) {
        continue
      }

      const payload = safeJsonParse(line)
      if (!payload) {
        continue
      }

      if (payload.type === 'delta' && payload.delta) {
        onDelta(payload.delta)
      }

      if (payload.type === 'usage') {
        usage = payload.usage
      }

      if (payload.type === 'error') {
        throw new Error(payload.message || 'Streaming failed')
      }
    }
  }

  return { usage }
}
