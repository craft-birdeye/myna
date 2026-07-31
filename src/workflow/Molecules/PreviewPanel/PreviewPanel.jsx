import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceChatDrawer } from '../../../components/VoiceChatDrawer/VoiceChatDrawer';
import { Tooltip } from '../../../components/Tooltip/Tooltip';
import voicemailSample from '../../../assets/voicemail_sample.mp3';
import {
  PREVIEW_DEMO_SCRIPT as DEMO_SCRIPT,
  PREVIEW_GREETING as GREETING,
  OUTBOUND_REMINDER_DEMO_SCRIPT,
  PreviewLogsView,
  PreviewSidePanelHeader,
  OutboundPreviewLogsPanel,
  buildReminderPreviewLogSteps,
  buildVoiceCallLogOutput,
  buildEndLogStep,
} from './PreviewPanelViews';
import './PreviewPanel.css';

/* ── Web Speech helpers ─────────────────────────────────────── */
function speakText(text, onEnd, speakerOff) {
  if (speakerOff || !window.speechSynthesis) { setTimeout(onEnd, 200); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate  = 1.25;  // confident, brisk
  utter.pitch = 0.97;  // slightly lower = authoritative, not squeaky
  const voices = window.speechSynthesis.getVoices();
  // Priority: stylish accents first (Irish/Scottish/Australian/British), then US natural female, then any female
  const pick =
    voices.find(v => /moira/i.test(v.name)) ||           // Irish — warm & confident
    voices.find(v => /fiona/i.test(v.name)) ||           // Scottish — distinctive
    voices.find(v => /karen/i.test(v.name)) ||           // Australian — crisp
    voices.find(v => /serena|martha|emily/i.test(v.name)) || // British English
    voices.find(v => /en[-_]GB/i.test(v.lang) && /natural|enhanced|premium/i.test(v.name)) ||
    voices.find(v => /en[-_]AU/i.test(v.lang) && /natural|enhanced|premium/i.test(v.name)) ||
    voices.find(v => /samantha|ava|allison|susan|zoe|victoria/i.test(v.name)) || // US female
    voices.find(v => /en/i.test(v.lang) && !/daniel|david|mark|fred|alex|tom|george|arthur|oliver/i.test(v.name)) ||
    voices.find(v => /en/i.test(v.lang));
  if (pick) utter.voice = pick;
  utter.onend  = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
}

const PREVIEW_CALL_SUMMARY =
  'Patient reported tooth-origin pain with mild swelling (no fever or breathing issues). Myna screened symptoms and offered an urgent appointment, but the patient ended the call.';

/* ── Sound-wave bars (5 bars) ───────────────────────────────── */
function SoundWave({ active }) {
  return (
    <div className={`pp-wave${active ? ' pp-wave--active' : ''}`} aria-hidden>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`pp-wave__bar pp-wave__bar--${i}`} />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
let _id = 0;
const uid = () => { _id += 1; return _id; };

function TranscriptMessages({ messages, interim }) {
  return (
    <>
      {messages.map(m => {
        if (m.role === 'system') {
          return <div key={m.id} className="pp-system">{m.text}</div>;
        }
        if (m.role === 'agent') {
          return (
            <div key={m.id} className="pp-agent-row">
              <div className="pp-agent-avatar">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <p className="pp-agent-text">{m.text || <span className="pp-cursor" />}</p>
            </div>
          );
        }
        return (
          <div key={m.id} className="pp-user-row">
            <p className="pp-user-bubble">{m.text}</p>
          </div>
        );
      })}
      {interim && (
        <div className="pp-user-row">
          <p className="pp-user-bubble pp-user-bubble--interim">{interim}</p>
        </div>
      )}
    </>
  );
}

/* ── Outbound (Reminder Agent) preview panel ────────────────── */
function OutboundPreviewPanel({ onClose, testAppointment, onPreviewActiveChange, onEditAppointment }) {
  const previewData = buildReminderPreviewLogSteps(testAppointment);
  const { patientName, phone, appointmentLine } = previewData;
  const [logSteps, setLogSteps] = useState(() => previewData.steps);
  const [panelView, setPanelView] = useState('preview');
  const [visibleCount, setVisibleCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [callPhase, setCallPhase] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [agentTalking, setAgentTalking] = useState(false);
  const timersRef = useRef([]);
  const streamRef = useRef(null);
  const demoScriptRef = useRef(false);
  const bottomRef = useRef(null);

  const showLogs = panelView === 'logs';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onPreviewActiveChange?.(callPhase === 'active');
    return () => onPreviewActiveChange?.(false);
  }, [callPhase, onPreviewActiveChange]);

  useEffect(() => {
    setPanelView('preview');
    setVisibleCount(0);
    setCompletedCount(0);
    setCallPhase('idle');
    setMessages([]);
    setAgentTalking(false);
    demoScriptRef.current = false;
    clearInterval(streamRef.current);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!testAppointment) return undefined;

    setLogSteps(buildReminderPreviewLogSteps(testAppointment).steps);

    const schedule = (fn, delay) => {
      timersRef.current.push(setTimeout(fn, delay));
    };

    schedule(() => {
      setVisibleCount(1);
      setCompletedCount(1);
    }, 400);
    schedule(() => setVisibleCount(2), 1500);
    schedule(() => setCompletedCount(2), 4500);
    schedule(() => {
      setVisibleCount(3);
      setCompletedCount(3);
    }, 5100);
    schedule(() => {
      setVisibleCount(4);
      setCompletedCount(4);
    }, 5700);
    schedule(() => {
      setVisibleCount(5);
      setCompletedCount(4);
    }, 6300);
    schedule(() => {
      setCompletedCount(5);
      setCallPhase('calling');
    }, 6900);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      clearInterval(streamRef.current);
    };
  }, [testAppointment]);

  const agentSay = useCallback((text, onDone) => {
    setAgentTalking(true);
    const id = uid();
    setMessages((prev) => [...prev, { id, role: 'agent', text: '' }]);

    const words = text.split(' ');
    let i = 0;
    clearInterval(streamRef.current);

    streamRef.current = setInterval(() => {
      i += 1;
      const partial = words.slice(0, i).join(' ');
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: partial } : m)));
      if (i >= words.length) {
        clearInterval(streamRef.current);
        setAgentTalking(false);
        setTimeout(onDone, 300);
      }
    }, 42);
  }, []);

  const playDemoScript = useCallback((turns) => {
    demoScriptRef.current = true;
    let i = 0;

    function next() {
      if (!demoScriptRef.current || i >= turns.length) return;
      const turn = turns[i];
      i += 1;

      if (turn.role === 'user') {
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: uid(), role: 'user', text: turn.text }]);
          setTimeout(next, 600);
        }, 900);
      } else {
        setTimeout(() => {
          agentSay(turn.text, () => {
            setTimeout(next, 700);
          });
        }, 400);
      }
    }

    next();
  }, [agentSay]);

  const handleAnswerCall = useCallback(() => {
    demoScriptRef.current = false;
    clearInterval(streamRef.current);
    setAgentTalking(false);
    setCallPhase('active');
    setPanelView('preview');
    setVisibleCount(5);
    setCompletedCount(4);
    setLogSteps((prev) =>
      prev.map((step) =>
        step.id === 'voice-call'
          ? { ...step, outputSections: [buildVoiceCallLogOutput(phone, false)] }
          : step,
      ),
    );

    setMessages([{ id: uid(), role: 'system', text: 'Outbound call started' }]);
    setTimeout(() => {
      agentSay(GREETING, () => playDemoScript(OUTBOUND_REMINDER_DEMO_SCRIPT));
    }, 400);
  }, [agentSay, phone, playDemoScript]);

  const handleEndCall = useCallback(() => {
    demoScriptRef.current = false;
    clearInterval(streamRef.current);
    setAgentTalking(false);
    setCallPhase('ended');
    setMessages((prev) => [...prev, { id: uid(), role: 'system', text: 'You ended the call' }]);
    setPanelView('logs');

    setLogSteps((prev) => {
      const withVoiceComplete = prev
        .filter((step) => step.id !== 'end')
        .map((step) =>
          step.id === 'voice-call'
            ? { ...step, outputSections: [buildVoiceCallLogOutput(phone, true)] }
            : step,
        );
      return [...withVoiceComplete, buildEndLogStep()];
    });

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const schedule = (fn, delay) => {
      timersRef.current.push(setTimeout(fn, delay));
    };
    schedule(() => setCompletedCount(5), 400);
    schedule(() => setVisibleCount(6), 1200);
    schedule(() => setCompletedCount(6), 2000);
  }, [phone]);

  const handleRestartCall = useCallback(() => {
    demoScriptRef.current = false;
    clearInterval(streamRef.current);
    setAgentTalking(false);
    setMessages([]);
    setCallPhase('calling');
    setPanelView('preview');
    setVisibleCount(5);
    setCompletedCount(4);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setLogSteps((prev) =>
      prev
        .filter((step) => step.id !== 'end')
        .map((step) =>
          step.id === 'voice-call'
            ? { ...step, outputSections: [] }
            : step,
        ),
    );
  }, []);

  const handleToggleView = useCallback(() => {
    setPanelView((v) => (v === 'logs' ? 'preview' : 'logs'));
  }, []);

  const showProgressiveLogs = Boolean(testAppointment) && showLogs;
  const showInitialPreview =
    Boolean(testAppointment) &&
    !showLogs &&
    (callPhase === 'idle' || callPhase === 'calling');
  const showCallPrompt = !showLogs && callPhase === 'calling';
  const showConversation = !showLogs && (callPhase === 'active' || callPhase === 'ended');
  const showViewLogsToggle = Boolean(testAppointment);

  return (
    <div className="preview-panel">
      <PreviewSidePanelHeader
        panel={showLogs ? 'logs' : 'preview'}
        onToggle={handleToggleView}
        showClose={true}
        onClose={onClose}
        showViewLogs={showViewLogsToggle}
        logsLinkDisabled={!testAppointment}
      />

      <div
        className={`preview-panel__body preview-panel__body--outbound${
          showConversation ? ' preview-panel__body--outbound-call' : ''
        }`}
      >
        {(showProgressiveLogs || showInitialPreview) && (
          <OutboundPreviewLogsPanel
            patientName={patientName}
            appointmentLine={appointmentLine}
            phone={phone}
            sections={logSteps}
            visibleCount={visibleCount}
            completedCount={completedCount}
            onEditAppointment={onEditAppointment}
          />
        )}

        {showCallPrompt && (
          <button
            type="button"
            className="preview-panel__call-prompt preview-panel__call-prompt--interactive preview-panel__call-prompt--inline"
            onClick={handleAnswerCall}
          >
            <div className="preview-panel__call-prompt-icon">
              <span className="material-symbols-outlined">call</span>
            </div>
            <span className="preview-panel__call-prompt-title">Agent calling...</span>
            <span className="preview-panel__call-prompt-subtitle">
              Incoming call to {phone}
            </span>
            <span className="preview-panel__call-prompt-subtitle">
              Answer the call to complete the test
            </span>
          </button>
        )}

        {showConversation && (
          <div className="preview-panel__active preview-panel__active--outbound">
            <div className="preview-panel__transcript">
              <TranscriptMessages messages={messages} />
              <div ref={bottomRef} />
            </div>

            {callPhase === 'active' && (
              <div className="preview-panel__call-controls">
                <button className="preview-panel__ctrl-btn" type="button" disabled aria-label="Mute">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button
                  className="preview-panel__end-call-btn"
                  type="button"
                  onClick={handleEndCall}
                  aria-label="End call"
                >
                  <span className="material-symbols-outlined">call_end</span>
                </button>
                <button className="preview-panel__ctrl-btn" type="button" disabled aria-label="Speaker">
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
              </div>
            )}

            {callPhase === 'ended' && (
              <div className="preview-panel__ended-actions">
                <button
                  className="preview-panel__restart-btn"
                  type="button"
                  onClick={handleRestartCall}
                >
                  Preview again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreviewPanel({
  onClose,
  onPreviewActiveChange,
  onSessionEnded = () => {},
  showClose = true,
  showViewDetails = true,
  showViewLogs = true,
  agentName = '',
  testAppointment = null,
  onEditAppointment = null,
  scriptedTranscript = /** @type {{ role: string, text: string }[] | null} */ (null),
  // Lets a caller (e.g. a recommendation's "Test live" button) seed the simulated call/chat with
  // its own scenario instead of the generic dental demo script, so the live test stays on-topic.
  greeting = GREETING,
  demoScript = DEMO_SCRIPT,
}) {
  const [panelView, setPanelView]   = useState('preview'); // preview | logs | details
  const [phase, setPhase]         = useState('idle');   // idle | dialing | active | ended
  const [mode, setMode]           = useState('none');   // none | voice | chat
  const [dialStatus, setDialStatus] = useState('');
  const [messages, setMessages]   = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [interim, setInterim]     = useState('');
  const [muted, setMuted]         = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [agentTalking, setAgentTalking] = useState(false);

  const recognizerRef = useRef(null);
  const streamRef     = useRef(null);
  const speakerRef    = useRef(speakerOff);
  const modeRef       = useRef(mode);
  const bottomRef     = useRef(null);
  const scriptLoadedRef = useRef(false);
  const onSessionEndedRef = useRef(onSessionEnded);
  useEffect(() => { onSessionEndedRef.current = onSessionEnded; }, [onSessionEnded]);

  // When a scripted transcript is supplied, clicking into the chat box loads the
  // whole simulated test conversation at once (no real run).
  const loadScriptedTranscript = useCallback(() => {
    if (!scriptedTranscript || scriptLoadedRef.current || phase !== 'idle') return;
    scriptLoadedRef.current = true;
    setMode('chat');
    modeRef.current = 'chat';
    setPhase('active');
    setMessages(scriptedTranscript.map((m) => ({ id: uid(), role: m.role, text: m.text })));
  }, [scriptedTranscript, phase]);

  useEffect(() => { speakerRef.current = speakerOff; }, [speakerOff]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Auto-scroll transcript
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interim]);

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    recognizerRef.current?.abort();
    clearInterval(streamRef.current);
    onPreviewActiveChange?.(false);
  }, [onPreviewActiveChange]);

  // Notify canvas when preview run is active (session in progress or logs visible)
  useEffect(() => {
    const active = phase === 'dialing' || phase === 'active' || panelView === 'logs';
    onPreviewActiveChange?.(active);
  }, [phase, panelView, onPreviewActiveChange]);

  const shouldSpeak = useCallback(() => modeRef.current === 'voice', []);

  /* Stream agent words into transcript; TTS only for voice */
  const agentSay = useCallback((text, onDone) => {
    const speak = shouldSpeak();
    setAgentTalking(true);
    const id = uid();
    setMessages(prev => [...prev, { id, role: 'agent', text: '' }]);

    const words = text.split(' ');
    let i = 0;
    clearInterval(streamRef.current);

    if (speak) {
      speakText(text, () => {
        setAgentTalking(false);
        onDone?.();
      }, speakerRef.current);
    }

    streamRef.current = setInterval(() => {
      i++;
      const partial = words.slice(0, i).join(' ');
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: partial } : m));
      if (i >= words.length) {
        clearInterval(streamRef.current);
        if (!speak) {
          setAgentTalking(false);
          setTimeout(onDone, 300);
        } else if (speakerRef.current) {
          setAgentTalking(false);
          setTimeout(onDone, 300);
        }
      }
    }, speak ? 72 : 42);
  }, [shouldSpeak]);

  /* Play the demo script turn by turn after greeting */
  const demoScriptRef = useRef(false);

  const playDemoScript = useCallback((turns) => {
    demoScriptRef.current = true;
    let i = 0;

    function next() {
      if (!demoScriptRef.current || i >= turns.length) return;
      const turn = turns[i++];

      if (turn.role === 'user') {
        // Show user bubble after a realistic pause
        setTimeout(() => {
          setMessages(prev => [...prev, { id: uid(), role: 'user', text: turn.text }]);
          // Short pause before agent responds
          setTimeout(next, 600);
        }, 900);
      } else {
        // Agent streams + speaks, then advance
        setTimeout(() => {
          agentSay(turn.text, () => {
            setTimeout(next, 700);
          });
        }, 400);
      }
    }

    next();
  }, [agentSay]);

  /* Dial → ring → connect */
  const handleStartCall = useCallback(() => {
    demoScriptRef.current = false;
    setMode('voice');
    modeRef.current = 'voice';
    setChatInput('');
    setPhase('dialing');
    setDialStatus('Connecting...');
    setMessages([]);

    setTimeout(() => setDialStatus('Ringing...'), 1200);
    setTimeout(() => {
      setPhase('active');
      setDialStatus('');
      setMessages([{ id: uid(), role: 'system', text: 'Call started' }]);
      agentSay(greeting, () => playDemoScript(demoScript));
    }, 2800);
  }, [agentSay, playDemoScript, greeting, demoScript]);

  /* Start web chat from first sent message */
  const handleSendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text || agentTalking) return;

    if (phase === 'idle') {
      demoScriptRef.current = false;
      setMode('chat');
      modeRef.current = 'chat';
      setPhase('active');
      setMessages([
        { id: uid(), role: 'system', text: 'Conversation started' },
        { id: uid(), role: 'user', text },
      ]);
      setChatInput('');
      agentSay(greeting, () => playDemoScript(demoScript));
      return;
    }

    if (phase === 'active' && mode === 'chat') {
      setMessages(prev => [...prev, { id: uid(), role: 'user', text }]);
      setChatInput('');
    }
  }, [chatInput, agentTalking, phase, mode, agentSay, playDemoScript, greeting, demoScript]);

  const stopSession = useCallback((endedLabel) => {
    demoScriptRef.current = false;
    window.speechSynthesis?.cancel();
    recognizerRef.current?.abort();
    clearInterval(streamRef.current);
    setInterim('');
    setAgentTalking(false);
    setDialStatus('');
    setChatInput('');
    setPhase('ended');
    setMessages(prev => [...prev, { id: uid(), role: 'system', text: endedLabel }]);
    onSessionEndedRef.current?.();
  }, []);

  /* Hang up voice call */
  const handleEndCall = useCallback(() => {
    stopSession('You ended the call');
  }, [stopSession]);

  /* Stop web chat */
  const handleStopChat = useCallback(() => {
    stopSession('You ended the chat');
  }, [stopSession]);

  /* Reset fully to idle */
  const handleReset = useCallback(() => {
    demoScriptRef.current = false;
    scriptLoadedRef.current = false;
    window.speechSynthesis?.cancel();
    clearInterval(streamRef.current);
    setPhase('idle');
    setMode('none');
    modeRef.current = 'none';
    setMessages([]);
    setChatInput('');
    setInterim('');
    setAgentTalking(false);
    setDialStatus('');
  }, []);

  const showLogs = panelView === 'logs';
  const logsLinkDisabled = !showLogs && phase === 'idle';

  const handleToggleView = useCallback(() => {
    if (logsLinkDisabled) return;
    setPanelView((v) => (v === 'logs' ? 'preview' : 'logs'));
  }, [logsLinkDisabled]);

  const handleClose = useCallback(() => {
    handleReset();
    setPanelView('preview');
    onClose?.();
  }, [handleReset, onClose]);

  const showChatFooter = !showLogs && phase !== 'ended' && (phase === 'idle' || mode === 'chat');
  const chatInputActive = phase === 'active' && mode === 'chat';
  const chatInputDisabled = phase === 'ended' || agentTalking;

  /* ── Render ─────────────────────────────────────────────── */

  // Outbound agents get a different preview UI
  const isOutbound = /reminder/i.test(agentName);
  if (isOutbound) {
    return (
      <OutboundPreviewPanel
        onClose={() => { handleReset(); onClose?.(); }}
        testAppointment={testAppointment}
        onPreviewActiveChange={onPreviewActiveChange}
        onEditAppointment={onEditAppointment}
      />
    );
  }

  return (
    <>
      <VoiceChatDrawer
        open={panelView === 'details'}
        messages={messages}
        mode={mode}
        summary={PREVIEW_CALL_SUMMARY}
        audioUrl={mode === 'voice' ? voicemailSample : undefined}
        onClose={() => setPanelView('preview')}
      />

    <div className="preview-panel">

      <PreviewSidePanelHeader
        panel={showLogs ? 'logs' : 'preview'}
        onToggle={handleToggleView}
        showClose={showClose}
        onClose={handleClose}
        showViewLogs={showViewLogs}
        logsLinkDisabled={logsLinkDisabled}
      />

      {/* Body */}
      <div className="preview-panel__body">

        {showLogs ? (
          <PreviewLogsView />
        ) : phase === 'idle' && (
          <div className="preview-panel__idle">
            <div className="preview-panel__gradient-bg" />
            <button className="preview-panel__call-btn" type="button" onClick={handleStartCall} aria-label="Start a call">
              <span className="material-symbols-outlined">call</span>
            </button>
            <span className="preview-panel__call-label">Start a call</span>
          </div>
        )}

        {/* ── DIALING ── */}
        {!showLogs && phase === 'dialing' && (
          <div className="preview-panel__dialing">
            <div className="preview-panel__gradient-bg" />
            <p className="preview-panel__dial-status">{dialStatus}</p>
            <SoundWave active={false} />
            <div className="preview-panel__call-controls">
              <button className="preview-panel__ctrl-btn" type="button" disabled aria-label="Mute">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="preview-panel__end-call-btn" type="button" onClick={handleEndCall} aria-label="End call">
                <span className="material-symbols-outlined">call_end</span>
              </button>
              <button className="preview-panel__ctrl-btn" type="button" disabled aria-label="Speaker">
                <span className="material-symbols-outlined">volume_up</span>
              </button>
            </div>
          </div>
        )}

        {/* ── ACTIVE CHAT ── */}
        {!showLogs && phase === 'active' && mode === 'chat' && (
          <div className="preview-panel__active preview-panel__active--chat">
            <div className="preview-panel__transcript">
              <TranscriptMessages messages={messages} interim={interim} />
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* ── ACTIVE CALL ── */}
        {!showLogs && phase === 'active' && mode === 'voice' && (
          <div className="preview-panel__active">

            {/* Transcript */}
            <div className="preview-panel__transcript">
              <TranscriptMessages messages={messages} interim={interim} />
              <div ref={bottomRef} />
            </div>

            {/* Controls */}
            <div className="preview-panel__call-controls">
              <button
                className={`preview-panel__ctrl-btn${muted ? ' preview-panel__ctrl-btn--on' : ''}`}
                type="button"
                onClick={() => setMuted(v => !v)}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined">{muted ? 'mic_off' : 'mic'}</span>
              </button>

              <button className="preview-panel__end-call-btn" type="button" onClick={handleEndCall} aria-label="End call">
                <span className="material-symbols-outlined">call_end</span>
              </button>

              <button
                className={`preview-panel__ctrl-btn${speakerOff ? ' preview-panel__ctrl-btn--on' : ''}`}
                type="button"
                onClick={() => {
                  setSpeakerOff(v => !v);
                  if (!speakerOff) window.speechSynthesis?.cancel();
                }}
                aria-label="Speaker"
              >
                <span className="material-symbols-outlined">{speakerOff ? 'volume_off' : 'volume_up'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── ENDED ── */}
        {!showLogs && phase === 'ended' && (
          <div className="preview-panel__active preview-panel__active--chat">
            <div className="preview-panel__transcript">
              <TranscriptMessages messages={messages} interim={interim} />
              <div ref={bottomRef} />
            </div>

            <div className="preview-panel__ended-actions">
              <button
                className="preview-panel__restart-btn"
                type="button"
                onClick={!showViewDetails ? handleReset : mode === 'chat' ? handleReset : handleStartCall}
              >
                {!showViewDetails ? 'Test again' : mode === 'chat' ? 'Start a chat' : 'Test again'}
              </button>
              {showViewDetails && (
                <button className="preview-panel__details-btn" type="button" onClick={() => setPanelView('details')}>
                  View details
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer — web chat input */}
      {showChatFooter && (
        <div className="preview-panel__footer">
          <div
            className={`preview-panel__input-wrap${chatInputActive ? ' preview-panel__input-wrap--active' : ''}`}
            onClick={loadScriptedTranscript}
          >
            <textarea
              className="preview-panel__input"
              placeholder={phase === 'idle' ? 'Send a message to start a chat' : 'Enter'}
              rows={3}
              value={chatInput}
              disabled={chatInputDisabled}
              onFocus={loadScriptedTranscript}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="preview-panel__input-actions">
              {chatInputActive && (
                <Tooltip content="End conversation" variant="brief">
                  <button
                    className="preview-panel__stop-btn"
                    type="button"
                    onClick={handleStopChat}
                    aria-label="End conversation"
                  >
                    <span className="material-symbols-outlined">stop_circle</span>
                  </button>
                </Tooltip>
              )}
              <button
                className={`preview-panel__send-btn${chatInput.trim() && !chatInputDisabled ? ' preview-panel__send-btn--active' : ''}`}
                type="button"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatInputDisabled}
                aria-label="Send"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
