<template>
  <div class="compass-control">
    <button>
      <img ref="compass" src="@/assets/svg/compass.svg" alt="Compass" class="compass-icon" @click="toggleSliders" />
    </button>
    <div v-if="showSliders" class="sliders">
      <div class="slider-group">
        <label>倾斜度 (Pitch): {{ pitch }}°</label>
        <input type="range" v-model.number="pitch" min="-90" max="0" step="1" @input="updateCamera" />
      </div>
      <div class="slider-group">
        <label>方位角 (Heading): {{ heading }}°</label>
        <input type="range" v-model.number="heading" min="0" max="360" step="1" @input="updateCamera" />
      </div>
      <button @click="resetToNorth">重置向北</button>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, toRaw, unref } from 'vue';
import { Math as CesiumMath } from 'cesium';
import _throttle from 'lodash-es/throttle';

import { useCesium } from '@/hooks/cesium/useCesium';

const { viewer } = useCesium();

const compass = ref(null)
const pitch = ref(0)
const heading = ref(0)
const showSliders = ref(false)

function toggleSliders() {
  showSliders.value = !showSliders.value
}

function setPitchHeading() {
  const { camera } = toRaw(unref(viewer))
  pitch.value = Math.round(CesiumMath.toDegrees(camera.pitch));
  heading.value = Math.round(CesiumMath.toDegrees(camera.heading));
}

watch(viewer, () => {
  const { camera } = toRaw(unref(viewer))
  setPitchHeading()
  camera.moveEnd.addEventListener(() => {
    setPitchHeading()
    setCompassRotate()
  });
})

function updateCamera() {
  setView()
}

function setView() {
  const { camera } = toRaw(unref(viewer))
  setCompassRotate()
  camera.setView({
    destination: camera.position,
    orientation: {
      heading: CesiumMath.toRadians(heading.value),
      pitch: CesiumMath.toRadians(pitch.value),
      roll: 0.0,
    },
  });
}

function resetToNorth() {
  pitch.value = -90
  heading.value = 360
  setView()
}

function setCompassRotate() {
  const rot = heading.value > 0 ? -heading.value : Math.abs(heading.value)
  compass.value.style.transform = `rotate(${rot}deg)`
}
</script>
<style scoped>
.compass-control {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.compass-icon {
  width: 26px;
  height: 32px;
  cursor: pointer;
  transform: rotate(360deg);
}

.sliders {
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.slider-group {
  margin-bottom: 10px;
}

.slider-group label {
  display: block;
  margin-bottom: 5px;
}

.compass-control button {
  background-color: rgba(250, 250, 250, 0.8);
  border: none;
  border-radius: 50%;
}

.slider-group input {
  width: 200px;
}

.sliders button {
  width: 100%;
  padding: 5px;
  color: #0050b3;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.sliders button:hover {
  background-color: #d9d9d9;
}
</style>
