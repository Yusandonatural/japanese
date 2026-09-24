// Thin wrapper over the Web Speech API for Japanese read-aloud.
let voice = null;
function pickVoice() {
  if (voice || !window.speechSynthesis) return voice;
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => v.lang === 'ja-JP') || vs.find(v => v.lang && v.lang.startsWith('ja')) || null;
  return voice;
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}

export function canSpeak() { return typeof window !== 'undefined' && !!window.speechSynthesis; }

export function speak(text, rate = 0.9) {
  if (!canSpeak() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export function stop() { if (canSpeak()) speechSynthesis.cancel(); }
