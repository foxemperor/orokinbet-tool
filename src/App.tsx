import { useState, useRef, useCallback, useEffect } from 'react';
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

  const engCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const vkCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const engPhonemes: OrokinPhoneme[] = orokinPhoneticize(englishText);

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
    setCopyMsg(ok ? '\u2713 \u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!' : '\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043d\u0435 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435')
    setTimeout(() => setCopyMsg(null), 3000)
  }

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    // Apply theme class to body element
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        
  
        <div className="header-row">
          <div />
          <div>
            <h1>Orokinbet Tool</h1>
            <p className="subtitle">\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b \u0441 \u0430\u043b\u0444\u0430\u0432\u0438\u0442\u043e\u043c Orokinbet</p>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? '\u0421\u0432\u0435\u0442\u043b\u0430\u044f \u0442\u0435\u043c\u0430' : '\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430'}>
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>
      </header>

      <div className="mode-tabs">
        <button
          className={`tab-btn${mode === 'english-to-orokin' ? ' active' : ''}`}
          onClick={() => setMode('english-to-orokin')}
        >
          English \u2192 Orokin
        </button>
        <button
          className={`tab-btn${mode === 'orokin-input' ? ' active' : ''}`}
          onClick={() => setMode('orokin-input')}
        >
          \u0412\u0438\u0440\u0442\u0443\u0430\u043b\u044c\u043d\u0430\u044f \u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430
        </button>
      </div>

      {mode === 'english-to-orokin' && (
        <div className="translator-panel">
          <div className="panel">
            <div className="panel-block">
              <label>{swapped ? 'Orokin (\u0444\u043e\u043d\u0435\u043c\u044b)' : 'English'}</label>
              {!swapped ? (
                <textarea
                  className="text-input"
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043a\u0441\u0442 \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c..."
                  rows={4}
                />
              ) : (
                <div className="phoneme-list">
                  {engPhonemes.length === 0 ? (
                    <span className="placeholder">\u0444\u043e\u043d\u0435\u043c\u044b \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c...</span>
                  ) : (
                    engPhonemes.map((ph, i) => (
                      <span key={i} className={`phoneme-tag${ph === ' ' ? ' space-tag' : ''}`}>
                        {ph === ' ' ? '\u2423' : ph}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className="swap-btn" onClick={handleSwap} title="\u041f\u043e\u043c\u0435\u043d\u044f\u0442\u044c \u043c\u0435\u0441\u0442\u0430\u043c\u0438">\u21c4</button>
            <div className="panel-block">
              <label>{swapped ? 'English' : 'Orokin (\u0433\u043b\u0438\u0444\u044b)'}</label>
              {!swapped ? (
                <OrokinCanvas phonemes={engPhonemes} onCanvasReady={onEngCanvasReady} />
              ) : (
                <textarea
                  className="text-input"
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043a\u0441\u0442 \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c..."
                  rows={4}
                />
              )}
            </div>
          </div>

          {engPhonemes.length > 0 && (
            <div className="canvas-actions">
              <button className="btn btn-save" onClick={handleDownload}>\u2b07 \u0421\u043a\u0430\u0447\u0430\u0442\u044c PNG</button>
              <button className="btn btn-copy" onClick={handleCopy}>\ud83d\udccb \u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>
              {copyMsg && <span className="copy-msg">{copyMsg}</span>}
            </div>
          )}
          {engPhonemes.length > 0 && (
            <div className="phoneme-debug">
              <strong>\u0424\u043e\u043d\u0435\u043c\u044b:</strong> {engPhonemes.join(' \u00b7 ')}
            </div>
          )}
        </div>
      )}

      {mode === 'orokin-input' && (
        <div className="vk-panel">
          <div className="vk-output">
            <label>\u0412\u0432\u0435\u0434\u0451\u043d\u043d\u044b\u0435 \u0444\u043e\u043d\u0435\u043c\u044b:</label>
            <div className="phoneme-list">
              {vkPhonemes.length === 0 ? (
                <span className="placeholder">\u041d\u0430\u0436\u0438\u043c\u0430\u0439\u0442\u0435 \u043a\u043d\u043e\u043f\u043a\u0438 \u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u044b...</span>
              ) : (
                vkPhonemes.map((ph, i) => (
                  <span key={i} className={`phoneme-tag${ph === ' ' ? ' space-tag' : ''}`}>
                    {ph === ' ' ? '\u2423' : ph}
                  </span>
                ))
              )}
            </div>
          </div>

          <OrokinCanvas phonemes={vkPhonemes} onCanvasReady={onVkCanvasReady} />

          {vkPhonemes.length > 0 && (
            <div className="canvas-actions">
              <button className="btn btn-save" onClick={handleDownload}>\u2b07 \u0421\u043a\u0430\u0447\u0430\u0442\u044c PNG</button>
              <button className="btn btn-copy" onClick={handleCopy}>\ud83d\udccb \u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>
              {copyMsg && <span className="copy-msg">{copyMsg}</span>}
            </div>
          )}

          <VirtualKeyboard
            onInsert={handleVKInsert}
            onBackspace={handleVKBackspace}
            onClear={handleVKClear}
            onSpace={handleVKSpace}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
