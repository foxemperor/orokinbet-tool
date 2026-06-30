import { useState, useRef, useCallback } from 'react';
import { orokinPhoneticize } from './orokinPhoneticize';
import type { OrokinPhoneme } from './orokinPhoneticize';
import OrokinCanvas from './components/OrokinCanvas';
import VirtualKeyboard from './components/VirtualKeyboard';
import './index.css';

type Mode = 'english-to-orokin' | 'orokin-input';
type Theme = 'dark' | 'light';

/** Download canvas as PNG */
function downloadCanvas(canvas: HTMLCanvasElement, filename = 'orokin.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/** Copy canvas image to clipboard (modern browsers) */
async function copyCanvas(canvas: HTMLCanvasElement) {
  try {
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png')
    )
    if (!blob) return false
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>('english-to-orokin');
    const [theme, setTheme] = useState<Theme>('dark');
  const [englishText, setEnglishText] = useState('');
  const [vkPhonemes, setVkPhonemes] = useState<OrokinPhoneme[]>([]);
  const [swapped, setSwapped] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  // Refs to the rendered canvases for save/copy
  const engCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const vkCanvasRef  = useRef<HTMLCanvasElement | null>(null)

  const engPhonemes: OrokinPhoneme[] = orokinPhoneticize(englishText);

    // Apply theme to document root
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(s => s === 'dark' ? 'light' : 'dark');

  const handleSwap = () => setSwapped(s => !s);

  const handleVKInsert = (phoneme: OrokinPhoneme) =>
    setVkPhonemes(prev => [...prev, phoneme]);
  const handleVKSpace = () =>
    setVkPhonemes(prev => [...prev, ' ' as OrokinPhoneme]);
  const handleVKBackspace = () =>
    setVkPhonemes(prev => prev.slice(0, -1));
  const handleVKClear = () => setVkPhonemes([]);

  const onEngCanvasReady = useCallback((c: HTMLCanvasElement) => {
    engCanvasRef.current = c
  }, [])
  const onVkCanvasReady = useCallback((c: HTMLCanvasElement) => {
    vkCanvasRef.current = c
  }, [])

  const activeCanvas = () => mode === 'english-to-orokin' ? engCanvasRef.current : vkCanvasRef.current

  const handleDownload = () => {
    const c = activeCanvas()
    if (c) downloadCanvas(c, 'orokin-text.png')
  }

  const handleCopy = async () => {
    const c = activeCanvas()
    if (!c) return
    const ok = await copyCanvas(c)
    setCopyMsg(ok ? '✓ Скопировано!' : 'Браузер не поддерживает копирование')
    setTimeout(() => setCopyMsg(null), 3000)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Orokinbet Tool</h1>
        <p className="subtitle">Инструмент для работы с алфавитом Orokinbet</p>
                <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="mode-tabs">
        <button
          className={`tab-btn${mode === 'english-to-orokin' ? ' active' : ''}`}
          onClick={() => setMode('english-to-orokin')}
        >
          English → Orokin
        </button>
        <button
          className={`tab-btn${mode === 'orokin-input' ? ' active' : ''}`}
          onClick={() => setMode('orokin-input')}
        >
          Виртуальная клавиатура
        </button>
      </div>

      {mode === 'english-to-orokin' && (
        <div className="translator-panel">
          <div className="panel">
            <div className="panel-block">
              <label>{swapped ? 'Orokin (фонемы)' : 'English'}</label>
              {!swapped ? (
                <textarea
                  className="text-input"
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="Введите текст на английском..."
                  rows={4}
                />
              ) : (
                <div className="phoneme-list">
                  {engPhonemes.length === 0 ? (
                    <span className="placeholder">фонемы появятся здесь...</span>
                  ) : (
                    engPhonemes.map((ph, i) => (
                      <span key={i} className={`phoneme-tag${ph === ' ' ? ' space-tag' : ''}`}>
                        {ph === ' ' ? '␣' : ph}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className="swap-btn" onClick={handleSwap} title="Поменять местами">⇄</button>
            <div className="panel-block">
              <label>{swapped ? 'English' : 'Orokin (глифы)'}</label>
              {!swapped ? (
                <OrokinCanvas phonemes={engPhonemes} onCanvasReady={onEngCanvasReady} />
              ) : (
                <textarea
                  className="text-input"
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="Введите текст на английском..."
                  rows={4}
                />
              )}
            </div>
          </div>
          {engPhonemes.length > 0 && (
            <div className="canvas-actions">
              <button className="btn btn-save" onClick={handleDownload}>⬇ Скачать PNG</button>
              <button className="btn btn-copy" onClick={handleCopy}>📋 Копировать</button>
              {copyMsg && <span className="copy-msg">{copyMsg}</span>}
            </div>
          )}
          {engPhonemes.length > 0 && (
            <div className="phoneme-debug">
              <strong>Фонемы:</strong> {engPhonemes.join(' · ')}
            </div>
          )}
        </div>
      )}

      {mode === 'orokin-input' && (
        <div className="vk-panel">
          <div className="vk-output">
            <label>Введённые фонемы:</label>
            <div className="phoneme-list">
              {vkPhonemes.length === 0 ? (
                <span className="placeholder">Нажимайте кнопки клавиатуры...</span>
              ) : (
                vkPhonemes.map((ph, i) => (
                  <span key={i} className={`phoneme-tag${ph === ' ' ? ' space-tag' : ''}`}>
                    {ph === ' ' ? '␣' : ph}
                  </span>
                ))
              )}
            </div>
          </div>
          <OrokinCanvas phonemes={vkPhonemes} onCanvasReady={onVkCanvasReady} />
          {vkPhonemes.length > 0 && (
            <div className="canvas-actions">
              <button className="btn btn-save" onClick={handleDownload}>⬇ Скачать PNG</button>
              <button className="btn btn-copy" onClick={handleCopy}>📋 Копировать</button>
              {copyMsg && <span className="copy-msg">{copyMsg}</span>}
            </div>
          )}
          <VirtualKeyboard
            onInsert={handleVKInsert}
            onBackspace={handleVKBackspace}
            onClear={handleVKClear}
            onSpace={handleVKSpace}
          />
        </div>
      )}
    </div>
  );
}
