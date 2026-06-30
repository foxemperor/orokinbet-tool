import { useEffect, useRef } from 'react'
import { OrokinPhoneme, VOWELS, MISC } from '../orokinPhoneticize'

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'

// Scaled-up glyph dimensions for better visibility
const GLYPH_H   = 80   // consonant glyph height
const VOWEL_H   = 38   // vowel glyph height
const LETTER_GAP = 10
const WORD_GAP   = 32
const PAD_TOP    = 8   // padding above vowels
const PAD_BOT    = 8   // padding below consonant
const CANVAS_H   = PAD_TOP + VOWEL_H + GLYPH_H + PAD_BOT
const BASELINE_Y = PAD_TOP + VOWEL_H  // top of consonant row

// Dark background to match the UI theme
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

function isVowel(p: string) { return (VOWELS as string[]).includes(p) }
function isMisc(p: string)  { return (MISC   as string[]).includes(p) }

type Syllable = { cons: string | null; vowels: string[] }

/**
 * Group phonemes into syllables.
 * Each consonant starts a new syllable; vowels attach to the consonant before them.
 * Leading vowels (no preceding consonant) get a silent ghost 'h'.
 */
function toSyllables(phonemes: OrokinPhoneme[]): (Syllable | ' ')[] {
  const result: (Syllable | ' ')[] = []
  let cur: Syllable | null = null
  const flush = () => { if (cur) { result.push(cur); cur = null } }
  for (const ph of phonemes) {
    if (ph === ' ') { flush(); result.push(' '); continue }
    if (isMisc(ph)) { flush(); result.push({ cons: ph, vowels: [] }); continue }
    if (isVowel(ph)) {
      if (!cur) cur = { cons: null, vowels: [] }  // ghost-h syllable
      cur.vowels.push(ph)
    } else {
      flush()
      cur = { cons: ph, vowels: [] }
    }
  }
  flush()
  return result
}

/** Returns the natural width of an image, or fallback if not loaded yet. */
function imgW(img: HTMLImageElement, fallback: number): number {
  return (img.complete && img.naturalWidth > 0) ? img.naturalWidth : fallback
}
function imgH(img: HTMLImageElement, fallback: number): number {
  return (img.complete && img.naturalHeight > 0) ? img.naturalHeight : fallback
}

function syllableWidth(syl: Syllable): number {
  const cImg = syl.cons ? getImg(syl.cons) : getImg('h')
  // Scale consonant to GLYPH_H preserving aspect ratio
  const cNH = imgH(cImg, GLYPH_H)
  const cNW = imgW(cImg, 40)
  const cW  = cNH > 0 ? Math.round(cNW * GLYPH_H / cNH) : cNW

  let vW = 0
  for (let i = 0; i < syl.vowels.length; i++) {
    const vi = getImg(syl.vowels[i])
    const vNH = imgH(vi, VOWEL_H)
    const vNW = imgW(vi, 24)
    const vScaledW = vNH > 0 ? Math.round(vNW * VOWEL_H / vNH) : vNW
    vW += vScaledW + (i > 0 ? 3 : 0)
  }
  return Math.max(cW, vW)
}

function drawSyllable(
  ctx: CanvasRenderingContext2D,
  syl: Syllable,
  x: number
): number {
  const cImg = syl.cons ? getImg(syl.cons) : (syl.vowels.length > 0 ? getImg('h') : null)

  // Scale consonant to GLYPH_H
  let cW = 0
  if (cImg && cImg.complete && cImg.naturalWidth > 0) {
    cW = Math.round(cImg.naturalWidth * GLYPH_H / (cImg.naturalHeight || GLYPH_H))
  }

  // Collect scaled vowel images
  const vImgs: { img: HTMLImageElement; w: number; h: number }[] = []
  let vTotalW = 0
  for (const v of syl.vowels) {
    const vi = getImg(v)
    if (vi.complete && vi.naturalWidth > 0) {
      const vH = VOWEL_H
      const vW2 = Math.round(vi.naturalWidth * vH / (vi.naturalHeight || vH))
      vImgs.push({ img: vi, w: vW2, h: vH })
      vTotalW += vW2 + (vImgs.length > 1 ? 3 : 0)
    }
  }

  const totalW = Math.max(cW, vTotalW, 8)

  // Draw consonant (centered horizontally in the slot)
  if (cImg && cImg.complete && cImg.naturalWidth > 0) {
    const cx = x + Math.round((totalW - cW) / 2)
    ctx.drawImage(cImg, cx, BASELINE_Y, cW, GLYPH_H)
  }

  // Draw vowels centered above consonant
  if (vImgs.length > 0) {
    let vx = x + Math.round((totalW - vTotalW) / 2)
    for (const { img, w, h } of vImgs) {
      // Vowels sit just above the consonant baseline
      const vy = PAD_TOP + (VOWEL_H - h)
      ctx.drawImage(img, vx, vy, w, h)
      vx += w + 3
    }
  }

  return x + totalW + LETTER_GAP
}

function measureWidth(syllables: (Syllable | ' ')[]): number {
  let w = 0
  for (const s of syllables) {
    if (s === ' ') { w += WORD_GAP; continue }
    w += syllableWidth(s) + LETTER_GAP
  }
  return Math.max(w - LETTER_GAP, 8)
}

interface Props {
  phonemes: OrokinPhoneme[]
}

export default function OrokinCanvas({ phonemes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (phonemes.length === 0) {
      canvas.width  = 10
      canvas.height = CANVAS_H
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Collect all unique phonemes that need images
    const needed = new Set<string>()
    phonemes.forEach(ph => { if (ph !== ' ') needed.add(ph) })
    needed.add('h')  // always preload ghost-h

    let loaded = 0
    const total = needed.size

    const render = () => {
      const syllables = toSyllables(phonemes)
      canvas.width  = measureWidth(syllables)
      canvas.height = CANVAS_H
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      let x = 0
      for (const s of syllables) {
        if (s === ' ') { x += WORD_GAP; continue }
        x = drawSyllable(ctx, s, x)
      }
    }

    for (const ph of needed) {
      const img = getImg(ph)
      if (img.complete && img.naturalWidth > 0) {
        loaded++
        if (loaded === total) render()
      } else {
        img.onload  = () => { loaded++; if (loaded === total) render() }
        img.onerror = () => { loaded++; if (loaded === total) render() }
      }
    }
  }, [phonemes])

  return (
    <div className="orokin-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  )
}
