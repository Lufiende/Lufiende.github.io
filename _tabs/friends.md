---
icon: fas fa-stream
order: 6
---

等待更新......

<div class="friends-container">
  <div class="friend-link">
    <a href="https://aniale.top/" target="_blank">
      <div class="avatar">
        <img src="https://aniale.top/img/avatar.jpg" alt="待添加">
      </div>
      <div class="info">
        <div class="name">Aniale</div>
        <div class="description">Web✌</div>
      </div>
    </a>
  </div>
  
  <div class="friend-link">
    <a href="https://example.com" target="_blank">
      <div class="avatar">
        <img src="https://example.com/avatar.jpg" alt="待添加">
      </div>
      <div class="info">
        <div class="name">待添加</div>
        <div class="description">待添加</div>
      </div>
    </a>
  </div>

  <div class="friend-link">
    <a href="https://example.com" target="_blank">
      <div class="avatar">
        <img src="https://example.com/avatar.jpg" alt="待添加">
      </div>
      <div class="info">
        <div class="name">待添加</div>
        <div class="description">待添加</div>
      </div>
    </a>
  </div>

  <div class="friend-link">
    <a href="https://example.com" target="_blank">
      <div class="avatar">
        <img src="https://example.com/avatar.jpg" alt="待添加">
      </div>
      <div class="info">
        <div class="name">待添加</div>
        <div class="description">待添加</div>
      </div>
    </a>
  </div>
  
  <!-- 添加更多友链 -->
</div>

<style>
.friends-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px; /* 调整友链之间的空隙 */
  /* justify-content: center; */
}

.friend-link {
  display: flex;
  align-items: center;
  background: rgba(57, 197, 188, 0.38);
  border-radius: 10px;
  padding: 10px;
  transition: background 0.3s;
  width: 100%; /* 设为100%以自适应容器宽度 */
  max-width: 200px; /* 设置合理的最大宽度 */
  height: 100%; /* 设为100%以自适应容器宽度 */
  max-height: 60px; /* 设置合理的最大宽度 */
  overflow: hidden;
}
.friend-link:hover {
  background: rgba(57, 197, 188, 0.57);
}
.avatar {
  border: 2px solid #fff;
  border-radius: 50%;
  overflow: hidden;
  width: 40px;
  height: 40px;
  margin-right: 10px; /* 头像向右移动，靠近文字 */
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info .name {
  font-weight: bold;
  color: #fff;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info .description {
  font-size: 0.8em;
  color: #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>


