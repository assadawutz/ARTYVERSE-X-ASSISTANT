import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  AlignJustify, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Ellipsis,
  Expand, Mic, Paperclip, Pause, Play, Send, SlidersHorizontal, X,
} from 'lucide-react';

const scriptParagraphs = [
  'จากคำถามนี้ ผมขอสรุปให้เริ่มใช้งานเป็นระยะครับ โดยเลือกงานที่มีขอบเขตชัดเจนมาทดลองก่อน เพื่อให้ทีมปรับตัวและตรวจสอบปัญหาได้ โดยยังดูแลงานประจำได้ต่อเนื่อง',
  'ขั้นแรก เราควรยืนยันขั้นตอนงานเดิม ข้อมูลที่ต้องใช้ และผู้รับผิดชอบร่วมกัน จากนั้นกำหนดให้ชัดว่าส่วนใดควรเริ่มใช้ระบบใหม่ และเราจะเข้าใจข้อจำกัดหรือความพร้อม',
  'ก่อนเริ่มทดลอง ควรเตรียมข้อมูล ทดสอบสิทธิ์การใช้งาน และให้ผู้ใช้ลองทำงานจริง พร้อมมีช่องทางแจ้งปัญหา หากเกิดปัญหาที่กระทบงานสำคัญ ก็ต้องมีแนวทางกลับไปทำงานด้วยวิธีเดิมชั่วคราวครับ',
  'ระหว่างทดลอง เราจะติดตามเวลาที่ใช้ทำงาน ข้อผิดพลาด และความเห็นของผู้ใช้ แล้วนำผลมาปรับปรุงก่อนขยายการใช้งานจริง สิ่งที่ควรตกลงในวันนี้คือ ขอบเขตทดลอง ผู้รับผิดชอบ และเกณฑ์ประเมินผล เพื่อให้วางแผนได้เหมาะสมและลดผลกระทบต่องานประจำครับ',
];

const waveHeights = [4, 8, 12, 5, 17, 10, 22, 14, 8, 18, 11, 24, 15, 7, 20, 13, 5, 17, 10, 23, 14, 8, 18, 12, 5, 16, 10, 22, 13, 6, 18, 10, 4, 14, 8, 18, 11, 5, 16, 9, 20, 12];

