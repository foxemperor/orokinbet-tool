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

export default function VirtualKeyboard({ onInsert, onBackspace, onClear, onSpace }: Props) {
  return (
    <div className="vkb">
      <div className="vkb-section-label">Согласные</div>
      <div className="vkb-row">
        {CONSONANTS.map(ph => (
          <button
            key={ph}
            className="vkb-key consonant"
            title={ph}
            onClick={() => onInsert(ph)}
          >
            <img src={imgSrc(ph)} alt={ph} />
            <span className="key-phoneme">{ph}</span>
          </button>
        ))}
      </div>
      <div className="vkb-section-label">Гласные — ставятся над предыдущим согласным</div>
      <div className="vkb-row">
        {(VOWELS as OrokinPhoneme[]).map(ph => (
          <button
            key={ph}
            className="vkb-key vowel"
            title={ph}
            onClick={() => onInsert(ph)}
          >
            <img src={imgSrc(ph)} alt={ph} />
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
            <img src={imgSrc(ph)} alt={ph} />
            <span className="key-phoneme">{ph}</span>
          </button>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn btn-space" onClick={onSpace} title="Пробел">␣ Пробел</button>
        <button className="btn" onClick={onBackspace}>⌫ Удалить</button>
        <button className="btn btn-danger" onClick={onClear}>✕ Очистить</button>
      </div>
    </div>
  )
}
