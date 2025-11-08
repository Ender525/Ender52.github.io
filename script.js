//Este escript controla los graficos y efectos visuales de NeonGPT, con un estilo neón más colorido y dinámico casi energetico
// -------- Canvas y contexto (con DPI correcto) --------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resizeCanvas);
resizeCanvas();

// -------- Utilidades --------
function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }
function lerp(a,b,t){ return a + (b - a) * t; }
function parseRGB(rgbStr){
  const m = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if(!m) return {r:255,g:255,b:255};
  return { r:+m[1], g:+m[2], b:+m[3] };
}
function rgbToString({r,g,b}){ return `rgb(${r|0}, ${g|0}, ${b|0})`; }
function lerpColorRGB(c1, c2, t){
  const a = parseRGB(c1), b = parseRGB(c2);
  return rgbToString({ r: lerp(a.r,b.r,t), g: lerp(a.g,b.g,t), b: lerp(a.b,b.b,t) });
}

// -------- Fantasmas (posiciones relativas + bandas/umbrales) --------
// bandIndex ≈ índices 10/20/30 (como tu versión que usaba index*10)
const fantasmas = [
  { xRatio: 0.20, yRatio: 0.55, size: 72, color: 'rgb(255, 0, 255)', targetColor: 'rgb(255, 0, 255)', particles: [], bandIndex: 10, threshold: 90, phase: 0.0 },
  { xRatio: 0.50, yRatio: 0.55, size: 92, color: 'rgb(0, 255, 255)',  targetColor: 'rgb(0, 255, 255)',  particles: [], bandIndex: 20, threshold: 70, phase: 0.9 },
  { xRatio: 0.80, yRatio: 0.55, size: 72, color: 'rgb(255, 255, 0)',  targetColor: 'rgb(255, 255, 0)',  particles: [], bandIndex: 30, threshold: 60, phase: 1.8 },
];

function placeGhosts(){
  fantasmas.forEach(f=>{
    f.x = innerWidth  * f.xRatio;
    f.y = innerHeight * f.yRatio;
  });
}
placeGhosts();
addEventListener('resize', placeGhosts);

// -------- Fondo dinámico sutil (respira con graves) --------
function drawBackground(lowEnergy){
  const pulse = clamp(lowEnergy/255, 0, 1);
  const g = ctx.createRadialGradient(
    innerWidth*0.5, innerHeight*0.58, 80,
    innerWidth*0.5, innerHeight*0.58, Math.max(innerWidth, innerHeight)*0.9
  );
  g.addColorStop(0, `rgba(8,8,10,1)`);
  g.addColorStop(1, `rgba(${10+pulse*30}, ${8}, ${20+pulse*40}, 1)`);
  ctx.fillStyle = g;
  ctx.fillRect(0,0,innerWidth,innerHeight);
}

// -------- Color neón reactivo --------
function energyToNeonColor(energy, phase=0){
  // Senos desfasados para RGB + piso mínimo para look neón
  const t = energy / 48 + phase;
  const r = clamp(Math.abs(Math.sin(t + 0.0)) * 255, 70, 255);
  const g = clamp(Math.abs(Math.sin(t + 2.0)) * 255, 70, 255);
  const b = clamp(Math.abs(Math.sin(t + 4.0)) * 255, 70, 255);
  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}

