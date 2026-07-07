import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const VIDEO_MIME_RE = /^video\//i

export interface NormalizedMedia {
  base64: string
  mimeType: string
  source: 'image' | 'video'
}

function isVideoMimeType(mimeType: string): boolean {
  return VIDEO_MIME_RE.test(mimeType)
}

async function extractLastVideoFrame(base64Video: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'storybox-frame-'))
  const inputPath = join(dir, 'input')
  const outputPath = join(dir, 'frame.jpg')

  try {
    await writeFile(inputPath, Buffer.from(base64Video, 'base64'))

    const offsets = ['-0.1', '-0.5', '-1', '-2', '-5']
    let lastError: unknown = null

    for (const offset of offsets) {
      try {
        await execFileAsync(
          'ffmpeg',
          [
            '-hide_banner',
            '-loglevel',
            'error',
            '-sseof',
            offset,
            '-i',
            inputPath,
            '-frames:v',
            '1',
            '-q:v',
            '2',
            '-y',
            outputPath,
          ],
          { timeout: 20000, maxBuffer: 10 * 1024 * 1024 },
        )

        const frame = await readFile(outputPath)
        if (!frame.length) {
          throw new Error('ffmpeg produced an empty frame')
        }

        return frame.toString('base64')
      } catch (err) {
        lastError = err
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Não foi possível extrair o último frame do vídeo.')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Normaliza mídia animada/gravada para uma imagem estática antes de passar
// para visão, upload e geração. Live Photos e vídeos curtos entram por aqui.
export async function normalizeMediaForVision(
  base64: string,
  mimeType: string,
): Promise<NormalizedMedia> {
  if (!base64 || !isVideoMimeType(mimeType)) {
    return { base64, mimeType, source: 'image' }
  }

  const frameBase64 = await extractLastVideoFrame(base64)
  return {
    base64: frameBase64,
    mimeType: 'image/jpeg',
    source: 'video',
  }
}
