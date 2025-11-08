const audioInput = document.getElementById('audioInput');

let audioContext = null;
let analyser = null;
let dataArray = null;
let mediaSource = null;
let audioEl = null;
let rafId = null;

// Fallback por si tu HTML usa #audioFile en lugar de #audioInput
const fileInputs = [audioInput, document.getElementById('audioFile')].filter(Boolean);
fileInputs.forEach(inp => inp.addEventListener('change', handleAudioUpload));

function handleAudioUpload(e){
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  else if (audioContext.state === 'suspended') audioContext.resume();

  if (audioEl) { try { audioEl.pause(); } catch {} }

  const url = URL.createObjectURL(file);
  audioEl = new Audio(url);
  audioEl.crossOrigin = 'anonymous';
  audioEl.loop = false;

  // Analyser
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;                 // igual que tu código fuente
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Conexión
  if (mediaSource) { try { mediaSource.disconnect(); } catch {} }
  mediaSource = audioContext.createMediaElementSource(audioEl);
  mediaSource.connect(analyser);
  analyser.connect(audioContext.destination);

  // Play + animación
  audioEl.play().catch(()=>{ /* user gesture policy */ });
  startLoop();
}

function startLoop(){
  cancelLoop();
  const loop = () => {
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);

    // limpiar canvas y renderizar visual
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window.Visuals) window.Visuals.render(dataArray);

    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function cancelLoop(){
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// re-colocar fantasmas cuando cambie viewport
addEventListener('resize', () => {
  if (window.Visuals) window.Visuals.resize();
});

forEach
function startLoop(){
  cancelLoop();
  const loop = () => {
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);

    // limpiar canvas y renderizar visual
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window.Visuals) window.Visuals.render(dataArray);

    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function cancelLoop(){
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// re-colocar fantasmas cuando cambie viewport
addEventListener('resize', () => {
  if (window.Visuals) window.Visuals.resize();
});