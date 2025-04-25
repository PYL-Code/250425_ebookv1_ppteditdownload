import { createRouter, createWebHistory } from 'vue-router'
import EbookViewer from '../components/EbookViewer.vue'
import PPTEditor from '../components/PPTEditor.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: EbookViewer
  },
  {
    path: '/editor',
    name: 'editor',
    component: PPTEditor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 