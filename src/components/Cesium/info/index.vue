<template>
  <div id="cesiumInfo">
    <Transition name="fade">
      <div v-show="showInfo">
        <span ref='longitude'></span> ° <span ref='latitude'></span> °
        高度: <span ref="height"></span> 米
        航向: <span ref="heading"></span> °
        俯仰: <span ref="pitch"></span> °
        滚转: <span ref="roll"></span>
      </div>
    </Transition>
  </div>
</template>

<script setup>

import { onMounted, ref, watch, toRaw, unref } from 'vue'
import { Math as CesiumMath } from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium'

const { viewer } = useCesium()

const longitude = ref(null)
const latitude = ref(null)
const height = ref(null)
const heading = ref(null)
const pitch = ref(null)
const roll = ref(null)
const showInfo = ref(false)

onMounted(() => {
})

watch(
  viewer,
  () => {
    getCesiumInfo()
    const { camera } = toRaw(unref(viewer))
    camera.moveStart.addEventListener(() => {
      showInfo.value = false
    });
    camera.moveEnd.addEventListener(() => {
      getCesiumInfo()
      showInfo.value = true
    });
  }
)

function getCesiumInfo() {
  // 获取当前相机位置（弧度制）
  const { camera } = toRaw(unref(viewer))
  const cartographic = camera.positionCartographic;
  longitude.value.textContent = CesiumMath.toDegrees(cartographic.longitude).toFixed(7);
  latitude.value.textContent = CesiumMath.toDegrees(cartographic.latitude).toFixed(7);
  height.value.textContent = Math.ceil(cartographic.height);
  pitch.value.textContent = CesiumMath.toDegrees(camera.pitch).toFixed(2);
  heading.value.textContent = CesiumMath.toDegrees(camera.heading).toFixed(2);
  roll.value.textContent = CesiumMath.toDegrees(camera.roll).toFixed(2);
}
</script>

<style scoped>
#cesiumInfo {
  position: absolute;
  padding: 2px;
  bottom: 2px;
  left: 2px;
  z-index: 999;
  color: #d9d9d9;
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
