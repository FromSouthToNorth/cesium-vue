<template>
  <div id="cesiumContainer">
    <Control />
    <Info />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Viewer, Ion, Cartesian3, Math as CesiumMath, Color as CesiumColor, ScreenSpaceEventType, defined, ScreenSpaceEventHandler, PolylineDashMaterialProperty } from 'cesium';
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
  const polygons = [
    {
      id: 1,
      name: "polygon_1",
      positions: Cartesian3.fromDegreesArray([
        104.118261187851, 30.65254722059734,
        104.12262045270334, 30.64993982296653,
        104.11727159650144, 30.648536715820708,
        104.11317781038619, 30.651186097762604,
        104.118261187851, 30.65254722059734
      ]),
    },
    {
      id: 2,
      name: "polygon_2",
      positions: Cartesian3.fromDegreesArray([
        104.12182443934438, 30.643716913636933,
        104.1230782721637, 30.64322402014787,
        104.12223557561497, 30.638947187120205,
        104.1153439177896, 30.645972997070565,
        104.12182443934438, 30.643716913636933
      ]),
    }
  ]
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  const polygonEntities = polygons.map(e => {
    return viewer.entities.add({
      name: e.name,
      polygon: {
        hierarchy: e.positions,
        material: CesiumColor.RED.withAlpha(0.5),
        outline: false // 禁用内置边框（避免兼容性问题）
      },
      // 模拟边框使用 Polyline
      polyline: {
        positions: e.positions,
        width: 2,
        material: CesiumColor.BLACK
      }
    });
  })
  console.log(viewer.entities.values);

  // 点击事件
  handler.setInputAction(function (movement) {
    const pickedObject = viewer.scene.pick(movement.position);
    if (defined(pickedObject) && defined(pickedObject.id)) {
      const entity = pickedObject.id;
      console.log(`LEFT_CLICK: ${entity.name} (ID: ${entity.id})`);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
  let id

  let highlightedEntity
  // 鼠标悬停事件
  handler.setInputAction(function (movement) {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (defined(pickedObject) && defined(pickedObject.id) && id !== pickedObject.id.id) {
      const entity = pickedObject.id;
      id = entity.id;
      console.log(`MOUSE_MOVE: ${entity.name} (ID: ${entity.id})`);

      if (highlightedEntity) {
        if (highlightedEntity.polygon) {
          highlightedEntity.polygon.material = CesiumColor.RED.withAlpha(0.5);
        } else if (highlightedEntity.polyline) {
          highlightedEntity.polyline.material = PolylineDashMaterialProperty({
            color: CesiumColor.BLUE,
            dashLength: 10
          });
          highlightedEntity.polyline.width = 5;
        }
        highlightedEntity = null;
      }

      highlightedEntity = entity;
      if (entity.polygon) {
        entity.polygon.material = CesiumColor.YELLOW.withAlpha(0.7); // 高亮多边形
      } else if (entity.polyline) {
        entity.polyline.material = CesiumColor.YELLOW; // 高亮抛物线
        entity.polyline.width = 8;
      }
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => flyTo());
})



</script>
