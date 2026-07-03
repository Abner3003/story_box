import PDFDocument from 'pdfkit'
import type { StoryPage } from '@storybox/db'

const PAGE_SIZE = 612 // livro quadrado, 8.5" a 72dpi

export interface BookPdfInput {
  title: string
  coverImageBuffer: Buffer
  pages: Array<{ page: StoryPage; imageBuffer: Buffer }>
}

export async function assembleBookPdf(input: BookPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.image(input.coverImageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })
    doc
      .fontSize(28)
      .fillColor('white')
      .text(input.title, 40, PAGE_SIZE - 120, { width: PAGE_SIZE - 80, align: 'center' })

    for (const { page, imageBuffer } of input.pages) {
      doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
      doc.image(imageBuffer, 0, 0, { width: PAGE_SIZE, height: 400 })
      doc
        .fontSize(16)
        .fillColor('black')
        .text(page.text, 40, 420, { width: PAGE_SIZE - 80, align: 'center' })
    }

    doc.end()
  })
}
