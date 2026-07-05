import PDFDocument from 'pdfkit'
import type { StoryPage } from '@storybox/db'

const PAGE_SIZE = 612 // livro quadrado, 8.5" a 72dpi
const PANEL_MARGIN = 28
const PANEL_PADDING = 20
const PANEL_COLOR = '#fbf3e2'
const TEXT_COLOR = '#3a2c1a'
const SMOKE_COLOR = '#0e0a06'
const FADE_HEIGHT = 90

export interface BookPdfInput {
  title: string
  coverImageBuffer: Buffer
  pages: Array<{ page: StoryPage; imageBuffer: Buffer }>
}

// Os fontes padrão do PDFKit (Times-Roman etc.) só cobrem WinAnsi/Latin-1 —
// aspas curvas, travessão longo, elipse "…" ou emoji que vierem do texto
// gerado pelo GPT caem fora dessa tabela e o PDFKit renderiza um glifo de
// fallback (aparece como símbolo ASCII quebrado, ex: no lugar do "?").
// Normaliza pra equivalentes simples antes de desenhar.
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[‘’]/g, '\'')
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '')
    .trim()
}

// Sem caixa/retângulo com borda visível — o texto "emerge" de uma neblina
// suave sobre a própria ilustração, esfumaçada de baixo pra cima (transparente
// no topo, mais densa perto da borda inferior), igual livro infantil de
// verdade em vez de uma placa colada em cima da arte.
function drawTextOverImage(doc: PDFKit.PDFDocument, rawText: string, fontSize: number) {
  const text = sanitizeForPdf(rawText)
  const font = 'Times-Roman'
  const textWidth = PAGE_SIZE - PANEL_MARGIN * 2 - PANEL_PADDING * 2

  doc.font(font).fontSize(fontSize)
  const textHeight = doc.heightOfString(text, { width: textWidth, align: 'center' })
  const bandHeight = Math.min(PAGE_SIZE * 0.6, textHeight + PANEL_PADDING * 2 + FADE_HEIGHT)
  const bandY = PAGE_SIZE - bandHeight

  const smoke = doc.linearGradient(0, bandY, 0, PAGE_SIZE)
  smoke.stop(0, SMOKE_COLOR, 0).stop(0.5, SMOKE_COLOR, 0.55).stop(1, SMOKE_COLOR, 0.86)

  doc.save()
  doc.rect(0, bandY, PAGE_SIZE, bandHeight).fill(smoke)
  doc.restore()

  const textY = PAGE_SIZE - PANEL_MARGIN - PANEL_PADDING - textHeight
  doc
    .fillOpacity(1)
    .fillColor('white')
    .font(font)
    .fontSize(fontSize)
    .text(text, PANEL_MARGIN + PANEL_PADDING, textY, { width: textWidth, align: 'center' })
}

// Última página do livro: espaço reservado pra família colar/imprimir aquela
// foto especial de verdade — moldura pontilhada num fundo claro, sem imagem
// gerada por IA aqui.
function drawPhotoFramePage(doc: PDFKit.PDFDocument, title: string) {
  doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
  doc.rect(0, 0, PAGE_SIZE, PAGE_SIZE).fill(PANEL_COLOR)

  const frameMargin = 70
  const frameWidth = PAGE_SIZE - frameMargin * 2
  const frameHeight = frameWidth * 0.8
  const frameX = frameMargin
  const frameY = (PAGE_SIZE - frameHeight) / 2 - 30

  doc.save()
  doc.lineWidth(3).dash(8, { space: 6 }).strokeColor(TEXT_COLOR)
  doc.roundedRect(frameX, frameY, frameWidth, frameHeight, 12).stroke()
  doc.undash()
  doc.restore()

  doc
    .fillColor(TEXT_COLOR)
    .font('Times-Bold')
    .fontSize(20)
    .text('Cole aqui aquela foto especial', frameMargin, frameY + frameHeight + 30, { width: frameWidth, align: 'center' })

  doc
    .fillColor(TEXT_COLOR)
    .font('Times-Roman')
    .fontSize(13)
    .text(`Uma lembrança de ${sanitizeForPdf(title)}`, frameMargin, frameY + frameHeight + 62, { width: frameWidth, align: 'center' })
}

export async function assembleBookPdf(input: BookPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.image(input.coverImageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })
    drawTextOverImage(doc, input.title, 24)

    for (const { page, imageBuffer } of input.pages) {
      doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
      doc.image(imageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })
      drawTextOverImage(doc, page.text, 15)
    }

    drawPhotoFramePage(doc, input.title)

    doc.end()
  })
}
