import { defineStore } from "pinia";
export const useCesiumStore = defineStore('cesium', {
  state: () => ({
    viewer: null,
  }),
  actions: {
    setViewer(viewer) {
      this.viewer = viewer
    },
    clearViewer() {
      if (this.viewer) {
        this.viewer.destroy()
      }
      this.viewer = null
    }
  }
})
