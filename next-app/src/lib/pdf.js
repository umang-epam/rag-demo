export async function parsePdfText(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item) => item.str).join(' ')
    pages.push(text)
    onProgress?.({ pageNumber, numPages: pdf.numPages })
  }

  return pages.join('\n')
}
