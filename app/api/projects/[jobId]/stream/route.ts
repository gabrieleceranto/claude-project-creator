import { NextRequest } from 'next/server'
import { getJob, addListener } from '@/lib/jobs'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return new Response('Job not found', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        const payload =
          event === 'message'
            ? `data: ${JSON.stringify(data)}\n\n`
            : `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // Replay buffered logs
      for (const log of job.logs) {
        send('message', { log })
      }

      if (job.status === 'done') {
        send('done', job.result)
        controller.close()
        return
      }
      if (job.status === 'error') {
        send('error', { error: job.error })
        controller.close()
        return
      }

      const remove = addListener(jobId, (line) => {
        if (line === '__DONE__') {
          send('done', job.result)
          controller.close()
          remove()
        } else if (line === '__ERROR__') {
          send('error', { error: job.error })
          controller.close()
          remove()
        } else {
          send('message', { log: line })
        }
      })

      req.signal.addEventListener('abort', () => {
        remove()
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
