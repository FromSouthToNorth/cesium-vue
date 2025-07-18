<template>
  <div class="compass-control">
    <img ref="compass" src="@/assets/svg/compass.svg" alt="Compass" class="compass-icon" @click="toggleSliders" />
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
  pitch.value = CesiumMath.toDegrees(camera.pitch).toFixed(2);
  heading.value = CesiumMath.toDegrees(camera.heading).toFixed(2);
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
  width: 50px;
  height: 50px;
  cursor: pointer;
  transform: rotate(360deg);
}

.sliders {
  background: rgba(255, 255, 255, 0.9);
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

.slider-group input {
  width: 200px;
}

button {
  width: 100%;
  padding: 5px;
  background-color: #0078d7;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background-color: #005ba1;
}
</style>
