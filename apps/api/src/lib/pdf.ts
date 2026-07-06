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

// Vinheta nas bordas da ILUSTRAÇÃO (não neblina em cima dela): as pontas da
// imagem esmaecem suavemente pro branco da página, igual livro infantil
// impresso de verdade — o centro da arte fica intacto, só as bordas (onde o
// texto entra) ficam naturalmente mais claras.
function drawImageWithVignette(doc: PDFKit.PDFDocument, imageBuffer: Buffer) {
  doc.image(imageBuffer, 0, 0, { width: PAGE_SIZE, height: PAGE_SIZE })

  const centerX = PAGE_SIZE / 2
  const centerY = PAGE_SIZE / 2
  const innerRadius = PAGE_SIZE * 0.34
  const outerRadius = PAGE_SIZE * 0.74

  const vignette = doc.radialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
  vignette.stop(0, GLOW_COLOR, 0).stop(1, GLOW_COLOR, 0.92)

  doc.save()
  doc.rect(0, 0, PAGE_SIZE, PAGE_SIZE).fill(vignette)
  doc.restore()
}

// Fonte serifada em caixa alta, tipo letreiro de livro infantil de verdade
// (ex: "Um Amigo para George"). O texto fica direto sobre a vinheta clara
// da borda (sem caixa/placa), com um reforço pequeno e discreto só atrás do
// bloco de texto pra garantir legibilidade mesmo se a vinheta não bastar.
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
  const innerRadius = Math.min(blockWidth, blockHeight) * 0.2
  const outerRadius = Math.max(blockWidth, blockHeight) * 0.55

  const boost = doc.radialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
  boost.stop(0, GLOW_COLOR, 0.5).stop(1, GLOW_COLOR, 0)

  doc.save()
  doc.rect(blockX, blockY, blockWidth, blockHeight).fill(boost)
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

    drawImageWithVignette(doc, input.coverImageBuffer)
    drawTextOverImage(doc, input.title, 24)

    for (const { page, imageBuffer } of input.pages) {
      doc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 })
      drawImageWithVignette(doc, imageBuffer)
      drawTextOverImage(doc, page.text, 15)
    }

    drawPhotoFramePage(doc, input.title)

    doc.end()
  })
}
