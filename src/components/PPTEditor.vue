<template>
  <div class="ppt-editor">
    <!-- 상단 메뉴바 -->
    <div class="menu-bar">
      <div class="menu-left">
        <h1>PPT 에디터</h1>
      </div>
      <div class="menu-right">
        <button @click="showPresentationList" class="menu-btn info">
          <i class="fas fa-folder-open"></i> 불러오기
        </button>
        <button @click="addNewSlide" class="menu-btn">
          <i class="fas fa-plus"></i> 새 슬라이드
        </button>
        <button @click="savePPT" class="menu-btn primary">
          <i class="fas fa-save"></i> 저장
        </button>
        <button @click="exportToPDF" class="menu-btn secondary" :disabled="!presentationId">
          <i class="fas fa-file-download"></i> PPT 저장
        </button>
      </div>
    </div>

    <!-- 메인 컨텐츠 영역 -->
    <div class="main-content">
      <!-- 왼쪽 슬라이드 목록 -->
      <div class="slide-list">
        <div 
          v-for="(slide, index) in slides" 
          :key="index"
          class="slide-item"
          :class="{ active: currentSlideIndex === index }"
          @click="selectSlide(index)"
        >
          <div class="slide-header">
            <span class="slide-number">슬라이드 {{ index + 1 }}</span>
            <button @click.stop="deleteSlide(index)" class="delete-btn" :title="'슬라이드 ' + (index + 1) + ' 삭제'">
              삭제
            </button>
          </div>
          <div class="slide-preview">
            <img v-if="slide.image" :src="getImageUrl(slide.image)" :alt="'슬라이드 ' + (index + 1)">
            <div v-else class="no-image">
              <i class="fas fa-image"></i>
              <span>이미지 없음</span>
            </div>
          </div>
          <div class="slide-text">{{ slide.text || '텍스트 없음' }}</div>
        </div>
        
        <!-- 슬라이드가 없을 때 표시할 메시지 -->
        <div v-if="slides.length === 0" class="empty-slides">
          <i class="fas fa-file-powerpoint"></i>
          <p>슬라이드가 없습니다</p>
          <p>새 슬라이드를 추가해주세요</p>
        </div>
      </div>

      <!-- 오른쪽 편집 영역 -->
      <div class="edit-area" v-if="currentSlide">
        <div class="edit-header">
          <h2>슬라이드 {{ currentSlideIndex + 1 }} 편집</h2>
        </div>
        
        <div class="edit-content">
          <!-- 이미지 섹션 -->
          <div class="edit-section">
            <h3>이미지</h3>
            <div class="image-preview">
              <img v-if="currentSlide.image" :src="getImageUrl(currentSlide.image)" :alt="'슬라이드 ' + (currentSlideIndex + 1)">
              <div v-else class="no-image">
                <i class="fas fa-image"></i>
                <span>이미지 없음</span>
              </div>
            </div>
            <button @click="changeImage(currentSlideIndex)" class="edit-btn">
              <i class="fas fa-image"></i> 이미지 변경
            </button>
          </div>

          <!-- 텍스트 섹션 -->
          <div class="edit-section">
            <h3>텍스트</h3>
            <textarea 
              v-model="currentSlide.text" 
              class="text-editor"
              placeholder="슬라이드 텍스트를 입력하세요"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- 프레젠테이션 목록 모달 -->
    <div v-if="showPresentationModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>프레젠테이션 목록</h3>
          <button @click="closePresentationList" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="presentations.length === 0" class="empty-message">
            저장된 프레젠테이션이 없습니다.
          </div>
          <div v-else class="presentation-list">
            <div 
              v-for="pres in presentations" 
              :key="pres._id"
              class="presentation-item"
              @click="loadPresentation(pres._id)"
            >
              <div class="presentation-info">
                <span class="presentation-name">{{ pres.fileName }}</span>
                <span class="presentation-date">{{ formatDate(pres.uploadDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이미지 선택 모달 -->
    <ImageSelector
      v-if="showImageSelector"
      :show="showImageSelector"
      :availableImages="availableImages"
      @close="closeImageSelector"
      @select="handleImageSelect"
    />
  </div>
</template>

<script>
import ImageSelector from './ImageSelector.vue'

export default {
  name: 'PPTEditor',
  components: {
    ImageSelector
  },
  data() {
    return {
      slides: [],
      currentSlideIndex: 0,
      showImageSelector: false,
      selectedSlideIndex: null,
      availableImages: [],
      presentationId: null,
      showPresentationModal: false,
      presentations: []
    }
  },
  computed: {
    currentSlide() {
      return this.slides[this.currentSlideIndex] || null
    }
  },
  methods: {
    addNewSlide() {
      this.slides.push({
        image: null,
        text: ''
      })
      this.currentSlideIndex = this.slides.length - 1
    },
    selectSlide(index) {
      this.currentSlideIndex = index
    },
    async changeImage(index) {
      this.selectedSlideIndex = index
      try {
        const response = await fetch('http://localhost:3000/api/images')
        if (!response.ok) {
          throw new Error('이미지 목록을 불러오는데 실패했습니다.')
        }
        this.availableImages = await response.json()
        this.showImageSelector = true
      } catch (error) {
        console.error('이미지 목록을 불러오는데 실패했습니다:', error)
        alert('이미지 목록을 불러오는데 실패했습니다.')
      }
    },
    handleImageSelect(imageUrl) {
      if (this.selectedSlideIndex !== null) {
        this.slides[this.selectedSlideIndex].image = imageUrl
      }
    },
    closeImageSelector() {
      this.showImageSelector = false
      this.selectedSlideIndex = null
    },
    async deleteSlide(index) {
      if (this.slides.length === 1) {
        if (!confirm('마지막 슬라이드를 삭제하시겠습니까?\n모든 내용이 초기화됩니다.')) {
          return;
        }
      } else {
        if (!confirm(`슬라이드 ${index + 1}을(를) 삭제하시겠습니까?`)) {
          return;
        }
      }

      this.slides.splice(index, 1);
      
      // 현재 슬라이드 인덱스 조정
      if (this.currentSlideIndex >= this.slides.length) {
        this.currentSlideIndex = Math.max(0, this.slides.length - 1);
      }

      // 슬라이드를 모두 삭제한 경우 자동으로 새 슬라이드 추가
      if (this.slides.length === 0) {
        this.addNewSlide();
      }
    },
    async savePPT() {
      try {
        const response = await fetch('http://localhost:3000/presentations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            slides: this.slides
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '저장에 실패했습니다.')
        }
        
        const result = await response.json()
        this.presentationId = result.presentationId
        alert('PPT가 성공적으로 저장되었습니다.')
      } catch (error) {
        console.error('PPT 저장 중 오류가 발생했습니다:', error)
        alert(error.message || 'PPT 저장에 실패했습니다.')
      }
    },
    async exportToPDF() {
      if (!this.presentationId) {
        alert('먼저 PPT를 저장해주세요.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/presentations/${this.presentationId}/export-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            slides: this.slides.map(slide => ({
              content: slide.text || '',
              image: slide.image
            }))
          })
        });

        if (!response.ok) {
          throw new Error('PPT 생성에 실패했습니다.');
        }

        const result = await response.json();
        
        // PPT 파일 다운로드
        const pptxLink = document.createElement('a');
        pptxLink.href = `http://localhost:3000${result.pptxUrl}`;
        pptxLink.download = `presentation_${this.presentationId}.pptx`;
        document.body.appendChild(pptxLink);
        pptxLink.click();
        document.body.removeChild(pptxLink);

        alert('PPT 파일이 다운로드되었습니다.');
      } catch (error) {
        console.error('PPT 생성 중 오류가 발생했습니다:', error);
        alert(error.message || 'PPT 생성에 실패했습니다.');
      }
    },
    getImageUrl(image) {
      if (!image) return null;
      return `http://localhost:3000${image}`;
    },
    async showPresentationList() {
      try {
        const response = await fetch('http://localhost:3000/presentations');
        if (!response.ok) {
          throw new Error('프레젠테이션 목록을 불러오는데 실패했습니다.');
        }
        this.presentations = await response.json();
        this.showPresentationModal = true;
      } catch (error) {
        console.error('프레젠테이션 목록 조회 실패:', error);
        alert('프레젠테이션 목록을 불러오는데 실패했습니다.');
      }
    },
    closePresentationList() {
      this.showPresentationModal = false;
    },
    async loadPresentation(id) {
      try {
        const response = await fetch(`http://localhost:3000/presentations/${id}`);
        if (!response.ok) {
          throw new Error('프레젠테이션을 불러오는데 실패했습니다.');
        }
        const presentation = await response.json();
        
        // 슬라이드 데이터 변환
        this.slides = presentation.slides.map(slide => ({
          text: slide.content,
          image: slide.images[0] || null
        }));
        
        this.presentationId = presentation._id;
        this.currentSlideIndex = 0;
        this.showPresentationModal = false;
      } catch (error) {
        console.error('프레젠테이션 불러오기 실패:', error);
        alert('프레젠테이션을 불러오는데 실패했습니다.');
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
</script>

<style scoped>
.ppt-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.menu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.menu-left h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.menu-right {
  display: flex;
  gap: 10px;
}

.menu-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f0f0f0;
  transition: all 0.2s;
}

.menu-btn:hover {
  opacity: 0.9;
}

.menu-btn.primary {
  background-color: #4CAF50;
  color: white;
}

.menu-btn.secondary {
  background-color: #2196F3;
  color: white;
}

.menu-btn.secondary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.menu-btn.info {
  background-color: #ff9800;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

.slide-list {
  width: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.slide-item {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.slide-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.slide-item.active {
  border: 2px solid #4CAF50;
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.slide-number {
  font-weight: bold;
  color: #333;
}

.delete-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  opacity: 0.8;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.slide-item:hover .delete-btn {
  opacity: 1;
}

.slide-preview {
  height: 150px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image {
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.no-image i {
  font-size: 24px;
}

.slide-text {
  padding: 10px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 1px solid #ddd;
}

.edit-area {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.edit-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
}

.edit-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.edit-content {
  padding: 20px;
}

.edit-section {
  margin-bottom: 20px;
}

.edit-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.image-preview {
  margin: 10px 0;
  min-height: 200px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.text-editor {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.edit-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f0f0f0;
  transition: all 0.2s;
  margin-top: 10px;
}

.edit-btn:hover {
  opacity: 0.9;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.presentation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.presentation-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.presentation-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.presentation-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.presentation-name {
  font-weight: bold;
  color: #333;
}

.presentation-date {
  font-size: 0.9em;
  color: #666;
}

.empty-message {
  text-align: center;
  padding: 20px;
  color: #666;
}

.empty-slides {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  text-align: center;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin: 20px;
}

.empty-slides i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #999;
}

.empty-slides p {
  margin: 4px 0;
  font-size: 14px;
}

.empty-slides p:first-of-type {
  font-weight: bold;
  font-size: 16px;
}
</style> 