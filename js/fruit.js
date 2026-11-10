/**
 * GAME 2: CHÉM HOA QUẢ (FRUIT SLIDE)
 * Thao tác vuốt/kéo mượt mà trên PC và Mobile, không có map select, bom xuất hiện an toàn!
 */

const FruitGame = (function() {
  const canvas = document.getElementById('fruitCanvas');
  const ctx = canvas.getContext('2d');

  let animationFrameId = null;
  let isRunning = false;
  let score = 0;
  let lives = 3;

  let items = []; // Trái cây & Bom
  let bladePoints = []; // Điểm vệt kiếm
  let particles = []; // Hạt vụn neon khi chém
  let isPointerDown = false;
  let spawnTimer = 0;

  const FRUIT_TYPES = [
    { name: 'Watermelon', color: '#55ff8a', radius: 36, label: '🍉' },
    { name: 'Orange', color: '#ff713f', radius: 30, label: '🍊' },
    { name: 'Apple', color: '#ff4e65', radius: 28, label: '🍎' },
    { name: 'Banana', color: '#ffdf40', radius: 32, label: '🍌' },
    { name: 'Grape', color: '#bc55ff', radius: 26, label: '🍇' }
  ];

  function start() {
    stop();
    score = 0;
    lives = 3;
    items = [];
    bladePoints = [];
    particles = [];
    isRunning = true;
    updateHud();
    hideOverlay();
    loop();
  }

  function stop() {
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function spawnWave() {
    const count = Math.random() < 0.6 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      // Bom chỉ xuất hiện khi đạt từ 25 điểm và xác suất vừa phải
      const canSpawnBomb = score >= 25 && Math.random() < 0.28;
      
      const isBomb = canSpawnBomb;
      const type = isBomb ? null : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

      const x = 120 + Math.random() * (canvas.width - 240);
      const y = canvas.height + 40;
      const vx = (canvas.width / 2 - x) * 0.008 + (Math.random() - 0.5) * 2;
      const vy = -(11 + Math.random() * 4.5); // Bay lên cao vừa tầm

      items.push({
        isBomb: isBomb,
        type: type,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: isBomb ? 26 : type.radius,
        color: isBomb ? '#ff0033' : type.color,
        label: isBomb ? '💣' : type.label,
        sliced: false,
        angle: 0,
        vRot: (Math.random() - 0.5) * 0.1
      });
    }
  }

  function loop() {
    if (!isRunning) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  function update() {
    // Spawn định kỳ
    spawnTimer++;
    if (spawnTimer > 75) {
      spawnWave();
      spawnTimer = 0;
    }

    // Cập nhật Items
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x += it.vx;
      it.y += it.vy;
      it.vy += 0.22; // Trọng lực nhẹ rơi tự nhiên
      it.angle += it.vRot;

      // Kiểm tra rơi khỏi đáy màn hình
      if (it.y > canvas.height + 70 && it.vy > 0) {
        if (!it.isBomb && !it.sliced) {
          // Bỏ lỡ hoa quả -> trừ 1 mạng
          lives--;
          updateHud();
          sounds.playLose();
          if (lives <= 0) {
            gameOver(false);
            return;
          }
        }
        items.splice(i, 1);
      }
    }

    // Cập nhật Hạt nổ / Vụn
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.03;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Cập nhật Vệt Kiếm (Fade out)
    if (bladePoints.length > 0) {
      bladePoints.forEach(p => p.life -= 0.08);
      bladePoints = bladePoints.filter(p => p.life > 0);
    }
  }

  function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ các Items (Trái cây / Bom)
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.angle);

      if (it.isBomb) {
        ctx.shadowColor = '#ff4e65';
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 12;
      }

      ctx.font = `${it.radius * 1.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.label, 0, 0);

      ctx.restore();
    });

    // Vẽ Hạt vụn
    particles.forEach(p => {
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Vẽ Vệt Kiếm Neon
    if (bladePoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#4f9cff';
      ctx.shadowBlur = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < bladePoints.length; i++) {
        const p1 = bladePoints[i - 1];
        const p2 = bladePoints[i];
        ctx.lineWidth = p2.life * 9;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function checkSlice(x1, y1, x2, y2) {
    items.forEach(it => {
      if (it.sliced) return;
      // Khoảng cách từ tâm vật thể tới đoạn thẳng chém
      const dist = distToSegment({x: it.x, y: it.y}, {x: x1, y: y1}, {x: x2, y: y2});
      if (dist < it.radius) {
        it.sliced = true;
        createSplash(it.x, it.y, it.color);

        if (it.isBomb) {
          sounds.playExplosion();
          lives--;
          updateHud();
          if (lives <= 0) {
            gameOver(false);
          }
        } else {
          sounds.playSlash();
          score++;
          updateHud();
          if (score >= 100) {
            gameOver(true);
          }
        }
      }
    });
  }

  function createSplash(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: color,
        life: 1.0
      });
    }
  }

  function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  function gameOver(isWin) {
    stop();
    if (isWin) {
      sounds.playWin();
      showOverlay('THẮNG CUỘC!', 'Chúc mừng bạn đã chiến thắng trò chơi!', 'Chơi Tiếp');
    } else {
      sounds.playLose();
      showOverlay('GAME OVER', `Bạn đã hết mạng! Điểm số đạt được: ${score}/100.`, 'Chơi Lại');
    }
  }

  function updateHud() {
    document.getElementById('fruitHudScore').textContent = score;
    let hearts = '';
    for (let i = 0; i < lives; i++) hearts += '❤️';
    document.getElementById('fruitHudLives').textContent = hearts || '💀 Hết Mạng';
  }

  function showOverlay(title, msg, btnText) {
    document.getElementById('fruitOverlayTitle').textContent = title;
    document.getElementById('fruitOverlayMsg').textContent = msg;
    document.getElementById('fruitStartBtn').textContent = btnText;
    document.getElementById('fruitOverlay').style.display = 'flex';
  }

  function hideOverlay() {
    document.getElementById('fruitOverlay').style.display = 'none';
  }

  // Pointer & Touch Events
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    const pos = getPos(e);
    bladePoints = [{x: pos.x, y: pos.y, life: 1.0}];
  });

  window.addEventListener('mouseup', () => {
    isPointerDown = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isPointerDown || !isRunning) return;
    const pos = getPos(e);
    if (bladePoints.length > 0) {
      const last = bladePoints[bladePoints.length - 1];
      checkSlice(last.x, last.y, pos.x, pos.y);
    }
    bladePoints.push({x: pos.x, y: pos.y, life: 1.0});
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isPointerDown = true;
    const pos = getPos(e);
    bladePoints = [{x: pos.x, y: pos.y, life: 1.0}];
  }, {passive: false});

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isPointerDown || !isRunning) return;
    const pos = getPos(e);
    if (bladePoints.length > 0) {
      const last = bladePoints[bladePoints.length - 1];
      checkSlice(last.x, last.y, pos.x, pos.y);
    }
    bladePoints.push({x: pos.x, y: pos.y, life: 1.0});
  }, {passive: false});

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isPointerDown = false;
  }, {passive: false});

  return {
    init: function() {
      score = 0;
      lives = 3;
      updateHud();
      draw();
    },
    start: start,
    restart: start,
    stop: stop
  };
})();

function fruitStartGame() { FruitGame.start(); }
function fruitRestart() { FruitGame.restart(); }
