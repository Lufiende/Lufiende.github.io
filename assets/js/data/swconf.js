if (!sessionStorage.getItem('hasReloaded')) {
  sessionStorage.setItem('hasReloaded', 'true');
  window.location.reload(true); // 强制硬刷新
}
