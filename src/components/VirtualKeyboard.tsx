import { OrokinPhoneme, CONSONANTS, VOWELS, MISC } from '../orokinPhoneticize'

export interface Syllable {
  consonant: OrokinPhoneme | null
  vowels: OrokinPhoneme[]
}

interface Props {
  onInsert: (phoneme: OrokinPhoneme) => void
  onBackspace: () => void
  onClear: () => void
  onSpace: () => void
  theme?: 'dark' | 'light'
}

const IMG_BASE = import.meta.env.BASE_URL + 'images/orokin/'

function imgSrc(ph: OrokinPhoneme): string {
  switch (ph) {
    case ',': return IMG_BASE + 'o_Comma.png'
    case '.': return IMG_BASE + 'o_Period.png'
    case '-': return IMG_BASE + 'o_Hyphen.png'
    default:  return IMG_BASE + 'o_' + ph + '.png'
  }
}

const MISC_KEYS: OrokinPhoneme[] = [
  '.', ',', '-',
  '0','1','2','3','4','5','6','7','8','9'
]

export default function VirtualKeyboard({ onInsert, onBackspace, onClear, onSpace, theme = 'dark' }: Props) {
  const isDark = theme === 'dark'
  return (
    <div className={`vkb${isDark ? '' : ' vkb-light'}`}>
      <div className="vkb-section-label">Согласные</div>
      <div className="vkb-row">
        {CONSONANTS.map(ph => (
          <button
            key={ph}
            className="vkb-key consonant"
            title={ph}
            onClick={() => onInsert(ph)}
          >
            <img src={imgSrc(ph)} alt={ph} className={isDark ? 'glyph-invert' : ''} />
            <span className="key-phoneme">{ph}</span>
          </button>
        ))}
      </div>
      <div className="vkb-section-label">Гласные — ставятся над предыдущей согласной</div>
      <div className="vkb-row">
        {(VOWELS as OrokinPhoneme[]).map(ph => (
          <button
            key={ph}
            className="vkb-key vowel"
            title={ph}
            onClick={() => onInsert(ph)}
          >
            <img src={imgSrc(ph)} alt={ph} className={isDark ? 'glyph-invert' : ''} />
            <span className="key-phoneme">{ph}</span>
          </button>
        ))}
      </div>
      <div className="vkb-section-label">Цифры и пунктуация</div>
      <div className="vkb-row">
        {MISC_KEYS.map(ph => (
          <button
            key={ph}
            className="vkb-key misc"
            title={ph}
            onClick={() => onInsert(ph)}
          >
            <img src={imgSrc(ph)} alt={ph} className={isDark ? 'glyph-invert' : ''} />
            <span className="key-phoneme">{ph}</span>
          </button>
        ))}
      </div>
      <div className="vkb-bottom-row">
        <button className="vkb-key vkb-key-backspace" onClick={onBackspace} title="Удалить последний символ">
          <span className="key-icon">⌫</span>
          <span className="key-phoneme">Удалить</span>
        </button>
        <button className="vkb-key vkb-key-space" onClick={onSpace} title="Пробел">
          <span className="key-phoneme">пробел</span>
        </button>
        <button className="vkb-key vkb-key-clear" onClick={onClear} title="Очистить всё">
          <span className="key-icon">✕</span>
          <span className="key-phoneme">Очистить</span>
        </button>
      </div>
    </div>
  )
}
