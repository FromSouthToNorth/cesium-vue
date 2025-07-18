<template>
  <div id="cesiumContainer">
    <Control />
    <Info />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Viewer, Ion, Cartesian3, Math as CesiumMath } from 'cesium';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import Info from './info/index.vue';
import Control from './control/index.vue';

const cesiumStore = useCesiumStore()

onMounted(() => {
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Viewer('cesiumContainer', {
    infoBox: false,
    timeline: false,
    animation: false,
  });
  cesiumStore.setViewer(viewer)
  flyTo()
  function flyTo() {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(104.0633, 30.66, 26000),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0
      },
      duration: 3 // 飞行时间（秒）
    });
  }

  viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => flyTo());
})



</script>
