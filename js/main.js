/**
 * MAIN CONTROLLER & ROUTER
 * Điều hướng giữa Trang chủ và các Trò chơi, dọn dẹp game loop khi chuyển đổi
 */

function switchView(viewId) {
  // Dừng mọi game loop đang chạy khi chuyển trang
  SnakeGame.stop();
  FruitGame.stop();
  BrickGame.stop();

  // Ẩn toàn bộ view
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  if (viewId === 'home') {
    document.getElementById('homeView').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewId === 'snake') {
    document.getElementById('gameSnakeView').classList.add('active');
  } else if (viewId === 'fruit') {
    document.getElementById('gameFruitView').classList.add('active');
  } else if (viewId === 'brick') {
    document.getElementById('gameBrickView').classList.add('active');
  }
}

function openGame(gameKey) {
  switchView(gameKey);
  if (gameKey === 'snake') {
    SnakeGame.init();
  } else if (gameKey === 'fruit') {
    FruitGame.init();
  } else if (gameKey === 'brick') {
    BrickGame.init();
  }
}

// Bật / Tắt âm thanh toàn hệ thống
document.getElementById('audioToggleBtn').addEventListener('click', () => {
  const isMuted = sounds.toggleMute();
  document.getElementById('audioIcon').textContent = isMuted ? '🔇' : '🔊';
});

// Khởi chạy hệ thống khi nạp trang
window.addEventListener('DOMContentLoaded', () => {
  SnakeGame.init();
  FruitGame.init();
  BrickGame.init();
});