function App() {
  const [settingsOpen, setSettingsOpen] = useState(
    () => new URLSearchParams(window.location.search).get('settings') === 'open',
  );
  const [paused, setPaused] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [speed, setSpeed] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [highlight, setHighlight] = useState(true);
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<string[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [source, setSource] = useState('จากเสียงสนทนา');
  const [selectedFile, setSelectedFile] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  }, []);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeaking(true);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(scriptParagraphs.join(' '));
    utterance.lang = 'th-TH';
    utterance.rate = speed;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const toggleMic = () => {
    if (micActive) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setMicActive(false);
      return;
    }
    const SpeechRecognition = (window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
    }).SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: new () => {
      lang: string; interimResults: boolean;
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void; onerror: () => void; start: () => void; stop: () => void;
    } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput((current) => current || '');
      textareaRef.current?.focus();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join('');
      setInput(transcript);
    };
    recognition.onend = () => { setMicActive(false); recognitionRef.current = null; };
    recognition.onerror = () => { setMicActive(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    recognition.start();
    setMicActive(true);
  };

  const sendQuestion = () => {
    const value = input.trim();
    if (!value) {
      textareaRef.current?.focus();
      return;
    }
    setQueue((items) => [...items, value]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const openFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
    }
  };

  return (
    <main className="assistant-app" data-testid="screen-assistant">
      <header className="topbar">
        <div className="brand" aria-label="ARTYVERSE X AI ASSISTANT">
          <span className="brand-mark" aria-hidden="true" />
          <div className="brand-word">ARTYVERSE <b>X</b><span> AI ASSISTANT</span></div>
          <svg className="brand-mascot" viewBox="0 0 48 40" aria-hidden="true">
            <path d="M22 8V4m0 0c0-2 3-2 3 0" fill="none" stroke="#e91383" strokeWidth="2" strokeLinecap="round" />
            <circle cx="25" cy="4" r="2" fill="#c8ec24" />
            <path d="M13 16c0-6 5-10 12-10s12 4 12 10v8c0 6-5 10-12 10s-12-4-12-10z" fill="#17213f" />
            <path d="M17 17c0-4 3-7 8-7s8 3 8 7v5H17z" fill="#f7f9fc" />
            <circle cx="21" cy="18" r="2" fill="#e91383" />
            <circle cx="29" cy="18" r="2" fill="#c8ec24" />
            <path d="M21 24c2 2 6 2 8 0" fill="none" stroke="#f7f9fc" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 21h3m24 0h3M18 33l-3 4m18-4 3 4" stroke="#e91383" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 34h12l2 4H17z" fill="#c8ec24" />
            <path d="M9 18l2-3m28 3-2-3" stroke="#f3b524" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="header-actions">
          <button className="header-button" type="button" aria-label="ปรับการอ่าน" aria-expanded={settingsOpen} aria-controls="settings-panel" onClick={() => setSettingsOpen((open) => !open)} data-testid="button-settings">
            <SlidersHorizontal /><span className="wide-label">ปรับการอ่าน</span>
          </button>
          <button className="header-button" type="button" aria-label="เมนูเพิ่มเติม" onClick={() => setMoreOpen((open) => !open)} data-testid="button-more">
            <AlignJustify /><span className="wide-label">เมนู</span>
          </button>
        </div>
      </header>

      <section className="live-line" aria-label="สถานะการฟัง">
        <div className="listening-pill"><span className="green-dot" /><span data-testid="status-listening">{paused ? 'พักการฟัง' : 'กำลังฟัง'}</span></div>
        <div className="wave" aria-hidden="true">{waveHeights.map((height, index) => <i key={index} style={{ '--h': `${height}px` } as CSSProperties} />)}</div>
        <span className="time" data-testid="text-timer">00:24</span>
        <button className="pause-button" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} data-testid="button-pause-listening">
          {paused ? <Play /> : <Pause />}<span>{paused ? 'เริ่มฟัง' : 'พักฟัง'}</span>
        </button>
        <button className="source-select" type="button" aria-label={`แหล่งที่มา ${source}`} onClick={() => setSource((value) => value === 'จากเสียงสนทนา' ? 'จากไมโครโฟน' : 'จากเสียงสนทนา')} data-testid="button-source">
          <Mic className="mic-icon" /><span>{source}</span><ChevronDown />
        </button>
      </section>

      <div className={`conversation-layout${settingsOpen ? ' settings-visible' : ''}`}>
        <section className="conversation" aria-label="บทสนทนา" data-testid="conversation-scroll">
          <div className="conversation-inner">
            <div className="question-head">
              <CircleHelp className="question-symbol" aria-hidden="true" />
              <div className="question-caption"><span>คำถามปัจจุบัน</span><ChevronDown size={12} /><span className="question-tag">Q12</span></div>
              <div className="question-content">
                <h1 className="question-text" data-testid="question-current">เราควรเริ่มนำระบบใหม่มาใช้งานอย่างไร ให้กระทบงานประจำวันน้อยที่สุด?</h1>
                <div className="answer-tools">
                  <button className="outline-tool" type="button" onClick={() => void copyText('เราควรเริ่มนำระบบใหม่มาใช้งานอย่างไร ให้กระทบงานประจำวันน้อยที่สุด?')} data-testid="button-copy-audio"><ClipboardList /><span>ถอดเสียง</span></button>
                  <button className="outline-tool" type="button" onClick={() => { setQuestionOpen((open) => !open); document.querySelector('.queue-strip')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }} data-testid="button-copy-question"><ClipboardList /><span>คิวคำถาม</span><span className="queue-count">{queue.length + 2}</span><ChevronRight /></button>
                </div>
              </div>
            </div>

            <article className="script-card" data-testid="card-script">
              <div className="script-head">
                <span className="script-mark" aria-hidden="true">//</span>
                <span className="script-title">Full Speaker Script</span>
                <span className="script-q">Q12</span>
                <div className="script-controls">
                  <button type="button" aria-label="ปรับขนาดตัวอักษร" onClick={() => setFontSize((size) => size >= 24 ? 16 : size + 2)} data-testid="button-font-size">Aa</button>
                  <button className="read-button" type="button" aria-label={speaking ? 'พักการอ่าน' : 'อ่านบทพูด'} aria-pressed={speaking} onClick={toggleSpeech} data-testid="button-read-script">
                    {speaking ? <Pause /> : <Pause />}<span>พรีเซ็น</span>
                  </button>
                  <button type="button" aria-label="ความเร็วการอ่าน" onClick={() => setSpeed((current) => current >= 1.5 ? 0.5 : current + 0.5)} data-testid="button-speed">{speed}x <ChevronDown size={12} /></button>
                  <button type="button" aria-label="เต็มหน้าจอ" onClick={openFullscreen} data-testid="button-fullscreen"><Expand /></button>
                  <button type="button" aria-label="ตัวเลือกเพิ่มเติม" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)} data-testid="button-script-more"><Ellipsis /></button>
                </div>
              </div>
              <div className="script-body" style={{ fontSize: `clamp(12px, ${fontSize * 0.7}px, ${fontSize * 0.7}px)` }} data-testid="text-speaker-script">
                {scriptParagraphs.map((paragraph, index) => <p key={paragraph} data-testid={`script-paragraph-${index + 1}`}>{paragraph}</p>)}
              </div>
            </article>
            <div className="queue-strip" data-testid="status-queued-questions">
              <span>Q{13 + queue.length}</span><span>•</span>
              <span className="queue-count">มีคำถามใหม่ {1 + queue.length} ข้อ</span>
              <button type="button" onClick={() => setQuestionOpen((open) => !open)} aria-expanded={questionOpen} data-testid="button-open-question">
                {questionOpen ? 'ปิดคำถาม' : 'เปิดคำถาม'}<ChevronRight />
              </button>
            </div>
            {questionOpen && <div className="queue-item" data-testid="text-next-question">Q13 • มีคำถามใหม่ 1 ข้อ{queue.length > 0 ? ` — ${queue[queue.length - 1]}` : ''}</div>}
            {queue.map((item, index) => <div className="queue-item" key={`${index}-${item}`} data-testid={`text-queued-question-${index}`}>{item}</div>)}
            {moreOpen && <div className="queue-item" role="status" data-testid="status-more-menu">ตัวเลือกบทพูด</div>}
          </div>
        </section>

        <button className="sheet-scrim" type="button" aria-label="ปิดการตั้งค่า" onClick={() => setSettingsOpen(false)} tabIndex={settingsOpen ? 0 : -1} data-testid="button-settings-scrim" />
        <aside className="settings-panel" id="settings-panel" aria-label="ปรับการอ่าน" aria-hidden={!settingsOpen}>
          <div className="settings-heading"><span>ปรับการอ่าน</span><button type="button" onClick={() => setSettingsOpen(false)} aria-label="ปิดการตั้งค่า" data-testid="button-close-settings"><X /></button></div>
          <div className="setting-row">
            <label className="setting-label" htmlFor="font-slider">ขนาดตัวอักษร <output className="setting-value">{fontSize} px</output></label>
            <div className="range-line"><input id="font-slider" type="range" min="16" max="24" step="2" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} aria-label="ขนาดตัวอักษร" data-testid="input-font-size" /><output>{fontSize} px</output></div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>เลื่อนอัตโนมัติ</span><button className={`switch${autoScroll ? ' on' : ''}`} type="button" role="switch" aria-checked={autoScroll} aria-label="เลื่อนอัตโนมัติ" onClick={() => setAutoScroll((value) => !value)} data-testid="toggle-auto-scroll" /></div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>ความเร็วการอ่าน</span></div>
            <div className="speed-options" role="group" aria-label="ความเร็วการอ่าน">
              {[0.5, 1, 1.5].map((option) => <button className={speed === option ? 'active' : ''} key={option} type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)} data-testid={`button-speed-${String(option).replace('.', '-')}`}>{option}x</button>)}
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>ไฮไลต์ประโยคที่กำลังอ่าน</span><button className={`switch${highlight ? ' on' : ''}`} type="button" role="switch" aria-checked={highlight} aria-label="ไฮไลต์ประโยคที่กำลังอ่าน" onClick={() => setHighlight((value) => !value)} data-testid="toggle-highlight" /></div>
          </div>
          <button className="done-button" type="button" onClick={() => setSettingsOpen(false)} data-testid="button-settings-done">เสร็จสิ้น</button>
        </aside>
      </div>

      <footer className="composer-dock">
        <form className="composer" onSubmit={(event) => { event.preventDefault(); sendQuestion(); }} data-testid="form-question">
              <button className="attach-button" type="button" aria-label="แนบไฟล์" onClick={() => fileInputRef.current?.click()} data-testid="button-attach"><Paperclip /></button>
          <input ref={fileInputRef} type="file" className="sr-only" aria-label="เลือกไฟล์แนบ" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? '')} data-testid="input-attachment" />
          <textarea ref={textareaRef} value={input} rows={1} placeholder="ถามเพิ่มเติมหรือพิมพ์บริบท..." aria-label="ถามเพิ่มเติมหรือพิมพ์บริบท" onChange={(event) => { setInput(event.target.value); event.target.style.height = 'auto'; event.target.style.height = `${Math.min(event.target.scrollHeight, 100)}px`; }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendQuestion(); } }} data-testid="input-question" />
          <button className={`mic-button${micActive ? ' listening' : ''}`} type="button" aria-label={micActive ? 'หยุดบันทึกเสียง' : 'เริ่มบันทึกเสียง'} aria-pressed={micActive} onClick={toggleMic} data-testid="button-microphone"><Mic /></button>
          <button className="send-button" type="submit" aria-label="ส่งคำถาม" data-testid="button-send-question"><Send /></button>
        </form>
        {selectedFile && <span className="sr-only" role="status" data-testid="status-attached-file">แนบไฟล์ {selectedFile}</span>}
      </footer>
    </main>
  );
}

export default App;
