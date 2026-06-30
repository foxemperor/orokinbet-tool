import { useEffect, useRef } from 'react'
import { OrokinPhoneme, VOWELS, MISC } from '../orokinPhoneticize'

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'

const GLYPH_H     = 48
const VOWEL_H     = 24
const LETTER_GAP  = 6
const WORD_GAP    = 20
const CANVAS_H    = GLYPH_H + VOWEL_H + 8
const BASELINE_Y  = VOWEL_H + 4

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
 * A vowel belongs to the consonant BEFORE it.
 * Leading vowels (no preceding consonant) get a silent 'h'.
 */
function toSyllables(phonemes: OrokinPhoneme[]): (Syllable | ' ')[] {
  const result: (Syllable | ' ')[] = []
  let cur: Syllable | null = null

  const flush = () => { if (cur) { result.push(cur); cur = null } }

  for (const ph of phonemes) {
    if (ph === ' ') { flush(); result.push(' '); continue }
    if (isMisc(ph)) { flush(); result.push({ cons: ph, vowels: [] }); continue }
    if (isVowel(ph)) {
      if (!cur) cur = { cons: null, vowels: [] }
      cur.vowels.push(ph)
    } else {
      // new consonant: flush previous syllable first
      flush()
      cur = { cons: ph, vowels: [] }
    }
  }
  flush()
  return result
}

function syllableWidth(syl: Syllable): number {
  const ci = syl.cons ? getImg(syl.cons) : getImg('h')
  const cW = ci.complete && ci.naturalWidth > 0 ? ci.naturalWidth : 32
  if (syl.vowels.length === 0) return cW
  let vW = 0
  syl.vowels.forEach((v, i) => {
    const vi = getImg(v)
    vW += (vi.complete && vi.naturalWidth > 0 ? vi.naturalWidth : 20) + (i > 0 ? 2 : 0)
  })
  return Math.max(cW, vW)
}

function drawSyllable(ctx: CanvasRenderingContext2D, syl: Syllable, x: number): number {
  const cImg = syl.cons ? getImg(syl.cons) : (syl.vowels.length > 0 ? getImg('h') : null)
  const cW = cImg && cImg.complete && cImg.naturalWidth > 0 ? cImg.naturalWidth : 0
  const cH = cImg && cImg.complete && cImg.naturalHeight > 0 ? cImg.naturalHeight : GLYPH_H

  const vImgs: HTMLImageElement[] = []
  let vW = 0
  for (const v of syl.vowels) {
    const vi = getImg(v)
    if (vi.complete && vi.naturalWidth > 0) {
      vW += vi.naturalWidth + (vImgs.length > 0 ? 2 : 0)
      vImgs.push(vi)
    }
  }

  const totalW = Math.max(cW, vW)

  if (cImg && cImg.complete && cImg.naturalWidth > 0) {
    ctx.drawImage(cImg, x + (totalW - cW) / 2, BASELINE_Y, cW, cH)
  }
  if (vImgs.length > 0) {
    let vx = x + (totalW - vW) / 2
    for (const vi of vImgs) {
      ctx.drawImage(vi, vx, BASELINE_Y - vi.naturalHeight - 2, vi.naturalWidth, vi.naturalHeight)
      vx += vi.naturalWidth + 2
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
  return Math.max(w - LETTER_GAP, 4)
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
      canvas.width = 10; canvas.height = CANVAS_H
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    const needed = new Set<string>()
    phonemes.forEach(ph => { if (ph !== ' ') needed.add(ph) })
    needed.add('h')

    let loaded = 0
    const total = needed.size

    const render = () => {
      const syllables = toSyllables(phonemes)
      canvas.width  = measureWidth(syllables)
      canvas.height = CANVAS_H
      ctx.fillStyle = '#f5ede0'
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
