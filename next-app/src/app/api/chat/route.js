import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAiClient, getChatModel } from '@/lib/ai'

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1),
  stream: z.boolean().optional(),
})

export async function POST(req) {
  try {
    const body = await req.json()
    const parsed = chatSchema.parse(body)
    const stream = Boolean(parsed.stream)
    const ai = getAiClient()
    const chatModelToUse = getChatModel()

    const systemMessage = parsed.messages.find((m) => m.role === 'system')?.content
    const contents = parsed.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const config = systemMessage ? { systemInstruction: systemMessage } : {}

    if (!stream) {
      const response = await ai.models.generateContent({
        model: chatModelToUse,
        contents,
        config,
      })

      const usage = response.usageMetadata
        ? {
            prompt_tokens: response.usageMetadata.promptTokenCount || 0,
            completion_tokens: response.usageMetadata.candidatesTokenCount || 0,
            total_tokens: response.usageMetadata.totalTokenCount || 0,
          }
        : null

      return NextResponse.json({
        answer: response.text || '',
        usage,
      })
    }

    const responseStream = await ai.models.generateContentStream({
      model: chatModelToUse,
      contents,
      config,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: chunk.text })}\n\n`))
            }
            if (chunk.usageMetadata) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'usage',
                    usage: {
                      prompt_tokens: chunk.usageMetadata.promptTokenCount || 0,
                      completion_tokens: chunk.usageMetadata.candidatesTokenCount || 0,
                      total_tokens: chunk.usageMetadata.totalTokenCount || 0,
                    },
                  })}\n\n`,
                ),
              )
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json({ message: error?.message || 'Chat generation failed' }, { status: 500 })
  }
}
