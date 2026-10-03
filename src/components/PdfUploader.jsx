'use client'

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
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
        isDragActive
          ? 'border-[#00F6FF] bg-[#00F6FF]/10 shadow-[0_0_15px_rgba(0,246,255,0.2)]'
          : 'border-zinc-700 bg-[#121214] hover:border-[#7BA8FF] hover:bg-[#18181c]'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-lg font-semibold text-zinc-100">Drag & drop PDF here, or click to pick</p>
      <p className="mt-2 text-sm text-[#00FFF0] font-medium">{fileName ? `Loaded: ${fileName}` : 'No file selected'}</p>
    </div>
  )
}
