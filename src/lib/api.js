export async function fetchRuns() {
  const response = await fetch('/api/runs')
  if (!response.ok) {
    throw new Error(`Failed to fetch runs: ${response.status}`)
  }
  return response.json()
}

export async function saveRun(run) {
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(run),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to save run')
  }
}
