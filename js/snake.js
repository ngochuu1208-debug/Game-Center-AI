/**
 * GAME 1: RẮN SĂN MỒI (SNAKE)
 * 10 Bản đồ với màu sắc Neon riêng biệt, bộ đệm phím chống tự sát, 100 điểm Win!
 */

const SnakeGame = (function() {
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');

  const GRID_SIZE = 20; // 30x30 ô (600x600)
  const COLS = 30;
  const ROWS = 30;

  // 10 BẢN ĐỒ VỚI SẮC MÀU NEON RIÊNG BIỆT
  const MAPS = [
    {
      id: 1,
      name: 'Vườn Cơ Bản',
      wallColor: '#55ff8a', // Neon Green
      walls: [] // Chỉ có tường bao quanh
    },
    {
      id: 2,
      name: 'Tứ Trụ Neon',
      wallColor: '#4f9cff', // Neon Blue
      walls: [
        {x: 7, y: 7, w: 4, h: 4}, {x: 19, y: 7, w: 4, h: 4},
        {x: 7, y: 19, w: 4, h: 4}, {x: 19, y: 19, w: 4, h: 4}
      ]
    },
    {
      id: 3,
      name: 'Cổng Vòm Cam',
      wallColor: '#ff713f', // Neon Orange
      walls: [
        {x: 14, y: 4, w: 2, h: 8}, {x: 14, y: 18, w: 2, h: 8},
        {x: 5, y: 14, w: 8, h: 2}, {x: 17, y: 14, w: 8, h: 2}
      ]
    },
    {
      id: 4,
      name: 'Hành Lang Đỏ',
      wallColor: '#ff4e65', // Neon Red
      walls: [
        {x: 8, y: 5, w: 14, h: 2},
        {x: 8, y: 23, w: 14, h: 2},
        {x: 14, y: 10, w: 2, h: 10}
      ]
    },
    {
      id: 5,
      name: 'Mê Cung Tím',
      wallColor: '#bc55ff', // Neon Purple
      walls: [
        {x: 5, y: 5, w: 2, h: 14}, {x: 5, y: 5, w: 14, h: 2},
        {x: 23, y: 11, w: 2, h: 14}, {x: 11, y: 23, w: 14, h: 2}
      ]
    },
    {
      id: 6,
      name: 'Dải Thiên Hà',
      wallColor: '#ffdf40', // Neon Yellow
      walls: [
        {x: 8, y: 8, w: 6, h: 2}, {x: 16, y: 8, w: 6, h: 2},
        {x: 8, y: 20, w: 6, h: 2}, {x: 16, y: 20, w: 6, h: 2},
        {x: 14, y: 12, w: 2, h: 6}
      ]
    },
    {
      id: 7,
      name: 'Chữ Thập Xanh',
      wallColor: '#00f0ff', // Neon Cyan
      walls: [
        {x: 6, y: 10, w: 18, h: 2}, {x: 6, y: 18, w: 18, h: 2},
        {x: 14, y: 6, w: 2, h: 6}, {x: 14, y: 18, w: 2, h: 6}
      ]
    },
    {
      id: 8,
      name: 'Lưới Nhện Hồng',
      wallColor: '#ff55c4', // Neon Pink
      walls: [
        {x: 6, y: 6, w: 6, h: 2}, {x: 18, y: 6, w: 6, h: 2},
        {x: 6, y: 22, w: 6, h: 2}, {x: 18, y: 22, w: 6, h: 2},
        {x: 10, y: 12, w: 10, h: 2}, {x: 10, y: 16, w: 10, h: 2}
      ]
    },
    {
      id: 9,
      name: 'Pháo Đài Băng',
      wallColor: '#70e000', // Lime Neon
      walls: [
        {x: 8, y: 8, w: 14, h: 2}, {x: 8, y: 20, w: 14, h: 2},
        {x: 8, y: 8, w: 2, h: 14}, {x: 20, y: 8, w: 2, h: 14}
      ]
    },
    {
      id: 10,
      name: 'Vực Thẳm Vô Cực',
      wallColor: '#ff0055', // Crimson Neon
      walls: [
        {x: 5, y: 5, w: 20, h: 2}, {x: 5, y: 23, w: 20, h: 2},
        {x: 5, y: 9, w: 2, h: 12}, {x: 23, y: 9, w: 2, h: 12},
        {x: 11, y: 11, w: 8, h: 8}
      ]
    }
  ];

  let currentMapIndex = 0;
  let snake = [];
  let dir = {x: 1, y: 0};
  let nextDirs = []; // Buffer lệnh điều khiển liên tiếp
  let food = {x: 15, y: 15};
  let score = 0;
  let gameInterval = null;
  let isRunning = false;
  let isGameOver = false;

  function initMapSelector() {
    const grid = document.getElementById('snakeMapGrid');
    grid.innerHTML = '';
    MAPS.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.className = `map-btn ${idx === currentMapIndex ? 'selected' : ''}`;
      btn.innerHTML = `<span class="map-num" style="color: ${m.wallColor}">M-${idx+1}</span><span class="map-tag">${m.name}</span>`;
      btn.onclick = () => {
        selectMap(idx);
        closeMapModal();
      };
      grid.appendChild(btn);
    });
  }

  function selectMap(idx) {
    currentMapIndex = idx;
    document.getElementById('snakeHudMap').textContent = `${idx + 1} (${MAPS[idx].name})`;
    document.getElementById('snakeHudMap').style.color = MAPS[idx].wallColor;
    resetGame();
  }

  function resetGame() {
    stopLoop();
    snake = [
      {x: 4, y: 3},
      {x: 3, y: 3},
      {x: 2, y: 3}
    ];
    dir = {x: 1, y: 0};
    nextDirs = [];
    score = 0;
    isRunning = false;
    isGameOver = false;
    updateHud();
    spawnFood();
    draw();
  }

  function start() {
    if (isRunning) return;
    resetGame();
    isRunning = true;
    hideOverlay();
    gameInterval = setInterval(update, 110);
  }

  function stopLoop() {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    isRunning = false;
  }

  function spawnFood() {
    const curMap = MAPS[currentMapIndex];
    let valid = false;
    while (!valid) {
      food.x = Math.floor(Math.random() * (COLS - 2)) + 1;
      food.y = Math.floor(Math.random() * (ROWS - 2)) + 1;

      // Không trùng thân rắn
      const onSnake = snake.some(s => s.x === food.x && s.y === food.y);
      // Không trùng tường bên trong
      const onWall = isWallCell(food.x, food.y, curMap);
      if (!onSnake && !onWall) {
        valid = true;
      }
    }
  }

  function isWallCell(x, y, map) {
    // Tường bao
    if (x <= 0 || x >= COLS - 1 || y <= 0 || y >= ROWS - 1) return true;
    // Tường chướng ngại vật
    for (const w of map.walls) {
      if (x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h) {
        return true;
      }
    }
    return false;
  }

  function handleInput(newDir) {
    // Ngăn quay đầu 180 độ
    const lastDir = nextDirs.length > 0 ? nextDirs[nextDirs.length - 1] : dir;
    if (newDir.x === -lastDir.x && newDir.y === -lastDir.y) return;
    if (newDir.x === lastDir.x && newDir.y === lastDir.y) return;
    if (nextDirs.length < 3) {
      nextDirs.push(newDir);
    }
  }

  function update() {
    if (!isRunning) return;

    if (nextDirs.length > 0) {
      dir = nextDirs.shift();
    }

    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    const curMap = MAPS[currentMapIndex];

    // Va chạm tường
    if (isWallCell(head.x, head.y, curMap)) {
      gameOver(false);
      return;
    }

    // Va chạm thân rắn (chỉ tính thân)
    for (let i = 0; i < snake.length - 1; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        gameOver(false);
        return;
      }
    }

    snake.unshift(head);

    // Ăn thức ăn
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      sounds.playSnakeEat();
      updateHud();
      if (score >= 100) {
        gameOver(true);
        return;
      }
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const curMap = MAPS[currentMapIndex];

    // Vẽ lưới tọa độ mờ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * GRID_SIZE);
      ctx.lineTo(canvas.width, j * GRID_SIZE);
      ctx.stroke();
    }

    // Vẽ tường bao quanh với hiệu ứng Neon đổi màu theo Map
    ctx.strokeStyle = curMap.wallColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = curMap.wallColor;
    ctx.shadowBlur = 12;
    ctx.strokeRect(GRID_SIZE - 2, GRID_SIZE - 2, (COLS - 2) * GRID_SIZE + 4, (ROWS - 2) * GRID_SIZE + 4);

    // Vẽ chướng ngại vật tường bên trong
    ctx.fillStyle = curMap.wallColor;
    curMap.walls.forEach(w => {
      ctx.fillRect(w.x * GRID_SIZE + 1, w.y * GRID_SIZE + 1, w.w * GRID_SIZE - 2, w.h * GRID_SIZE - 2);
    });

    // Vẽ thức ăn Táo Neon
    ctx.shadowColor = '#ff4e65';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff4e65';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ Rắn
    snake.forEach((seg, idx) => {
      if (idx === 0) {
        // Đầu rắn
        ctx.shadowColor = '#55ff8a';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#55ff8a';
      } else {
        // Thân rắn
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2db858';
      }
      ctx.fillRect(seg.x * GRID_SIZE + 2, seg.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  function gameOver(isWin) {
    stopLoop();
    isGameOver = true;
    if (isWin) {
      sounds.playWin();
      showOverlay('THẮNG CUỘC!', 'Chúc mừng bạn đã chiến thắng trò chơi!', 'Chơi Tiếp');
    } else {
      sounds.playLose();
      showOverlay('GAME OVER', `Bạn đã va chạm! Điểm đạt được: ${score}/100.`, 'Chơi Lại');
    }
  }

  function updateHud() {
    document.getElementById('snakeHudScore').textContent = score;
  }

  function showOverlay(title, msg, btnText) {
    document.getElementById('snakeOverlayTitle').textContent = title;
    document.getElementById('snakeOverlayMsg').textContent = msg;
    document.getElementById('snakeStartBtn').textContent = btnText;
    document.getElementById('snakeOverlay').style.display = 'flex';
  }

  function hideOverlay() {
    document.getElementById('snakeOverlay').style.display = 'none';
  }

  function openMapModal() {
    document.getElementById('snakeMapModal').classList.add('active');
  }

  function closeMapModal() {
    document.getElementById('snakeMapModal').classList.remove('active');
  }

  // Keyboard Handler
  window.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    if (e.key === 'ArrowUp') { handleInput({x: 0, y: -1}); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { handleInput({x: 0, y: 1}); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { handleInput({x: -1, y: 0}); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { handleInput({x: 1, y: 0}); e.preventDefault(); }
  });

  // Mobile D-Pad Buttons
  document.querySelectorAll('#snakeDpad .dbtn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const dirName = btn.getAttribute('data-dir');
      if (dirName === 'UP') handleInput({x: 0, y: -1});
      if (dirName === 'DOWN') handleInput({x: 0, y: 1});
      if (dirName === 'LEFT') handleInput({x: -1, y: 0});
      if (dirName === 'RIGHT') handleInput({x: 1, y: 0});
    }, {passive: false});

    btn.addEventListener('click', () => {
      const dirName = btn.getAttribute('data-dir');
      if (dirName === 'UP') handleInput({x: 0, y: -1});
      if (dirName === 'DOWN') handleInput({x: 0, y: 1});
      if (dirName === 'LEFT') handleInput({x: -1, y: 0});
      if (dirName === 'RIGHT') handleInput({x: 1, y: 0});
    });
  });

  return {
    init: function() {
      initMapSelector();
      resetGame();
    },
    start: start,
    restart: resetGame,
    openMapSelect: openMapModal,
    closeMapModal: closeMapModal,
    stop: stopLoop
  };
})();

function snakeStartGame() { SnakeGame.start(); }
function snakeRestart() { SnakeGame.restart(); }
function snakeOpenMapSelect() { SnakeGame.openMapSelect(); }
function snakeCloseMapModal() { SnakeGame.closeMapModal(); }
