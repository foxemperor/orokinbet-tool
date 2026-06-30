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
  const [orokinInput, setOrokinInput] = useState<OrokinPhoneme[]>([]);
  const [swapped, setSwapped] = useState(false);

  const phonemes: OrokinPhoneme[] = orokinPhoneticize(englishText);

  const handleSwap = () => setSwapped(!swapped);

  const handleVKInsert = (phoneme: OrokinPhoneme) => {
    setOrokinInput(prev => [...prev, phoneme]);
  };

  const handleVKBackspace = () => {
    setOrokinInput(prev => prev.slice(0, -1));
  };

  const handleVKClear = () => setOrokinInput([]);

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
                  {phonemes.map((ph: OrokinPhoneme, i: number) => (
                    <span key={i} className="phoneme-tag">{ph}</span>
                  ))}
                </div>
              )}
            </div>

            <button className="swap-btn" onClick={handleSwap} title="Поменять местами">
              ⇄
            </button>

            <div className="panel-block">
              <label>{swapped ? 'English' : 'Orokin (глифы)'}</label>
              {!swapped ? (
                <OrokinCanvas phonemes={phonemes} />
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

          {phonemes.length > 0 && (
            <div className="phoneme-debug">
              <strong>Фонемы:</strong> {phonemes.join(' · ')}
            </div>
          )}
        </div>
      )}

      {mode === 'orokin-input' && (
        <div className="vk-panel">
          <div className="vk-output">
            <label>Введённые фонемы:</label>
            <div className="phoneme-list">
              {orokinInput.map((ph: OrokinPhoneme, i: number) => (
                <span key={i} className="phoneme-tag">{ph}</span>
              ))}
              {orokinInput.length === 0 && (
                <span className="placeholder">Нажимайте кнопки клавиатуры...</span>
              )}
            </div>
          </div>
          <OrokinCanvas phonemes={orokinInput} />
          <VirtualKeyboard
            onInsert={handleVKInsert}
            onBackspace={handleVKBackspace}
            onClear={handleVKClear}
          />
        </div>
      )}
    </div>
  );
}
