<template>
  <div class="ebook-container">
    <div class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <h3>목차</h3>
        <button class="toggle-sidebar" @click="toggleSidebar">
          {{ isSidebarCollapsed ? '▶' : '◀' }}
        </button>
      </div>
      <div class="file-controls">
        <input 
          type="file" 
          ref="fileInput"
          @change="handleFileUpload" 
          accept=".pptx" 
          class="hidden-input"
        />
        <button class="upload-button" @click="$refs.fileInput.click()">
          새 PPT 파일 열기
        </button>
        <button class="list-button" @click="showPresentationList">
          목록 보기
        </button>
      </div>
      <div class="presentation-list">
        <h3>저장된 프레젠테이션</h3>
        <div v-if="presentations.length === 0" class="empty-message">
          저장된 프레젠테이션이 없습니다.
        </div>
        <ul v-else>
          <li v-for="pres in presentations" :key="pres._id" :class="{ active: currentPresentationId === pres._id }">
            <div class="presentation-item" @click="loadPresentation(pres._id)">
              {{ decodeFileName(pres.fileName) }}
              <span class="upload-date">{{ formatDate(pres.uploadDate) }}</span>
            </div>
            <button class="delete-button" @click.stop="deletePresentation(pres._id)">
              삭제
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div class="main-content">
      <div class="ebook-content">
        <div v-if="pages.length === 0" class="upload-message">
          <h2>PPT 파일을 선택하거나 목록에서 선택하세요</h2>
        </div>
        <div v-else>
          <div class="page" v-for="(page, index) in pages" :key="index" :class="{ active: currentPage === index }">
            <div class="page-content">
              <h2>{{ page.title }}</h2>
              <div v-if="page.images && page.images.length > 0" class="image-container">
                <img 
                  v-for="(image, imageIndex) in page.images" 
                  :key="imageIndex"
                  :src="`http://localhost:3000${image}`" 
                  :alt="`${page.title} - 이미지 ${imageIndex + 1}`"
                  class="page-image"
                >
              </div>
              <div v-if="page.content" class="slide-content" v-html="formatContent(page.content)"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="navigation-container" v-if="pages.length > 0">
        <div class="navigation">
          <button @click="prevPage" :disabled="currentPage === 0">이전</button>
          <span>{{ currentPage + 1 }} / {{ pages.length }}</span>
          <button @click="nextPage" :disabled="currentPage === pages.length - 1">다음</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const currentPage = ref(0);
const isSidebarCollapsed = ref(false);
const pages = ref([]);
const fileInput = ref(null);
const presentations = ref([]);
const currentPresentationId = ref(null);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  const fileName = encodeURIComponent(file.name);
  formData.append('file', file, fileName);

  try {
    const response = await axios.post('http://localhost:3000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    pages.value = response.data.slides;
    currentPage.value = 0;
    await loadPresentations();
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    alert('파일 업로드에 실패했습니다.');
  }
};

const clearContent = () => {
  pages.value = [];
  currentPage.value = 0;
};

const formatContent = (content) => {
  // 텍스트에 줄바꿈을 HTML <br> 태그로 변환
  return content.replace(/\n/g, '<br>');
};

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < pages.value.length - 1) {
    currentPage.value++;
  }
};

const goToPage = (index) => {
  currentPage.value = index;
};

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const loadPresentations = async () => {
  try {
    const response = await axios.get('http://localhost:3000/presentations');
    if (Array.isArray(response.data)) {
      presentations.value = response.data;
      console.log('프레젠테이션 목록 로드 성공:', presentations.value);
    } else {
      console.error('Invalid response format:', response.data);
      presentations.value = [];
    }
  } catch (error) {
    console.error('Failed to load presentations:', error);
    presentations.value = [];
  }
};

const loadPresentation = async (id) => {
  try {
    const response = await axios.get(`http://localhost:3000/presentations/${id}`);
    pages.value = response.data.slides;
    currentPage.value = 0;
    currentPresentationId.value = id;
  } catch (error) {
    console.error('Failed to load presentation:', error);
    alert('프레젠테이션 로드에 실패했습니다.');
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const decodeFileName = (fileName) => {
  try {
    return decodeURIComponent(fileName);
  } catch (e) {
    return fileName;
  }
};

const deletePresentation = async (id) => {
  if (!confirm('정말 이 프레젠테이션을 삭제하시겠습니까?')) {
    return;
  }

  try {
    await axios.delete(`http://localhost:3000/presentations/${id}`);
    if (currentPresentationId.value === id) {
      pages.value = [];
      currentPage.value = 0;
      currentPresentationId.value = null;
    }
    await loadPresentations();
  } catch (error) {
    console.error('프레젠테이션 삭제 실패:', error);
    alert('프레젠테이션 삭제에 실패했습니다.');
  }
};

const showPresentationList = () => {
  pages.value = [];
  currentPage.value = 0;
  currentPresentationId.value = null;
  loadPresentations();
};

onMounted(async () => {
  await loadPresentations();
});
</script>

<style scoped>
.ebook-container {
  display: flex;
  height: 100vh;
  width: 100%;
  font-family: 'Noto Sans KR', sans-serif;
  overflow: hidden;
  background-color: #fff;
}

.sidebar {
  width: 300px;
  min-width: 300px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transition: all 0.3s ease;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-collapsed {
  width: 50px;
  min-width: 50px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #fff;
}

.toggle-sidebar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
}

.file-controls {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hidden-input {
  display: none;
}

.upload-button, .clear-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.upload-button {
  background-color: #4CAF50;
  color: white;
}

.upload-button:hover {
  background-color: #45a049;
}

.clear-button {
  background-color: #f44336;
  color: white;
}

.clear-button:hover {
  background-color: #da190b;
}

.upload-message {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.presentation-list {
  flex: 1;
  overflow-y: auto;
}

.presentation-list h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.presentation-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.presentation-list li {
  display: flex;
  align-items: center;
  padding: 0;
  border-bottom: 1px solid #ddd;
}

.presentation-list li:hover {
  background-color: #e0e0e0;
}

.presentation-list li.active {
  background-color: #e3f2fd;
}

.presentation-item {
  flex: 1;
  padding: 10px;
  cursor: pointer;
}

.upload-date {
  font-size: 0.8em;
  color: #666;
  display: block;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ebook-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fff;
}

.page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 70px; /* 네비게이션 높이만큼 공간 확보 */
  opacity: 0;
  transition: opacity 0.5s ease;
  overflow-y: auto;
  padding: 20px;
  display: none;
}

.page.active {
  opacity: 1;
  display: block;
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.page-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slide-content {
  width: 100%;
  text-align: left;
  padding: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 16px;
}

.navigation-container {
  position: fixed;
  bottom: 0;
  left: 300px;
  right: 0;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px 0;
  transition: left 0.3s ease;
  z-index: 100;
  display: flex;
  justify-content: center;
  height: 70px;
}

.sidebar-collapsed ~ .main-content .navigation-container {
  left: 50px;
}

.navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: fit-content;
}

button {
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  min-width: 100px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-2px);
}

.navigation span {
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

h2 {
  margin-bottom: 20px;
  color: #333;
  text-align: center;
  font-size: 24px;
}

p {
  color: #666;
  line-height: 1.6;
  width: 100%;
  text-align: center;
  margin: 0;
}

.delete-button {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 10px;
  min-width: auto;
}

.delete-button:hover {
  background-color: #c82333;
}

.list-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  background-color: #2196F3;
  color: white;
}

.list-button:hover {
  background-color: #1976D2;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #666;
}
</style> 