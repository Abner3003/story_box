import PDFDocument from 'pdfkit'
import type { StoryPage } from '@storybox/db'

const PAGE_SIZE = 612 // livro quadrado, 8.5" a 72dpi
const TEXT_BAND_HEIGHT = 150

export interface BookPdfInput {
  title: string
  coverImageBuffer: Buffer
  pages: Array<{ page: StoryPage; imageBuffer: Buffer }>
}

// Faixa semi-transparente atrás do texto, pra ficar legível em cima de
// qualquer ilustração — o texto sobrepõe a imagem em vez de ficar num
// espaço em branco embaixo, igual livro infantil de verdade.
function drawTextOverImage(doc: PDFKit.PDFDocument, text: string, fontSize: number) {
  doc.save()
  doc
    .rect(0, PAGE_SIZE - TEXT_BAND_HEIGHT, PAGE_SIZE, TEXT_BAND_HEIGHT)
    .fillOpacity(0.55)
    .fill('#0b0b0b')
  doc.restore()

  doc
    .fillOpacity(1)
    .fillColor('white')
    .fontSize(fontSize)
    .text(text, 32, PAGE_SIZE - TEXT_BAND_HEIGHT + 24, { width: PAGE_SIZE - 64, align: 'center' })
}

export async function assembleBookPdf(input: BookPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.image(input.coverImageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })
    drawTextOverImage(doc, input.title, 26)

    for (const { page, imageBuffer } of input.pages) {
      doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
      doc.image(imageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })
      drawTextOverImage(doc, page.text, 17)
    }

    doc.end()
  })
}
