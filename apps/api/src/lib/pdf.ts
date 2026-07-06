import PDFDocument from 'pdfkit'
import type { StoryPage } from '@storybox/db'

const PAGE_SIZE = 612 // livro quadrado, 8.5" a 72dpi
const PANEL_MARGIN = 28
const PANEL_PADDING = 24
const PANEL_COLOR = '#fbf3e2'
const TEXT_COLOR = '#2a1d10'
const GLOW_COLOR = '#fffdf7'
const TEXT_FONT = 'Times-Bold'

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

// Fonte serifada em caixa alta, tipo letreiro de livro infantil de verdade
// (ex: "Um Amigo para George"). Nada de caixa/faixa sólida atrás — um halo
// claro e esfumaçado que abraça só o bloco de texto (não a página inteira),
// esmaecendo pras bordas, pra ficar legível em cima de qualquer trecho da
// ilustração sem parecer uma placa colada em cima da arte.
function drawTextOverImage(doc: PDFKit.PDFDocument, rawText: string, fontSize: number) {
  const text = sanitizeForPdf(rawText).toUpperCase()
  const maxTextWidth = PAGE_SIZE - PANEL_MARGIN * 2 - PANEL_PADDING * 2

  doc.font(TEXT_FONT).fontSize(fontSize)
  const textHeight = doc.heightOfString(text, { width: maxTextWidth, align: 'center' })

  const blockWidth = maxTextWidth + PANEL_PADDING * 2
  const blockHeight = textHeight + PANEL_PADDING * 2
  const blockX = PANEL_MARGIN
  const blockY = PAGE_SIZE - PANEL_MARGIN - blockHeight

  const centerX = blockX + blockWidth / 2
  const centerY = blockY + blockHeight / 2
  const innerRadius = Math.min(blockWidth, blockHeight) * 0.3
  const outerRadius = Math.max(blockWidth, blockHeight) * 0.68

  const glow = doc.radialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
  glow.stop(0, GLOW_COLOR, 0.95).stop(0.6, GLOW_COLOR, 0.7).stop(1, GLOW_COLOR, 0)

  doc.save()
  doc.rect(0, 0, PAGE_SIZE, PAGE_SIZE).fill(glow)
  doc.restore()

  doc
    .fillOpacity(1)
    .fillColor(TEXT_COLOR)
    .font(TEXT_FONT)
    .fontSize(fontSize)
    .text(text, blockX + PANEL_PADDING, blockY + PANEL_PADDING, { width: maxTextWidth, align: 'center' })
}

// Última página do livro: espaço reservado pra família colar/imprimir aquela
// foto especial de verdade (moldura pontilhada, sem imagem gerada por IA) e,
// abaixo, linhas em branco pra escrever à mão uma lembrança desse momento.
function drawPhotoFramePage(doc: PDFKit.PDFDocument, title: string) {
  doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
  doc.rect(0, 0, PAGE_SIZE, PAGE_SIZE).fill(PANEL_COLOR)

  const frameMargin = 60
  const frameWidth = PAGE_SIZE - frameMargin * 2
  const frameHeight = frameWidth * 0.56
  const frameX = frameMargin
  const frameY = 48

  doc.save()
  doc.lineWidth(3).dash(8, { space: 6 }).strokeColor(TEXT_COLOR)
  doc.roundedRect(frameX, frameY, frameWidth, frameHeight, 12).stroke()
  doc.undash()
  doc.restore()

  doc
    .fillColor(TEXT_COLOR)
    .font(TEXT_FONT)
    .fontSize(18)
    .text('COLE AQUI AQUELA FOTO ESPECIAL', frameMargin, frameY + frameHeight + 24, { width: frameWidth, align: 'center' })

  doc
    .fillColor(TEXT_COLOR)
    .font('Times-Italic')
    .fontSize(13)
    .text('Escreva aqui esse momento:', frameMargin, frameY + frameHeight + 62, { width: frameWidth, align: 'center' })

  const linesTop = frameY + frameHeight + 92
  const lineSpacing = 32
  doc.save()
  doc.lineWidth(1).strokeColor(TEXT_COLOR).strokeOpacity(0.35)
  for (let i = 0; i < 4; i++) {
    const y = linesTop + i * lineSpacing
    doc.moveTo(frameMargin, y).lineTo(frameMargin + frameWidth, y).stroke()
  }
  doc.restore()

  doc
    .fillColor(TEXT_COLOR)
    .font('Times-Italic')
    .fontSize(11)
    .text(`Uma lembrança de ${sanitizeForPdf(title)}`, frameMargin, linesTop + 4 * lineSpacing + 12, { width: frameWidth, align: 'center' })
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
