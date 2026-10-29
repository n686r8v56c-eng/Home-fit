// Keep utterances alive until the browser finishes them, and allow cancel to settle.
const live = new Set();
const pending = new Set();
export function stopVoice() {
  for (const timer of pending) clearTimeout(timer);
  pending.clear();
  globalThis.speechSynthesis?.cancel();
  live.clear();
}
export function speakVoice(utterance) {
  const synth = globalThis.speechSynthesis;
  if (!synth) return;
  live.add(utterance);
  const finish = () => live.delete(utterance);
  utterance.addEventListener('end', finish, {once:true});
  utterance.addEventListener('error', finish, {once:true});
  const timer = setTimeout(() => {
    pending.delete(timer);
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang === utterance.lang) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
    if (voice) utterance.voice = voice;
    synth.resume();
    synth.speak(utterance);
    synth.resume();
  }, 40);
  pending.add(timer);
}
