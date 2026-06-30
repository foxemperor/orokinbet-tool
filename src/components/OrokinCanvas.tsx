import { useEffect, useRef } from 'react'
import { OrokinPhoneme, VOWELS, MISC } from '../orokinPhoneticize'

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'

/**
 * SCALE: pixel-perfect upscale factor.
 * PNG glyphs are ~23×26px (consonants) and ~9×8px (vowels).
 * We render with imageSmoothingEnabled=false and ctx.scale(SCALE),
 * then the canvas CSS width = canvas.width / SCALE (so it appears the right size).
 */
const SCALE      = 4     // pixel-perfect ×4 upscale
const CELL_PAD   = 2     // horizontal padding between cells (in native px)
const WORD_GAP   = 8     // extra gap between words (native px)
const VOW_ZONE   = 10    // height reserved above consonant baseline for vowels (native px)
const CELL_PAD_V = 2     // vertical padding top and bottom (native px)

const BG_COLOR = '#f0e6d0'

const imgCache: Record<string, HTMLImageElement> = {}

function getImg(phoneme: string): HTMLImageElement {
  if (imgCache[phoneme]) return imgCache[phoneme]
  const img = new Image()
  switch (phoneme) {
    case ',': img.src = IMG_BASE + 'o_Comma.png'; break
    case '.': img.src = IMG_BASE + 'o_Period.png'; break
    case '-': img.src = IMG_BASE + 'o_Hyphen.png'; break
    default:  img.src = IMG_BASE + 'o_' + phoneme + '.png'
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
 * Each consonant starts a new syllable.
 * Vowels attach to the PRECEDING consonant.
 * Leading vowels get a ghost 'h' (silent, rendered as 'h' glyph).
 */
function toSyllables(phonemes: OrokinPhoneme[]): (Syllable | ' ')[] {
  const result: (Syllable | ' ')[] = []
  let cur: Syllable | null = null
  const flush = () => { if (cur) { result.push(cur); cur = null } }
  for (const ph of phonemes) {
    if (ph === ' ') { flush(); result.push(' '); continue }
    if (isMisc(ph)) { flush(); result.push({ cons: ph, vowels: [] }); continue }
    if (isVowel(ph)) {
      if (!cur) cur = { cons: null, vowels: [] }  // ghost-h
      cur.vowels.push(ph)
    } else {
      flush()
      cur = { cons: ph, vowels: [] }
    }
  }
  flush()
  return result
}

// ---- Geometry helpers (all in native px, before SCALE) ----

/** Width of consonant image in native px (fallback to 20 if not loaded) */
function consNW(ph: string | null): number {
  const img = getImg(ph ?? 'h')
  return ready(img) ? img.naturalWidth : 20
}

/** Width of a syllable cell (max of cons width and total vowel widths) */
function cellW(syl: Syllable): number {
  const cw = consNW(syl.cons)
  let vw = 0
  for (const v of syl.vowels) {
    const vi = getImg(v)
    vw += ready(vi) ? vi.naturalWidth : 8
  }
  return Math.max(cw, vw, 8)
}

/** Tallest consonant height among all syllables */
function maxConsH(syllables: (Syllable | ' ')[]): number {
  let h = 0
  for (const s of syllables) {
    if (s === ' ') continue
    const img = getImg(s.cons ?? 'h')
    if (ready(img)) h = Math.max(h, img.naturalHeight)
  }
  return h || 26
}

/** Tallest vowel height among all syllables */
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
): { w: number; h: number } {
  ctx.imageSmoothingEnabled = false

  const consH  = maxConsH(syllables)
  const vowH   = maxVowH(syllables)
  const lineH  = CELL_PAD_V + vowH + VOW_ZONE + consH + CELL_PAD_V  // total native height

  // First pass: measure total width
  let totalW = 0
  for (const s of syllables) {
    if (s === ' ') { totalW += WORD_GAP + CELL_PAD; continue }
    totalW += cellW(s) + CELL_PAD
  }
  totalW = Math.max(totalW - CELL_PAD, 8)

  // Resize canvas (in SCALE coords)
  ctx.canvas.width  = totalW  * SCALE
  ctx.canvas.height = lineH   * SCALE
  // CSS display size = native canvas size
  ctx.canvas.style.width  = `${totalW}px`
  ctx.canvas.style.height = `${lineH}px`

  ctx.imageSmoothingEnabled = false
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)

  // Background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, totalW, lineH)

  // Baseline Y of consonant top edge
  const consTop = CELL_PAD_V + vowH + VOW_ZONE

  let x = 0
  for (const s of syllables) {
    if (s === ' ') { x += WORD_GAP + CELL_PAD; continue }
    const cw = cellW(s)

    // Draw consonant (centered in cell)
    const consImg = getImg(s.cons ?? 'h')
    if (ready(consImg)) {
      const dx = Math.round((cw - consImg.naturalWidth) / 2)
      ctx.drawImage(consImg, x + dx, consTop, consImg.naturalWidth, consImg.naturalHeight)
    }

    // Draw vowels centered horizontally, pinned to top of vowel zone
    if (s.vowels.length > 0) {
      let totalVW = 0
      const vImgs: HTMLImageElement[] = []
      for (const v of s.vowels) {
        const vi = getImg(v)
        if (ready(vi)) { totalVW += vi.naturalWidth; vImgs.push(vi) }
      }
      let vx = x + Math.round((cw - totalVW) / 2)
      for (const vi of vImgs) {
        // Vowel sits bottom-aligned to (consTop - VOW_ZONE/2)
        const vy = CELL_PAD_V + (vowH - vi.naturalHeight)
        ctx.drawImage(vi, vx, vy, vi.naturalWidth, vi.naturalHeight)
        vx += vi.naturalWidth
      }
    }

    x += cw + CELL_PAD
  }

  return { w: totalW, h: lineH }
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
      canvas.height = 134 * SCALE  // ~134px native = pleasant empty height
      canvas.style.width  = '4px'
      canvas.style.height = '134px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Preload all needed images, then render
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
