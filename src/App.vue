<script setup>
import EbookViewer from './components/EbookViewer.vue'
</script>

<template>
  <div class="app">
    <header>
      <h1>전자책 뷰어</h1>
      <nav>
        <router-link to="/">홈</router-link>
        <router-link to="/editor">PPT 에디터</router-link>
      </nav>
    </header>
    <router-view></router-view>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body {
  background-color: #fff;
  font-family: 'Noto Sans KR', sans-serif;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

header {
  background-color: #4CAF50;
  color: white;
  padding: 1rem;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
