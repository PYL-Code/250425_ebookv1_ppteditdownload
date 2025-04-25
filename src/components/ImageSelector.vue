<template>
  <div class="image-selector-modal" v-if="show">
    <div class="modal-content">
      <div class="modal-header">
        <h3>이미지 선택</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="image-grid">
        <div 
          v-for="(image, index) in availableImages" 
          :key="index"
          class="image-item"
          :class="{ selected: selectedImage === image }"
          @click="selectImage(image)"
        >
          <img :src="getImageUrl(image)" :alt="'이미지 ' + (index + 1)">
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn">취소</button>
        <button @click="confirmSelection" class="btn primary" :disabled="!selectedImage">선택</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageSelector',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    availableImages: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedImage: null
    }
  },
  methods: {
    close() {
      this.selectedImage = null;
      this.$emit('close');
    },
    selectImage(image) {
      this.selectedImage = image;
    },
    confirmSelection() {
      if (this.selectedImage) {
        this.$emit('select', this.selectedImage);
        this.close();
      }
    },
    getImageUrl(image) {
      return `http://localhost:3000${image}`;
    }
  }
}
</script>

<style scoped>
.image-selector-modal {
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

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 20px;
  overflow-y: auto;
}

.image-item {
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-item.selected {
  border-color: #4CAF50;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #ddd;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f0f0f0;
}

.btn.primary {
  background-color: #4CAF50;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 