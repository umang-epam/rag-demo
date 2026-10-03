import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDialConfig } from '@/lib/ai'

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
    const dialConfig = getDialConfig()

    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': dialConfig.apiKey,
    }

    if (!stream) {
      const payload = {
        messages: parsed.messages,
        temperature: 0.0,
      }

      const response = await fetch(dialConfig.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`DIAL API error (${response.status}): ${errorText || response.statusText}`)
      }

      const result = await response.json()
      const answer = result?.choices?.[0]?.message?.content || ''
      const usage = result?.usage
        ? {
            prompt_tokens: result.usage.prompt_tokens || 0,
            completion_tokens: result.usage.completion_tokens || 0,
            total_tokens: result.usage.total_tokens || 0,
          }
        : null

      return NextResponse.json({
        answer,
        usage,
      })
    }

    // Stream mode for DIAL API
    const payload = {
      messages: parsed.messages,
      temperature: 0.0,
      stream: true,
      stream_options: { include_usage: true },
    }

    const dialResponse = await fetch(dialConfig.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!dialResponse.ok) {
      const errorText = await dialResponse.text().catch(() => '')
      throw new Error(`DIAL API stream error (${dialResponse.status}): ${errorText || dialResponse.statusText}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder('utf-8')
    const reader = dialResponse.body.getReader()

    const readableStream = new ReadableStream({
      async start(controller) {
        let buffer = ''
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data:')) {
                continue
              }

              const dataStr = trimmed.replace(/^data:\s*/, '')
              if (dataStr === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
                continue
              }

              try {
                const parsedChunk = JSON.parse(dataStr)
                const deltaContent = parsedChunk.choices?.[0]?.delta?.content
                if (deltaContent) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: deltaContent })}\n\n`),
                  )
                }

                if (parsedChunk.usage) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'usage',
                        usage: {
                          prompt_tokens: parsedChunk.usage.prompt_tokens || 0,
                          completion_tokens: parsedChunk.usage.completion_tokens || 0,
                          total_tokens: parsedChunk.usage.total_tokens || 0,
                        },
                      })}\n\n`,
                    ),
                  )
                }
              } catch {
                // Ignore SSE comments or partial chunks
              }
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
    return NextResponse.json({ message: error?.message || 'DIAL API request failed' }, { status: 500 })
  }
}
