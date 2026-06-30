import { useState } from 'react';
import type { OrokinPhoneme } from './orokinPhoneticize';
import OrokinCanvas from './components/OrokinCanvas';
import VirtualKeyboard from './components/VirtualKeyboard';
import './index.css';

type Mode = 'english-to-orokin' | 'orokin-input';

export default function App() {
  const [mode, setMode] = useState<Mode>('english-to-orokin');
  const [englishText, setEnglishText] = useState('');
  const [orokinInput, setOrokinInput] = useState('');
  const [swapped, setSwapped] = useState(false);

  const handleSwap = () => setSwapped(!swapped);

  const handleVKInsert = (phoneme: OrokinPhoneme) => {
    setOrokinInput(prev => prev + (prev ? ' ' : '') + phoneme);
  };

  const handleVKBackspace = () => {
    const parts = orokinInput.trim().split(' ');
    parts.pop();
    setOrokinInput(parts.join(' '));
  };

  const handleVKClear = () => setOrokinInput('');

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
              <label>{swapped ? 'Orokin' : 'English'}</label>
              {!swapped ? (
                <textarea
                  className="text-input"
                  value={englishText}
                  onChange={e => setEnglishText(e.target.value)}
                  placeholder="Введите текст на английском..."
                  rows={4}
                />
              ) : (
                <OrokinCanvas text={englishText} phonetic={true} />
              )}
            </div>

            <button className="swap-btn" onClick={handleSwap} title="Поменять местами">
              ⇄
            </button>

            <div className="panel-block">
              <label>{swapped ? 'English' : 'Orokin (глифы)'}</label>
              {!swapped ? (
                <OrokinCanvas text={englishText} phonetic={true} />
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
        </div>
      )}

      {mode === 'orokin-input' && (
        <div className="vk-panel">
          <div className="vk-output">
            <label>Введённые фонемы:</label>
            <div className="phoneme-list">
              {orokinInput ? (
                orokinInput.split(' ').map((ph, i) => (
                  <span key={i} className="phoneme-tag">{ph}</span>
                ))
              ) : (
                <span className="placeholder">Нажимайте кнопки клавиатуры...</span>
              )}
            </div>
          </div>
          <OrokinCanvas text={orokinInput} phonetic={false} />
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
