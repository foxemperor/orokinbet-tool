import { useEffect, useRef } from 'react'
import { OrokinPhoneme, VOWELS, MISC } from '../orokinPhoneticize'

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'

/**
 * SCALE: pixel-perfect upscale factor.
 * PNG glyphs are ~23x26px (consonants) and ~9x8px (vowels).
 * We render with imageSmoothingEnabled=false and ctx.scale(SCALE),
 * then set canvas CSS size = canvas.width / SCALE.
 */
const SCALE      = 4
const CELL_PAD   = 2   // horizontal gap between cells (native px)
const WORD_GAP   = 8   // extra gap between words (native px)
const VOW_ZONE   = 10  // gap between vowel bottom and consonant top (native px)
const CELL_PAD_V = 2   // vertical padding top and bottom (native px)

const BG_COLOR = '#f0e6d0'

const imgCache: Record<string, HTMLImageElement> = {}

function getImg(phoneme: string): HTMLImageElement {
  if (imgCache[phoneme]) return imgCache[phoneme]
  const img = new Image()
  switch (phoneme) {
    case ',': img.src = IMG_BASE + 'o_Comma.svg'; break
    case '.': img.src = IMG_BASE + 'o_Period.svg'; break
    case '-': img.src = IMG_BASE + 'o_Hyphen.svg'; break
    default:  img.src = IMG_BASE + 'o_' + phoneme + '.svg'
  }
  imgCache[phoneme] = img
  return img
}

function ready(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0
}

function isVowel(p: string) { return (VOWELS as string[]).includes(p) }
function isMisc(p: string)  { return (MISC   as string[]).includes(p) }

// ---- Syllable grouping ----
type Syllable = { cons: string | null; vowels: string[] }

/**
 * TennoTyper rule:
 *   Vowels appear ABOVE the FOLLOWING consonant.
 *   Leading vowels (before any consonant) accumulate and belong to the
 *   NEXT consonant encountered.
 *   Trailing vowels (after the last consonant) get a ghost 'h'.
 *
 * Algorithm:
 *   - Keep a pendingVowels buffer.
 *   - When a consonant arrives, it takes all pending vowels.
 *   - When a space or misc arrives, flush any pending vowels as ghost-h first.
 */
function toSyllables(phonemes: OrokinPhoneme[]): (Syllable | ' ')[] {
  const result: (Syllable | ' ')[] = []
  const pendingVowels: string[] = []

  const flushGhostH = () => {
    if (pendingVowels.length > 0) {
      result.push({ cons: null, vowels: [...pendingVowels] })
      pendingVowels.length = 0
    }
  }

  for (const ph of phonemes) {
    if (ph === ' ') {
      flushGhostH()
      result.push(' ')
      continue
    }
    if (isMisc(ph)) {
      flushGhostH()
      result.push({ cons: ph, vowels: [] })
      continue
    }
    if (isVowel(ph)) {
      // Accumulate - belongs to the NEXT consonant
      pendingVowels.push(ph)
    } else {
      // Consonant: take all pending vowels
      result.push({ cons: ph, vowels: [...pendingVowels] })
      pendingVowels.length = 0
    }
  }
  // Trailing vowels with no following consonant -> ghost-h
  flushGhostH()

  return result
}

// ---- Geometry (all in native px before SCALE) ----

function consNW(ph: string | null): number {
  const img = getImg(ph ?? 'h')
  return ready(img) ? img.naturalWidth : 20
}

function cellW(syl: Syllable): number {
  const cw = consNW(syl.cons)
  let vw = 0
  for (const v of syl.vowels) {
    const vi = getImg(v)
    vw += ready(vi) ? vi.naturalWidth : 8
  }
  return Math.max(cw, vw, 8)
}

function maxConsH(syllables: (Syllable | ' ')[]): number {
  let h = 0
  for (const s of syllables) {
    if (s === ' ') continue
    const img = getImg(s.cons ?? 'h')
    if (ready(img)) h = Math.max(h, img.naturalHeight)
  }
  return h || 26
}

function maxVowH(syllables: (Syllable | ' ')[]): number {
  let h = 0
  for (const s of syllables) {
    if (s === ' ') continue
    for (const v of s.vowels) {
      const vi = getImg(v)
      if (ready(vi)) h = Math.max(h, vi.naturalHeight)
    }
  }
  return h || 8
}

// ---- Render ----

function renderGlyphs(
  ctx: CanvasRenderingContext2D,
  syllables: (Syllable | ' ')[]
): void {
  ctx.imageSmoothingEnabled = false

  const consH = maxConsH(syllables)
  const vowH  = maxVowH(syllables)
  const lineH = CELL_PAD_V + vowH + VOW_ZONE + consH + CELL_PAD_V

  // Measure total width
  let totalW = 0
  for (const s of syllables) {
    if (s === ' ') { totalW += WORD_GAP + CELL_PAD; continue }
    totalW += cellW(s) + CELL_PAD
  }
  totalW = Math.max(totalW - CELL_PAD, 8)

  ctx.canvas.width  = totalW * SCALE
  ctx.canvas.height = lineH  * SCALE
  ctx.canvas.style.width  = `${totalW}px`
  ctx.canvas.style.height = `${lineH}px`

  ctx.imageSmoothingEnabled = false
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)

  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, totalW, lineH)

  const consTop = CELL_PAD_V + vowH + VOW_ZONE

  let x = 0
  for (const s of syllables) {
    if (s === ' ') { x += WORD_GAP + CELL_PAD; continue }
    const cw = cellW(s)

    // Draw consonant centered in cell
    const cImg = getImg(s.cons ?? 'h')
    if (ready(cImg)) {
      const dx = Math.round((cw - cImg.naturalWidth) / 2)
      ctx.drawImage(cImg, x + dx, consTop, cImg.naturalWidth, cImg.naturalHeight)
    }

    // Draw vowels centered horizontally above consonant
    if (s.vowels.length > 0) {
      let totalVW = 0
      const vImgs: HTMLImageElement[] = []
      for (const v of s.vowels) {
        const vi = getImg(v)
        if (ready(vi)) { totalVW += vi.naturalWidth; vImgs.push(vi) }
      }
      let vx = x + Math.round((cw - totalVW) / 2)
      for (const vi of vImgs) {
        const vy = CELL_PAD_V + (vowH - vi.naturalHeight)
        ctx.drawImage(vi, vx, vy, vi.naturalWidth, vi.naturalHeight)
        vx += vi.naturalWidth
      }
    }

    x += cw + CELL_PAD
  }
}

interface Props {
  phonemes: OrokinPhoneme[]
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

export default function OrokinCanvas({ phonemes, onCanvasReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (phonemes.length === 0) {
      canvas.width  = 4
      canvas.height = 134 * SCALE
      canvas.style.width  = '4px'
      canvas.style.height = '134px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    const needed = new Set<string>()
    phonemes.forEach(ph => { if (ph !== ' ') needed.add(ph) })
    needed.add('h')

    let loaded = 0
    const total = needed.size

    const doRender = () => {
      const syllables = toSyllables(phonemes)
      renderGlyphs(ctx, syllables)
      onCanvasReady?.(canvas)
    }

    for (const ph of needed) {
      const img = getImg(ph)
      if (ready(img)) {
        loaded++
        if (loaded === total) doRender()
      } else {
        img.onload  = () => { loaded++; if (loaded === total) doRender() }
        img.onerror = () => { loaded++; if (loaded === total) doRender() }
      }
    }
  }, [phonemes, onCanvasReady])

  return (
    <div className="orokin-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  )
}
