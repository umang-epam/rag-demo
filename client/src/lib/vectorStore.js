export function formatTopMatches(matches) {
  return matches.map((match) => ({
    chunkIndex: match.chunkIndex,
    score: Number(match.score.toFixed(4)),
    preview: `${match.chunkText.slice(0, 120)}...`,
    chunkText: match.chunkText,
  }))
}

export function buildRagContext(matches) {
  return matches
    .map(
      (match, idx) =>
        `[Retrieved ${idx + 1} | chunk ${match.chunkIndex} | score ${match.score.toFixed(4)}]\n${match.chunkText}`,
    )
    .join('\n\n')
}