// -------- Dibujo: fantasma contorno neón + ojos huecos --------
function drawGhostNeon(f, intensity = 1){
  const { x, y, size, color } = f;
  ctx.save();
  ctx.lineWidth = 4 + intensity * 2;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 16 + intensity * 14;
  ctx.shadowColor = color;

  ctx.beginPath();
  // cabeza
  ctx.arc(x, y, size, Math.PI, 2*Math.PI);
  // laterales + base ondulada
  ctx.lineTo(x + size, y + size * 0.95);
  const waves = 5;
  const waveW = (size * 2) / waves;
  for(let i=waves-1; i>=0; i--){
    const wx = x - size + i * waveW;
    const midX = wx + waveW/2;
    const up = (i % 2 === 0) ? (size*0.12) : (size*0.04);
    ctx.quadraticCurveTo(midX, y + size + up, wx, y + size*0.95);
  }
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.stroke();

  // Ojos huecos (solo contorno, estilo neón)
  const eyeR = size * 0.18;
  const eyeY = y - size * 0.28;
  ctx.beginPath();
  ctx.arc(x - size*0.38, eyeY, eyeR, 0, Math.PI*2);
  ctx.arc(x + size*0.38, eyeY, eyeR, 0, Math.PI*2);
  ctx.stroke();

  ctx.restore();
}

// -------- Partículas (alrededor del fantasma) --------
function createParticles(f, energy){
  const count = Math.min(12, 3 + Math.floor(energy / 22)); // más energía → más partículas
  for(let i=0; i<count; i++){
    const angle = Math.random() * Math.PI * 2;

    // 🚀 Ajuste: aumentar radio mínimo para que no choquen con el fantasma
    const minR = f.size * 1.2;   // antes 0.9 → ahora 1.2
    const maxR = f.size * 2.6;   // antes 2.4 → ahora 2.6
    const dist = minR + Math.random() * (maxR - minR);

    // Color derivado del fantasma (con jitter)
    const base = parseRGB(f.color);
    const jitter = () => clamp((Math.random()*80 - 40), -60, 60);
    const col = rgbToString({
      r: clamp(base.r + jitter(), 0, 255),
      g: clamp(base.g + jitter(), 0, 255),
      b: clamp(base.b + jitter(), 0, 255)
    });

    // 🚀 Nuevo: formas variables
    const shapes = ["circle", "square", "star"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    f.particles.push({
      x: f.x + Math.cos(angle) * dist,
      y: f.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      r: 2 + Math.random() * 4,
      life: 28 + Math.random() * 22,
      color: col,
      glow: 8 + Math.random() * 10,
      shape
    });
  }
}

function updateParticles(f){
  for(let i=f.particles.length-1; i>=0; i--){
    const p = f.particles[i];
    p.x += p.vx + (Math.random()-0.5)*0.3;
    p.y += p.vy + (Math.random()-0.5)*0.3;
    p.life -= 1;

    const alpha = clamp(p.life / 35, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = p.glow;
    ctx.shadowColor = p.color;

    // 🚀 Dibujar según la forma
    switch(p.shape){
      case "circle":
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
        break;

      case "square":
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r*2, p.r*2);
        break;

      case "star":
        ctx.beginPath();
        for (let j=0; j<5; j++){
          const angle = (j * Math.PI * 2) / 5;
          const px = p.x + Math.cos(angle) * p.r * 2;
          const py = p.y + Math.sin(angle) * p.r * 2;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();

    if (p.life <= 0) f.particles.splice(i,1);
  }

  // cap para rendimiento
  const MAX_PARTICLES = 400;
  if (f.particles.length > MAX_PARTICLES){
    f.particles.splice(0, f.particles.length - MAX_PARTICLES);
  }
}

// -------- API pública para el módulo de audio --------
const Visuals = {
  render(dataArray){
    // fondo (usar graves)
    const low = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
    drawBackground(low);

    fantasmas.forEach(f => {
      const energy = dataArray[f.bandIndex] || 0;

      // color neón reactivo con suavizado
      const target = energyToNeonColor(energy, f.phase || 0);
      f.targetColor = target;
      f.color = lerpColorRGB(f.color, f.targetColor, 0.25);

      // intensidad para grosor/glow
      const intensity = clamp(energy / 140, 0, 1.5);

      drawGhostNeon(f, intensity);

      // partículas por umbral individual
      if (energy > f.threshold) createParticles(f, energy);
      updateParticles(f);
    });
  },
  resize: placeGhosts
};

window.Visuals = Visuals;
