import { useEffect, useRef } from 'react'
import { OrokinPhoneme, VOWELS, MISC, phoneticize, literal } from '../orokinPhoneticize'

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'
const VOWELS_OFFSET = 12
const LETTER_SPACING = 5
const SPACE_WIDTH = 22

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
function isMisc(p: string)  { return (MISC as string[]).includes(p) }

function calcWordWidth(phonemes: OrokinPhoneme[]): number {
  let x = 0
  let vowelLen = 0
  let hasVowels = false

  for (const ph of phonemes) {
    const img = getImg(ph)
    if (!img.complete || img.naturalWidth === 0) continue
    if (isMisc(ph)) {
      if (hasVowels) {
        const hImg = getImg('h')
        const vLen = vowelLen - LETTER_SPACING
        x += Math.max(vLen, hImg.naturalWidth || 0) + LETTER_SPACING
        hasVowels = false; vowelLen = 0
      }
      x += img.width + LETTER_SPACING
    } else if (isVowel(ph)) {
      hasVowels = true
      vowelLen += img.width + LETTER_SPACING
    } else {
      if (hasVowels) {
        const vLen = vowelLen - LETTER_SPACING
        x += Math.max(vLen, img.width) + LETTER_SPACING
        hasVowels = false; vowelLen = 0
      } else {
        x += img.width + LETTER_SPACING
      }
    }
  }
  if (hasVowels) {
    const hImg = getImg('h')
    const vLen = vowelLen - LETTER_SPACING
    x += Math.max(vLen, hImg.naturalWidth || 0) + LETTER_SPACING
  }
  return Math.max(x - LETTER_SPACING, 0)
}

function drawWord(
  ctx: CanvasRenderingContext2D,
  phonemes: OrokinPhoneme[],
  xStart: number,
  yBase: number
) {
  let x = xStart
  let vowelImgs: HTMLImageElement[] = []
  let vowelLen = 0

  const flushWith = (cImg: HTMLImageElement) => {
    if (vowelImgs.length === 0) {
      ctx.drawImage(cImg, x, yBase + VOWELS_OFFSET)
      x += cImg.width + LETTER_SPACING
      return
    }
    const vLen = vowelLen - LETTER_SPACING
    const cW = cImg.width
    const cOffX = vLen > cW ? x + (vLen - cW) / 2 : x
    const vOffX = cW > vLen ? x + (cW - vLen) / 2 : x
    ctx.drawImage(cImg, cOffX, yBase + VOWELS_OFFSET)
    let vx = vOffX
    for (const vi of vowelImgs) {
      ctx.drawImage(vi, vx, yBase)
      vx += vi.width + LETTER_SPACING
    }
    x += Math.max(vLen, cW) + LETTER_SPACING
    vowelImgs = []; vowelLen = 0
  }

  const flushTrailing = () => {
    if (vowelImgs.length === 0) return
    const hImg = getImg('h')
    const vLen = vowelLen - LETTER_SPACING
    const cW = hImg.complete && hImg.naturalWidth > 0 ? hImg.width : 0
    const cOffX = vLen > cW ? x + (vLen - cW) / 2 : x
    const vOffX = cW > vLen ? x + (cW - vLen) / 2 : x
    if (hImg.complete && hImg.naturalWidth > 0)
      ctx.drawImage(hImg, cOffX, yBase + VOWELS_OFFSET)
    let vx = vOffX
    for (const vi of vowelImgs) {
      ctx.drawImage(vi, vx, yBase)
      vx += vi.width + LETTER_SPACING
    }
    vowelImgs = []; vowelLen = 0
  }

  for (const ph of phonemes) {
    const img = getImg(ph)
    if (!img.complete || img.naturalWidth === 0) continue
    if (isMisc(ph)) {
      flushTrailing()
      ctx.drawImage(img, x, yBase + VOWELS_OFFSET)
      x += img.width + LETTER_SPACING
    } else if (isVowel(ph)) {
      vowelImgs.push(img)
      vowelLen += img.width + LETTER_SPACING
    } else {
      flushWith(img)
    }
  }
  flushTrailing()
}

interface Props {
  text: string
  phonetic?: boolean
}

export default function OrokinCanvas({ text, phonetic = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      canvas.width = 10; canvas.height = 10; return
    }
    const wordPhonemes = words.map(w => phonetic ? phoneticize(w) : literal(w))
    const allPh = [...new Set([...wordPhonemes.flat(), 'h' as OrokinPhoneme])]
    const imgs = allPh.map(p => getImg(p))

    const render = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const maxH = imgs.reduce((a, i) =>
        i.complete && i.naturalWidth > 0 ? Math.max(a, i.height) : a, 16)
      const rowH = maxH + VOWELS_OFFSET + 8
      let totalW = wordPhonemes.reduce((a, wp, i) =>
        a + calcWordWidth(wp) + (i < wordPhonemes.length - 1 ? SPACE_WIDTH : 0), 0)
      canvas.width  = Math.max(totalW + 10, 50)
      canvas.height = rowH
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let x = 5
      wordPhonemes.forEach((wp, i) => {
        drawWord(ctx, wp, x, 0)
        x += calcWordWidth(wp) + (i < wordPhonemes.length - 1 ? SPACE_WIDTH : 0)
      })
    }

    let done = 0
    const tryRender = () => { if (++done >= imgs.length) render() }
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) tryRender()
      else {
        img.addEventListener('load',  tryRender, { once: true })
        img.addEventListener('error', tryRender, { once: true })
      }
    })
  }, [text, phonetic])

  return (
    <div className="orokin-canvas-wrap">
      {text.trim()
        ? <canvas ref={canvasRef} />
        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>введи текст...</span>
      }
    </div>
  )
}
