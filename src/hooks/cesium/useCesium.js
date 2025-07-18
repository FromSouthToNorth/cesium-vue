import { computed } from "vue";

import { useCesiumStore } from "@/stores/modules/cesiumStore";
export function useCesium() {
  const cesiumStore = useCesiumStore();

  const viewer = computed(() => cesiumStore.viewer);

  return {
    viewer
  };
}
