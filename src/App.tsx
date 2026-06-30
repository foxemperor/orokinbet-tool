import { useState } from 'react';
import { orokinPhoneticize } from './orokinPhoneticize';
import type { OrokinPhoneme } from './orokinPhoneticize';
import OrokinCanvas from './components/OrokinCanvas';
import VirtualKeyboard from './components/VirtualKeyboard';
import './index.css';

type Mode = 'english-to-orokin' | 'orokin-input';

export default function App() {
  const [mode, setMode] = useState<Mode>('english-to-orokin');
  const [englishText, setEnglishText] = useState('');
  const [vkPhonemes, setVkPhonemes] = useState<OrokinPhoneme[]>([]);
  const [swapped, setSwapped] = useState(false);

  // English -> Orokin phonemes
  const engPhonemes: OrokinPhoneme[] = orokinPhoneticize(englishText);

  const handleSwap = () => setSwapped(s => !s);

  const handleVKInsert = (phoneme: OrokinPhoneme) => {
    setVkPhonemes(prev => [...prev, phoneme]);
  };
  const handleVKSpace = () => {
    setVkPhonemes(prev => [...prev, ' ' as OrokinPhoneme]);
  };
  const handleVKBackspace = () => {
    setVkPhonemes(prev => prev.slice(0, -1));
  };
  const handleVKClear = () => setVkPhonemes([]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Orokinbet Tool</h1>
        <p className="subtitle">Инструмент для работы с алфавитом Orokinbet</p>
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
                <OrokinCanvas phonemes={engPhonemes} />
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
          <OrokinCanvas phonemes={vkPhonemes} />
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
