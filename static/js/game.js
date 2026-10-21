// =============================================================================
// Super Mario Bros Clone - Game Engine & Canvas Logic
// =============================================================================

// Inisialisasi Audio Synthesizer (Web Audio API)
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987, now);
    osc.frequency.setValueAtTime(1318, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playStomp() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playGameOver() {
    this.init();
    if (!this.ctx) return;
    const notes = [450, 400, 350, 250];
    let time = this.ctx.currentTime;

    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.18);
      time += 0.18;
    });
  }

  playWin() {
    this.init();
    if (!this.ctx) return;
    const notes = [523, 659, 784, 1046];
    let time = this.ctx.currentTime;

    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.15);
      time += 0.14;
    });
  }
}

const sfx = new SoundEffects();

// =============================================================================
// MAIN GAME CLASS
// =============================================================================
class SuperMarioGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Viewport & Kamera
    this.width = this.canvas.width;   // 800
    this.height = this.canvas.height; // 400
    this.cameraX = 0;
    this.levelWidth = 3200;

    // Game State: 'PLAYING', 'GAMEOVER', 'VICTORY'
    this.state = 'PLAYING';
    this.score = 0;
    this.coins = 0;

    // Input Keys
    this.keys = {
      left: false,
      right: false,
      jump: false
    };

    // Objek Game
    this.mario = null;
    this.platforms = [];
    this.blocks = [];
    this.pipes = [];
    this.enemies = [];
    this.particles = [];
    this.flagpole = null;
    this.castle = null;

    this.initInput();
    this.initLevel();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      sfx.init();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        this.keys.jump = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        this.keys.jump = false;
      }
    });

    // Tombol Main Lagi
    document.getElementById('btnPlayAgain').addEventListener('click', () => {
      this.resetGame();
    });
    document.getElementById('btnPlayAgainWin').addEventListener('click', () => {
      this.resetGame();
    });
  }

  resetGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.coins = 0;
    this.cameraX = 0;
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('victoryModal').classList.add('hidden');
    document.getElementById('statusDisplay').innerText = 'ALIVE';
    document.getElementById('statusDisplay').className = 'text-emerald-400 font-bold';
    this.initLevel();
  }

  initLevel() {
    // 1. Karakter Mario
    this.mario = {
      x: 50,
      y: 280,
      w: 24,
      h: 32,
      vx: 0,
      vy: 0,
      speed: 2.8,
      accel: 0.22,
      friction: 0.82,
      jumpForce: -11.6,
      gravity: 0.55,
      terminalVelocity: 10.5,
      isGrounded: false,
      facing: 'right',
      walkFrame: 0,
      isDead: false
    };

    // 2. Platform Tanah Dasar (dengan beberapa jurang / pits)
    this.platforms = [
      { x: 0, y: 350, w: 900, h: 50 },
      { x: 1000, y: 350, w: 700, h: 50 },
      { x: 1800, y: 350, w: 600, h: 50 },
      { x: 2500, y: 350, w: 700, h: 50 }
    ];

    // 3. Pipa Hijau (Green Pipes)
    this.pipes = [
      { x: 380, y: 290, w: 50, h: 60 },
      { x: 650, y: 260, w: 50, h: 90 },
      { x: 1250, y: 240, w: 50, h: 110 },
      { x: 1950, y: 270, w: 50, h: 80 }
    ];

    // 4. Blok Bata & Question Blocks (?)
    this.blocks = [
      // Sesi 1
      { x: 220, y: 230, w: 32, h: 32, type: 'question', empty: false },
      { x: 252, y: 230, w: 32, h: 32, type: 'brick' },
      { x: 284, y: 230, w: 32, h: 32, type: 'question', empty: false },
      { x: 316, y: 230, w: 32, h: 32, type: 'brick' },
      { x: 284, y: 140, w: 32, h: 32, type: 'question', empty: false },

      // Sesi 2 (setelah pipa 2)
      { x: 780, y: 230, w: 32, h: 32, type: 'brick' },
      { x: 812, y: 230, w: 32, h: 32, type: 'question', empty: false },
      { x: 844, y: 230, w: 32, h: 32, type: 'brick' },

      // Sesi 3 (bertingkat)
      { x: 1400, y: 230, w: 32, h: 32, type: 'brick' },
      { x: 1432, y: 230, w: 32, h: 32, type: 'question', empty: false },
      { x: 1464, y: 230, w: 32, h: 32, type: 'brick' },
      { x: 1432, y: 130, w: 32, h: 32, type: 'brick' },
      { x: 1464, y: 130, w: 32, h: 32, type: 'question', empty: false }
    ];

    // Buat Tangga Balok Piramida sebelum Tiang Bendera
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row <= col; row++) {
        this.blocks.push({
          x: 2300 + col * 32,
          y: 350 - (row + 1) * 32,
          w: 32,
          h: 32,
          type: 'stone'
        });
      }
    }

    // 5. Tiang Bendera & Kastil
    this.flagpole = { x: 2680, y: 90, w: 8, h: 260 };
    this.castle = { x: 2800, y: 210, w: 140, h: 140 };

    // 6. Musuh: Goomba Patroli (kecepatan diperlambat agar lebih pelan dibanding Mario)
    this.enemies = [
      { x: 320, y: 324, w: 26, h: 26, vx: -0.6, isDead: false, squishTimer: 0 },
      { x: 520, y: 324, w: 26, h: 26, vx: -0.6, isDead: false, squishTimer: 0 },
      { x: 860, y: 324, w: 26, h: 26, vx: 0.6, isDead: false, squishTimer: 0 },
      { x: 1100, y: 324, w: 26, h: 26, vx: -0.6, isDead: false, squishTimer: 0 },
      { x: 1550, y: 324, w: 26, h: 26, vx: -0.6, isDead: false, squishTimer: 0 },
      { x: 2100, y: 324, w: 26, h: 26, vx: -0.6, isDead: false, squishTimer: 0 }
    ];

    this.particles = [];
  }

  // ===========================================================================
  // AABB COLLISION DETECTION
  // ===========================================================================
  checkAABB(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  // Mengumpulkan semua rintangan solid (platform, blok, pipa)
  getSolids() {
    return [...this.platforms, ...this.blocks, ...this.pipes];
  }

  // ===========================================================================
  // GAME UPDATE
  // ===========================================================================
  update() {
    if (this.state !== 'PLAYING') return;

    const m = this.mario;

    // --- 1. Horizontal Movement & Inertia ---
    if (this.keys.left) {
      m.vx = Math.max(m.vx - m.accel, -m.speed);
      m.facing = 'left';
      m.walkFrame += 0.10;
    } else if (this.keys.right) {
      m.vx = Math.min(m.vx + m.accel, m.speed);
      m.facing = 'right';
      m.walkFrame += 0.10;
    } else {
      m.vx *= m.friction;
      if (Math.abs(m.vx) < 0.1) m.vx = 0;
    }

    // Gerak sumbu X & Cek Tabrakan Horisontal
    m.x += m.vx;
    for (const solid of this.getSolids()) {
      if (this.checkAABB(m, solid)) {
        if (m.vx > 0) {
          m.x = solid.x - m.w;
          m.vx = 0;
        } else if (m.vx < 0) {
          m.x = solid.x + solid.w;
          m.vx = 0;
        }
      }
    }

    // Kamera tidak mengizinkan Mario keluar ke kiri layar
    if (m.x < this.cameraX) {
      m.x = this.cameraX;
      m.vx = 0;
    }

    // --- 2. Vertical Movement & Gravity ---
    if (this.keys.jump && m.isGrounded) {
      m.vy = m.jumpForce;
      m.isGrounded = false;
      sfx.playJump();
    }

    // Gravitasi & Terminal Velocity
    m.vy += m.gravity;
    if (m.vy > m.terminalVelocity) {
      m.vy = m.terminalVelocity;
    }

    // Gerak sumbu Y & Cek Tabrakan Vertikal
    m.y += m.vy;
    m.isGrounded = false;

    for (const solid of this.getSolids()) {
      if (this.checkAABB(m, solid)) {
        if (m.vy > 0) {
          // Mendarat di atas platform/blok
          m.y = solid.y - m.h;
          m.vy = 0;
          m.isGrounded = true;
        } else if (m.vy < 0) {
          // Menyundul balok dari bawah
          m.y = solid.y + solid.h;
          m.vy = 0;

          // Periksa apakah Question Block disundul
          if (solid.type === 'question' && !solid.empty) {
            solid.empty = true;
            this.coins++;
            this.score += 200;
            sfx.playCoin();
            // Efek koin melompat ke atas
            this.particles.push({
              x: solid.x + 8,
              y: solid.y - 16,
              vy: -6,
              life: 25
            });
          }
        }
      }
    }

    // Cek Mario Jatuh ke Jurang
    if (m.y > this.height) {
      this.triggerGameOver();
      return;
    }

    // --- 3. Side-Scrolling Camera Tracking ---
    const targetCameraX = m.x - 250;
    if (targetCameraX > this.cameraX) {
      this.cameraX = targetCameraX;
    }
    // Batas kamera di akhir level
    if (this.cameraX > this.levelWidth - this.width) {
      this.cameraX = this.levelWidth - this.width;
    }

    // --- 4. Cek Tiang Bendera Kemenangan ---
    if (this.checkAABB(m, this.flagpole)) {
      this.triggerVictory();
      return;
    }

    // --- 5. Update Musuh (Goomba) ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const g = this.enemies[i];

      if (g.isDead) {
        g.squishTimer++;
        if (g.squishTimer > 20) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Pergerakan otomatis Goomba
      g.x += g.vx;

      // Cek tabrakan Goomba dengan pipa atau blok untuk berbalik arah
      for (const solid of this.getSolids()) {
        if (this.checkAABB(g, solid)) {
          g.vx = -g.vx;
          g.x += Math.sign(g.vx) * 2;
          break;
        }
      }

      // Deteksi Tabrakan Mario vs Goomba
      if (this.checkAABB(m, g)) {
        // Jika kaki Mario mengenai bagian atas Goomba saat jatuh
        const marioBottom = m.y + m.h;
        const goombaTop = g.y + 10;

        if (m.vy > 0 && marioBottom <= goombaTop + 14) {
          // Goomba Kalah
          g.isDead = true;
          m.vy = -7.5; // Mario memantul ke atas
          this.score += 100;
          sfx.playStomp();
        } else {
          // Mario Tertabrak dari samping -> Game Over
          this.triggerGameOver();
          return;
        }
      }
    }

    // --- 6. Update Partikel Koin ---
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.vy;
      p.vy += 0.4;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Sinkronisasi HUD
    document.getElementById('scoreDisplay').innerText = String(this.score).padStart(6, '0');
    document.getElementById('coinsDisplay').innerText = String(this.coins).padStart(2, '0');
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    sfx.playGameOver();
    document.getElementById('statusDisplay').innerText = 'DEAD';
    document.getElementById('statusDisplay').className = 'text-red-500 font-bold';
    document.getElementById('gameOverModal').classList.remove('hidden');
  }

  triggerVictory() {
    this.state = 'VICTORY';
    sfx.playWin();
    this.score += 2000;
    document.getElementById('statusDisplay').innerText = 'CLEAR';
    document.getElementById('statusDisplay').className = 'text-yellow-400 font-bold';
    document.getElementById('finalScoreDisplay').innerText = this.score;
    document.getElementById('victoryModal').classList.remove('hidden');
  }

  // ===========================================================================
  // GAME RENDER (CANVAS)
  // ===========================================================================
  draw() {
    const ctx = this.ctx;

    // 1. Langit Biru Khas Mario (#5C94FC)
    ctx.fillStyle = '#5C94FC';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // 2. Gambar Latar Belakang (Awan & Bukit)
    this.drawBackground(ctx);

    // 3. Gambar Platform Tanah
    ctx.fillStyle = '#C84C0C'; // Cokelat bata tanah
    for (const p of this.platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Garis rumput atas tanah
      ctx.fillStyle = '#00A800';
      ctx.fillRect(p.x, p.y, p.w, 8);
      ctx.fillStyle = '#C84C0C';
    }

    // 4. Gambar Pipa Hijau
    for (const pipe of this.pipes) {
      // Pipa Body
      ctx.fillStyle = '#00A800';
      ctx.fillRect(pipe.x + 4, pipe.y + 16, pipe.w - 8, pipe.h - 16);
      // Pipa Rim (Bibir Atas)
      ctx.fillStyle = '#00A800';
      ctx.fillRect(pipe.x, pipe.y, pipe.w, 16);
      ctx.strokeStyle = '#005000';
      ctx.lineWidth = 3;
      ctx.strokeRect(pipe.x, pipe.y, pipe.w, 16);
      ctx.strokeRect(pipe.x + 4, pipe.y + 16, pipe.w - 8, pipe.h - 16);
      // Highlight kilau pipa
      ctx.fillStyle = '#80D010';
      ctx.fillRect(pipe.x + 6, pipe.y + 2, 6, pipe.h - 4);
    }

    // 5. Gambar Blok (Brick & Question)
    for (const b of this.blocks) {
      if (b.type === 'brick') {
        ctx.fillStyle = '#B84418';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Pola semen
        ctx.fillStyle = '#000';
        ctx.fillRect(b.x, b.y + 14, b.w, 2);
        ctx.fillRect(b.x + 14, b.y, 2, 14);
        ctx.fillRect(b.x + 14, b.y + 16, 2, 16);
      } else if (b.type === 'stone') {
        ctx.fillStyle = '#FCA044';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      } else if (b.type === 'question') {
        if (!b.empty) {
          ctx.fillStyle = '#FCB42C';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#8C4400';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.w, b.h);
          // Teks "?"
          ctx.fillStyle = '#8C4400';
          ctx.font = 'bold 18px monospace';
          ctx.fillText('?', b.x + 10, b.y + 22);
        } else {
          // Blok kosong cokelat
          ctx.fillStyle = '#8C5430';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#482008';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
      }
    }

    // 6. Gambar Tiang Bendera & Kastil
    // Tiang
    ctx.fillStyle = '#00A800';
    ctx.fillRect(this.flagpole.x, this.flagpole.y, this.flagpole.w, this.flagpole.h);
    // Bola emas puncak tiang
    ctx.fillStyle = '#FCE400';
    ctx.beginPath();
    ctx.arc(this.flagpole.x + 4, this.flagpole.y - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    // Bendera Hijau
    ctx.fillStyle = '#00E800';
    ctx.beginPath();
    ctx.moveTo(this.flagpole.x - 24, this.flagpole.y + 8);
    ctx.lineTo(this.flagpole.x, this.flagpole.y + 20);
    ctx.lineTo(this.flagpole.x - 24, this.flagpole.y + 32);
    ctx.closePath();
    ctx.fill();

    // Kastil
    ctx.fillStyle = '#B8B8F8';
    ctx.fillRect(this.castle.x, this.castle.y, this.castle.w, this.castle.h);
    // Pintu Kastil
    ctx.fillStyle = '#000';
    ctx.fillRect(this.castle.x + 50, this.castle.y + 70, 40, 70);

    // 7. Gambar Musuh (Goomba)
    for (const g of this.enemies) {
      if (g.isDead) {
        // Goomba Pipih
        ctx.fillStyle = '#8C4400';
        ctx.fillRect(g.x, g.y + 16, g.w, 10);
      } else {
        // Kepala Jamur Cokelat
        ctx.fillStyle = '#C84C0C';
        ctx.beginPath();
        ctx.arc(g.x + 13, g.y + 10, 12, Math.PI, 0);
        ctx.lineTo(g.x + 24, g.y + 20);
        ctx.lineTo(g.x + 2, g.y + 20);
        ctx.closePath();
        ctx.fill();

        // Wajah & Kaki
        ctx.fillStyle = '#000';
        // Mata
        ctx.fillRect(g.x + 6, g.y + 8, 3, 5);
        ctx.fillRect(g.x + 17, g.y + 8, 3, 5);
        // Kaki
        ctx.fillRect(g.x + 2, g.y + 20, 8, 6);
        ctx.fillRect(g.x + 16, g.y + 20, 8, 6);
      }
    }

    // 8. Gambar Partikel Koin Melompat
    for (const p of this.particles) {
      ctx.fillStyle = '#FCE400';
      ctx.beginPath();
      ctx.ellipse(p.x + 8, p.y + 8, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8C4400';
      ctx.stroke();
    }

    // 9. Gambar Mario
    this.drawMario(ctx, this.mario);

    ctx.restore();
  }

  drawMario(ctx, m) {
    ctx.save();
    ctx.translate(Math.round(m.x), Math.round(m.y));

    if (m.facing === 'left') {
      ctx.translate(m.w, 0);
      ctx.scale(-1, 1);
    }

    // Topi Merah
    ctx.fillStyle = '#D82800';
    ctx.fillRect(6, 2, 14, 6);

    // Wajah & Hidung
    ctx.fillStyle = '#FC9838';
    ctx.fillRect(10, 8, 10, 8);
    // Mata & Kumis
    ctx.fillStyle = '#000';
    ctx.fillRect(16, 9, 2, 3);
    ctx.fillRect(14, 13, 8, 3);

    // Baju Merah
    ctx.fillStyle = '#D82800';
    ctx.fillRect(6, 16, 14, 8);

    // Celana Biru (Overall)
    ctx.fillStyle = '#0058F8';
    ctx.fillRect(8, 20, 10, 8);

    // Sepatu Cokelat
    ctx.fillStyle = '#887000';
    const step = Math.floor(m.walkFrame % 2);
    if (!m.isGrounded) {
      ctx.fillRect(4, 28, 7, 4);
      ctx.fillRect(15, 26, 7, 4);
    } else if (step === 0) {
      ctx.fillRect(6, 28, 6, 4);
      ctx.fillRect(14, 28, 6, 4);
    } else {
      ctx.fillRect(4, 28, 6, 4);
      ctx.fillRect(16, 28, 6, 4);
    }

    ctx.restore();
  }

  drawBackground(ctx) {
    // Awan
    ctx.fillStyle = '#FFFFFF';
    const clouds = [150, 600, 1100, 1700, 2200, 2700];
    for (const cx of clouds) {
      ctx.beginPath();
      ctx.arc(cx, 80, 24, 0, Math.PI * 2);
      ctx.arc(cx + 25, 70, 28, 0, Math.PI * 2);
      ctx.arc(cx + 50, 80, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bukit Hijau
    ctx.fillStyle = '#00A800';
    const hills = [80, 750, 1350, 1950, 2550];
    for (const hx of hills) {
      ctx.beginPath();
      ctx.arc(hx, 350, 65, Math.PI, 0);
      ctx.fill();
    }
  }

  // ===========================================================================
  // GAME LOOP
  // ===========================================================================
  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}

// Inisialisasi saat dokumen HTML selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
  new SuperMarioGame();
});
