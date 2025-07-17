<template>
  <div id="cesiumContainer">
    <div id="cesiumInfo">
      经度: <span ref='longitude'></span> °
      经度: <span ref='latitude'></span> °
      高度: <span ref="height"></span> 米
      航向: <span ref="heading"></span> °
      俯仰: <span ref="pitch"></span> °
      滚转: <span ref="roll"></span> °
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Viewer, Ion, Cartesian3, Model as CesiumModel, Math as CesiumMath } from 'cesium';
import { useCesiumStore } from '../../stores/cesiumStore';

const cesiumStore = useCesiumStore()

const longitude = ref(null)
const latitude = ref(null)
const height = ref(null)
const heading = ref(null)
const pitch = ref(null)
const roll = ref(null)

onMounted(() => {
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Viewer('cesiumContainer', {
    infoBox: false,
    timeline: false,
    animation: false,
  });
  cesiumStore.setViewer(viewer)

  viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(104.0633, 30.66, 26000),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0
      },
      duration: 3 // 飞行时间（秒）
    });
  });

  getCesiumInfo()

  viewer.camera.moveEnd.addEventListener(() => {
    getCesiumInfo()
  });
})

function getCesiumInfo() {
  const { viewer } = cesiumStore
  if (!viewer) return
  // 获取当前相机位置（弧度制）
  const { camera } = viewer
  const cartographic = camera.positionCartographic;
  longitude.value.textContent = CesiumMath.toDegrees(cartographic.longitude).toFixed(7);
  latitude.value.textContent = CesiumMath.toDegrees(cartographic.latitude).toFixed(7);
  height.value.textContent = Math.ceil(cartographic.height);
  pitch.value.textContent = CesiumMath.toDegrees(camera.pitch).toFixed(2);
  heading.value.textContent = CesiumMath.toDegrees(camera.heading).toFixed(2);
  roll.value.textContent = CesiumMath.toDegrees(camera.roll).toFixed(2);
}

</script>
