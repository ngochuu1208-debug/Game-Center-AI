/**
 * GAME 3: PHÁ GẠCH SIÊU CẤP (BRICK BREAKER)
 * 10 Map - 5 Cấp độ, tường ngang & xoắn ốc luồn lách, gạch nhỏ số lượng lớn,
 * Power-ups: Explosion nổ 3 ô, Double x2, Triple x3, Combo x6 bóng!
 */

const BrickGame = (function() {
  const canvas = document.getElementById('brickCanvas');
  const ctx = canvas.getContext('2d');

  const COLS = 20; // 20 cột gạch nhỏ
  const ROWS = 16;
  const BRICK_W = 36;
  const BRICK_H = 16;
  const OFFSET_X = 40;
  const OFFSET_Y = 50;

  // Thanh đỡ (Paddle)
  let paddle = {
    x: 350,
    y: 540,
    width: 120,
    height: 14,
    speed: 8,
    color: '#4f9cff'
  };

  // Danh sách bóng
  let balls = [];
  // Gạch phá hủy & Tường kiên cố
  let bricks = [];
  let indestructibleWalls = [];
  // Vật phẩm Power-ups rơi
  let powerUps = [];

  let currentMapIdx = 0;
  let lives = 3;
  let timeLeft = 420; // 7 phút = 420s
  let timerInterval = null;
  let animationFrameId = null;
  let isRunning = false;
  let isPaused = false;

  // Trạng thái Power-ups
  let doubleTimeout = null;
  let tripleTimeout = null;
  let doubleRemaining = 0;
  let tripleRemaining = 0;
  let powerupInterval = null;

  // 10 BẢN ĐỒ CHI TIẾT (5 CẤP ĐỘ, MỖI CẤP 2 BẢN ĐỒ)
  // 'W': Tường không thể phá hủy (Indestructible Wall)
  // '1','2','3': Gạch phá hủy với số điểm/màu khác nhau
  const MAP_LEVELS = [
    // CẤP 1 (Bản đồ 1 & 2): Nhập môn tường chắn ngang
    {
      id: 1,
      title: 'Cấp 1-A: Tường Chắn Cơ Bản',
      layout: [
        "....................",
        ".111111111111111111.",
        ".122222222222222221.",
        ".WWWWWW......WWWWWW.", // Tường ngang chắn 2 bên
        ".122333333333332211.",
        ".111111111111111111.",
        "...................."
      ]
    },
    {
      id: 2,
      title: 'Cấp 1-B: Vách Ngang Song Hành',
      layout: [
        ".222222222222222222.",
        ".WWWW....WWWW....WW.",
        ".111111111111111111.",
        ".WW....WWWW....WWWW.",
        ".333333333333333333.",
        "...................."
      ]
    },

    // CẤP 2 (Bản đồ 3 & 4): Lối đi chữ U và đường hầm
    {
      id: 3,
      title: 'Cấp 2-A: Hầm Luồn Chữ U',
      layout: [
        ".WWWWWWWWWWWWWWWWWW.",
        ".W1111111111111111W.",
        ".W1WWWWWWWWWWWWWW1W.",
        ".W1W............W1W.",
        ".W1W.2222222222.W1W.",
        ".W1W.3333333333.W1W.",
        ".W...2222222222...W."
      ]
    },
    {
      id: 4,
      title: 'Cấp 2-B: Mê Cung Tường Bậc Thang',
      layout: [
        ".1111WWWWWWWWWW1111.",
        ".2222....WW....2222.",
        ".WWWWWW..WW..WWWWWW.",
        ".333333..WW..333333.",
        ".22WWWW......WWWW22.",
        ".111111111111111111."
      ]
    },

    // CẤP 3 (Bản đồ 5 & 6): Xoắn ốc sơ cấp (Spiral Maze)
    {
      id: 5,
      title: 'Cấp 3-A: Xoắn Ốc Vòng Ngoài',
      layout: [
        ".WWWWWWWWWWWWWWWWWW.",
        ".W11111111111111111.",
        ".W1WWWWWWWWWWWWWW11.",
        ".W1W............W11.",
        ".W1W.3333333333.W11.",
        ".W1W.2222222222.W11.",
        ".W1WWWWWWWWWW11.W11.",
        ".W11111111111111W11."
      ]
    },
    {
      id: 6,
      title: 'Cấp 3-B: Vỏ Ốc Cuộn Sâu',
      layout: [
        ".WWWWWWWWWWWWWWWWWW.",
        ".11111111111111111W.",
        ".WWWWWWWWWWWWWWW11W.",
        ".W..............W1W.",
        ".W.WWWWWWWWWWWW.W1W.",
        ".W.W1122332211W.W1W.",
        ".W.W1WWWWWWWW1W.W1W.",
        ".W.W1111111111W.W1W."
      ]
    },

    // CẤP 4 (Bản đồ 7 & 8): Tường ngang kép đan xen kẽ hở
    {
      id: 7,
      title: 'Cấp 4-A: Bẫy Tường Kép',
      layout: [
        ".111111111111111111.",
        ".WWWWWWWWWW....WWWW.",
        ".222222222222222222.",
        ".WWWW....WWWWWWWWWW.",
        ".333333333333333333.",
        ".WWWWWWWWWW....WWWW.",
        ".111111111111111111."
      ]
    },
    {
      id: 8,
      title: 'Cấp 4-B: Pháo Đài Gai Nhọn',
      layout: [
        ".WW..WW..WW..WW..WW.",
        ".W1..W2..W3..W2..W1.",
        ".W1WWWWWWWWWWWWWW1W.",
        ".W2222222222222222W.",
        ".WWWWWW......WWWWWW.",
        ".123123123123123123."
      ]
    },

    // CẤP 5 (Bản đồ 9 & 10): Xoắn ốc hoàn chỉnh & Thử thách đỉnh cao
    {
      id: 9,
      title: 'Cấp 5-A: Xoắn Ốc Vĩnh Cửu',
      layout: [
        ".WWWWWWWWWWWWWWWWWW.",
        ".W1111111111111111W.",
        ".W1WWWWWWWWWWWWWW1W.",
        ".W1W............W1W.",
        ".W1W.WWWWWWWWWW.W1W.",
        ".W1W.W33333333W.W1W.",
        ".W1W.W2WWWWWW2W.W1W.",
        ".W1W.W21111112W.W1W.",
        ".W1W.WWWWWWWWW1W.W1W."
      ]
    },
    {
      id: 10,
      title: 'Cấp 5-B: Ma Trận Bất Khả Xâm Phạm',
      layout: [
        ".WWWWWWWWWWWWWWWWWW.",
        ".W3333WW1111WW3333W.",
        ".W3WW3WW1WW1WW3WW3W.",
        ".W...WW......WW...W.",
        ".WWWWWW.3333.WWWWWW.",
        ".W22222.2222.22222W.",
        ".W11111.1111.11111W.",
        ".WWWWWWWWWWWWWWWWWW."
      ]
    }
  ];

  function initMapSelector() {
    const grid = document.getElementById('brickMapGrid');
    grid.innerHTML = '';
    MAP_LEVELS.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.className = `map-btn ${idx === currentMapIdx ? 'selected' : ''}`;
      btn.innerHTML = `<span class="map-num">M-${idx+1}</span><span class="map-tag">${m.title.split(':')[0]}</span>`;
      btn.onclick = () => {
        loadMap(idx);
        closeMapModal();
      };
      grid.appendChild(btn);
    });
  }

  function loadMap(idx) {
    currentMapIdx = idx;
    const map = MAP_LEVELS[idx];
    document.getElementById('brickHudMap').textContent = `${idx + 1} (${map.title})`;

    bricks = [];
    indestructibleWalls = [];
    powerUps = [];
    clearPowerupTimers();

    map.layout.forEach((row, rIdx) => {
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const char = row[cIdx];
        const x = OFFSET_X + cIdx * BRICK_W;
        const y = OFFSET_Y + rIdx * BRICK_H;

        if (char === 'W') {
          // Tường không thể phá hủy
          indestructibleWalls.push({
            x: x, y: y, w: BRICK_W - 2, h: BRICK_H - 2,
            color: '#64748b'
          });
        } else if (char === '1' || char === '2' || char === '3') {
          // Gạch có thể phá hủy
          let color = '#55ff8a';
          if (char === '2') color = '#ff713f';
          if (char === '3') color = '#4f9cff';

          bricks.push({
            r: rIdx,
            c: cIdx,
            x: x, y: y, w: BRICK_W - 2, h: BRICK_H - 2,
            color: color,
            hp: 1
          });
        }
      }
    });

    resetPaddleAndBall();
    timeLeft = 420; // 7 phút
    lives = 3;
    updateHud();
    draw();
  }

  function resetPaddleAndBall() {
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = 540;

    balls = [{
      x: canvas.width / 2,
      y: paddle.y - 12,
      radius: 7,
      vx: 4 * (Math.random() < 0.5 ? 1 : -1),
      vy: -5,
      speed: 6.5
    }];
  }

  function start() {
    if (isRunning && !isPaused) return;
    if (isPaused) {
      isPaused = false;
      document.getElementById('brickPauseBtn').textContent = 'Tạm Dừng';
      loop();
      return;
    }
    loadMap(currentMapIdx);
    isRunning = true;
    isPaused = false;
    hideOverlay();

    // Đồng hồ 7 phút
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isRunning && !isPaused) {
        timeLeft--;
        updateHud();
        if (timeLeft <= 0) {
          gameOver(false, 'Hết thời gian 7 phút!');
        }
      }
    }, 1000);

    loop();
  }

  function stop() {
    isRunning = false;
    isPaused = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    clearPowerupTimers();
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    document.getElementById('brickPauseBtn').textContent = isPaused ? 'Tiếp Tục' : 'Tạm Dừng';
    if (!isPaused) {
      loop();
    }
  }

  function loop() {
    if (!isRunning || isPaused) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  function update() {
    // 1. Cập nhật vị trí bóng
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.x += b.vx;
      b.y += b.vy;

      // Va chạm tường biên trái / phải / trên
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
        sounds.playPaddleHit();
      } else if (b.x + b.radius > canvas.width) {
        b.x = canvas.width - b.radius;
        b.vx = -Math.abs(b.vx);
        sounds.playPaddleHit();
      }
      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
        sounds.playPaddleHit();
      }

      // Va chạm thanh đỡ (Paddle)
      if (
        b.y + b.radius >= paddle.y &&
        b.y - b.radius <= paddle.y + paddle.height &&
        b.x >= paddle.x &&
        b.x <= paddle.x + paddle.width &&
        b.vy > 0
      ) {
        // Đổi hướng bóng dựa trên góc tiếp xúc (8 hướng cơ bản)
        const hitPoint = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const maxAngle = Math.PI / 3; // 60 độ
        const angle = hitPoint * maxAngle;
        const currentSpeed = Math.hypot(b.vx, b.vy);
        b.vx = currentSpeed * Math.sin(angle);
        b.vy = -currentSpeed * Math.cos(angle);
        sounds.playPaddleHit();
      }

      // Va chạm tường không thể phá hủy
      indestructibleWalls.forEach(w => {
        resolveRectCollision(b, w);
      });

      // Va chạm gạch có thể phá hủy
      for (let j = bricks.length - 1; j >= 0; j--) {
        const br = bricks[j];
        if (resolveRectCollision(b, br)) {
          sounds.playBrickHit();
          bricks.splice(j, 1);
          updateHud();

          // Xác suất rớt Power-up (18%)
          if (Math.random() < 0.18) {
            spawnPowerUp(br.x + br.w / 2, br.y + br.h / 2);
          }

          if (bricks.length === 0) {
            checkAllMapsWin();
            return;
          }
        }
      }

      // Bóng rơi khỏi màn hình
      if (b.y - b.radius > canvas.height) {
        balls.splice(i, 1);
      }
    }

    // Nếu mất toàn bộ bóng
    if (balls.length === 0) {
      lives--;
      updateHud();
      sounds.playLose();
      if (lives <= 0) {
        gameOver(false, 'Bạn đã hết 3 mạng!');
        return;
      } else {
        resetPaddleAndBall();
      }
    }

    // 2. Cập nhật Power-ups rơi
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;

      // Thanh đỡ hứng Power-up
      if (
        p.y + p.radius >= paddle.y &&
        p.y - p.radius <= paddle.y + paddle.height &&
        p.x >= paddle.x &&
        p.x <= paddle.x + paddle.width
      ) {
        activatePowerUp(p.type);
        sounds.playPowerup();
        powerUps.splice(i, 1);
      } else if (p.y > canvas.height) {
        powerUps.splice(i, 1);
      }
    }
  }

  function resolveRectCollision(ball, rect) {
    const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq < ball.radius * ball.radius) {
      // Xác định mặt va chạm
      const overlapX = ball.radius - Math.abs(distX);
      const overlapY = ball.radius - Math.abs(distY);

      if (overlapX < overlapY) {
        ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      } else {
        ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
      }
      return true;
    }
    return false;
  }

  function spawnPowerUp(x, y) {
    const types = ['EXPLOSION', 'DOUBLE', 'TRIPLE'];
    const chosen = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
      x: x,
      y: y,
      type: chosen,
      radius: 12,
      speed: 2.2
    });
  }

  function activatePowerUp(type) {
    if (type === 'EXPLOSION') {
      // 1. Nổ tại vị trí bóng: phá hủy toàn bộ gạch trong bán kính 3 ô
      triggerExplosion();
    } else if (type === 'DOUBLE') {
      // 2. Double x2 bóng trong 10 giây
      triggerDouble();
    } else if (type === 'TRIPLE') {
      // 3. Triple x3 bóng trong 10 giây
      triggerTriple();
    }
  }

  function triggerExplosion() {
    document.getElementById('pBadgeExplosion').style.display = 'inline-block';
    setTimeout(() => {
      document.getElementById('pBadgeExplosion').style.display = 'none';
    }, 1500);

    balls.forEach(b => {
      sounds.playExplosion();
      // Phá hủy gạch trong bán kính 3 ô tính từ quả bóng (khoảng 100px)
      const explosionRadius = BRICK_W * 3;
      for (let j = bricks.length - 1; j >= 0; j--) {
        const br = bricks[j];
        const cx = br.x + br.w / 2;
        const cy = br.y + br.h / 2;
        if (Math.hypot(cx - b.x, cy - b.y) <= explosionRadius) {
          bricks.splice(j, 1);
        }
      }
    });

    updateHud();
    if (bricks.length === 0) {
      checkAllMapsWin();
    }
  }

  function triggerDouble() {
    doubleRemaining = 10;
    document.getElementById('pBadgeDouble').style.display = 'inline-block';

    // Nhân đôi bóng hiện tại
    const newBalls = [];
    balls.forEach(b => {
      newBalls.push({
        x: b.x, y: b.y, radius: b.radius,
        vx: -b.vx, vy: b.vy + (Math.random() - 0.5),
        speed: b.speed
      });
    });
    balls = balls.concat(newBalls);

    checkComboBadge();

    if (doubleTimeout) clearInterval(doubleTimeout);
    doubleTimeout = setInterval(() => {
      doubleRemaining--;
      document.getElementById('pTimeDouble').textContent = doubleRemaining + 's';
      if (doubleRemaining <= 0) {
        clearInterval(doubleTimeout);
        doubleTimeout = null;
        document.getElementById('pBadgeDouble').style.display = 'none';
        checkComboBadge();
      }
    }, 1000);
  }

  function triggerTriple() {
    tripleRemaining = 10;
    document.getElementById('pBadgeTriple').style.display = 'inline-block';

    // Nhân ba bóng hiện tại
    const newBalls = [];
    balls.forEach(b => {
      newBalls.push(
        { x: b.x, y: b.y, radius: b.radius, vx: b.vx * 0.8 + 2, vy: -Math.abs(b.vy), speed: b.speed },
        { x: b.x, y: b.y, radius: b.radius, vx: b.vx * 0.8 - 2, vy: -Math.abs(b.vy), speed: b.speed }
      );
    });
    balls = balls.concat(newBalls);

    checkComboBadge();

    if (tripleTimeout) clearInterval(tripleTimeout);
    tripleTimeout = setInterval(() => {
      tripleRemaining--;
      document.getElementById('pTimeTriple').textContent = tripleRemaining + 's';
      if (tripleRemaining <= 0) {
        clearInterval(tripleTimeout);
        tripleTimeout = null;
        document.getElementById('pBadgeTriple').style.display = 'none';
        checkComboBadge();
      }
    }, 1000);
  }

  function checkComboBadge() {
    const isCombo = doubleRemaining > 0 && tripleRemaining > 0;
    document.getElementById('pBadgeCombo').style.display = isCombo ? 'inline-block' : 'none';
  }

  function clearPowerupTimers() {
    if (doubleTimeout) clearInterval(doubleTimeout);
    if (tripleTimeout) clearInterval(tripleTimeout);
    doubleTimeout = null;
    tripleTimeout = null;
    doubleRemaining = 0;
    tripleRemaining = 0;
    document.getElementById('pBadgeExplosion').style.display = 'none';
    document.getElementById('pBadgeDouble').style.display = 'none';
    document.getElementById('pBadgeTriple').style.display = 'none';
    document.getElementById('pBadgeCombo').style.display = 'none';
  }

  function checkAllMapsWin() {
    stop();
    sounds.playWin();
    if (currentMapIdx < MAP_LEVELS.length - 1) {
      showOverlay('HOÀN THÀNH BẢN ĐỒ!', `Bạn đã vượt qua ${MAP_LEVELS[currentMapIdx].title}. Chuyển sang bản đồ kế tiếp!`, 'Bản Đồ Kế Tiếp');
      currentMapIdx++;
    } else {
      // Hoàn thành cả 10 bản đồ -> THẮNG TOÀN BỘ GAME
      showOverlay('CHIẾN THẮNG TUYỆT ĐỐI!', 'Chúc mừng bạn đã chiến thắng trò chơi!', 'Chơi Lại Toàn Bộ');
      currentMapIdx = 0;
    }
  }

  function gameOver(isWin, reason) {
    stop();
    if (isWin) {
      sounds.playWin();
      showOverlay('CHIẾN THẮNG!', 'Chúc mừng bạn đã chiến thắng trò chơi!', 'Chơi Tiếp');
    } else {
      sounds.playLose();
      showOverlay('THẤT BẠI', `${reason || 'Bạn đã thua!'} Hãy thử lại bản đồ này.`, 'Thử Lại');
    }
  }

  function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ tường không thể phá hủy (Tường đá Neon xám xanh)
    ctx.shadowBlur = 0;
    indestructibleWalls.forEach(w => {
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // Vẽ gạch có thể phá hủy
    bricks.forEach(b => {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // Vẽ Power-ups rơi với biểu tượng đẹp mắt
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'EXPLOSION') {
        ctx.shadowColor = '#ff4e65';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff4e65';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', 0, 0);
      } else if (p.type === 'DOUBLE') {
        ctx.shadowColor = '#4f9cff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#4f9cff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2X', 0, 0);
      } else if (p.type === 'TRIPLE') {
        ctx.shadowColor = '#ff713f';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff713f';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('3X', 0, 0);
      }
      ctx.restore();
    });

    // Vẽ Thanh đỡ (Paddle)
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = paddle.color;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();

    // Vẽ Bóng
    balls.forEach(b => {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }

  function updateHud() {
    let hearts = '';
    for (let i = 0; i < lives; i++) hearts += '❤️';
    document.getElementById('brickHudLives').textContent = hearts || '💀 0';

    const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const sec = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('brickHudTimer').textContent = `${min}:${sec}`;
    document.getElementById('brickHudRemaining').textContent = bricks.length;
  }

  function showOverlay(title, msg, btnText) {
    document.getElementById('brickOverlayTitle').textContent = title;
    document.getElementById('brickOverlayMsg').textContent = msg;
    document.getElementById('brickStartBtn').textContent = btnText;
    document.getElementById('brickOverlay').style.display = 'flex';
  }

  function hideOverlay() {
    document.getElementById('brickOverlay').style.display = 'none';
  }

  // Mouse & Touch Controls
  function movePaddleTo(clientX) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, canvasX - paddle.width / 2));
  }

  canvas.addEventListener('mousemove', (e) => {
    movePaddleTo(e.clientX);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      movePaddleTo(e.touches[0].clientX);
    }
  }, {passive: false});

  return {
    init: function() {
      initMapSelector();
      loadMap(0);
    },
    start: start,
    restart: start,
    togglePause: togglePause,
    openMapSelect: () => document.getElementById('brickMapModal').classList.add('active'),
    closeMapModal: () => document.getElementById('brickMapModal').classList.remove('active'),
    stop: stop
  };
})();

function brickStartGame() { BrickGame.start(); }
function brickRestartCurrentMap() { BrickGame.restart(); }
function brickTogglePause() { BrickGame.togglePause(); }
function brickOpenMapModal() { BrickGame.openMapSelect(); }
function brickCloseMapModal() { BrickGame.closeMapModal(); }
