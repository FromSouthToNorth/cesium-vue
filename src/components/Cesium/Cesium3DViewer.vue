<template>
  <div id="cesiumContainer">
    <Control />
    <Info />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import {
  Viewer,
  Ion,
  createOsmBuildingsAsync,
  Terrain
} from 'cesium';
import Info from './info/index.vue';
import Control from './control/index.vue';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import { addParabolaToScene, cesiumFlyTo, entityToGeoJSON, getDistance } from '@/utils/cesium';

const cesiumStore = useCesiumStore()

const pointGeoJSON = {
  "id": "Point_A",
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Point",
    "coordinates": [104.0633, 30.6597]
  }
}

onMounted(() => {
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Viewer('cesiumContainer', {
    infoBox: false,
    timeline: false,
    animation: false,
    terrain: Terrain.fromWorldTerrain(),
    // globe: false, // 关闭默认地球
    // geocoder: IonGeocodeProviderType.GOOGLE, // 使用 Google 地理编码器
  });

  cesiumStore.setViewer(viewer)

  const tileset = createOsmBuildingsAsync().then((layer) => {
    viewer.scene.primitives.add(layer)
  })

  cesiumFlyTo(pointGeoJSON.geometry.coordinates)
});
</script>
