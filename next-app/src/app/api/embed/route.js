import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAiClient, getEmbeddingModel, EMBEDDING_DIMENSION } from '@/lib/ai'

const embedSchema = z.object({
  inputs: z.array(z.string().min(1)).min(1),
})

export async function POST(req) {
  try {
    const body = await req.json()
    const parsed = embedSchema.parse(body)
    const ai = getAiClient()
    const modelToUse = getEmbeddingModel()

    const embeddings = await Promise.all(
      parsed.inputs.map(async (text) => {
        const response = await ai.models.embedContent({
          model: modelToUse,
          contents: text,
          config: {
            outputDimensionality: EMBEDDING_DIMENSION,
          },
        })
        const values = response.embeddings?.[0]?.values || response.embedding?.values
        if (!values) {
          throw new Error(`Failed to extract embedding values for model ${modelToUse}`)
        }
        return values
      }),
    )

    return NextResponse.json({
      embeddings,
      usage: null,
      model: modelToUse,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Unexpected server error' },
      { status: error?.status || 500 },
    )
  }
}
