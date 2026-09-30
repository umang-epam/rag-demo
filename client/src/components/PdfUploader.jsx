import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function PdfUploader({ fileName, onPick }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        onPick(file)
      }
    },
    [onPick],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
        isDragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-400 bg-white'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-lg font-semibold text-slate-900">Drag & drop PDF here, or click to pick</p>
      <p className="mt-2 text-sm text-slate-600">{fileName ? `Loaded: ${fileName}` : 'No file selected'}</p>
    </div>
  )
}
