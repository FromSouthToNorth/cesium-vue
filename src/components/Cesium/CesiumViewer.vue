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
  Color as CesiumColor,
  ScreenSpaceEventType,
  defined,
  ScreenSpaceEventHandler,
  GeoJsonDataSource,
  Terrain,
  createOsmBuildingsAsync,
  Cartesian3,
  HeadingPitchRoll,
  Math as CesiumMath,
  Transforms,
  Ellipsoid,
  Model as CesiumModel,
  IonResource,
  HeightReference,
  Event as CesiumEvent,

} from 'cesium';
import { randomPolygon, randomLineString } from '@turf/turf'
import { getCenterOfMass } from '@/utils/geo'
import { addParabolaToScene, cesiumFlyTo } from '@/utils/cesium';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import Info from './info/index.vue';
import Control from './control/index.vue';

import LineString from '@/assets/geojson/LineString.json'

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
    terrain: Terrain.fromWorldTerrain({
      requestWaterMask: true, // 启用水面效果
      // requestVertexNormals: true // 启用地形法线以支持光照
    }),
    // globe: false, // 关闭默认地球
    // geocoder: IonGeocodeProviderType.GOOGLE, // 使用 Google 地理编码器
  });

  const position = Cartesian3.fromDegrees(104.0633, 30.6597);

  // 定义模型位置（经度，纬度，高度）
  // 设置朝向（航向、俯仰、滚转）
  const headingPitchRoll = new HeadingPitchRoll(CesiumMath.toRadians(135), 0, 0);

  const resource = IonResource.fromAssetId(3565717).then(e => {
    viewer.entities.add({
      model: {
        uri: e,
        minimumPixelSize: 14,
        maximumScale: 200,
      },
      position
    });
  })
  const tileset = createOsmBuildingsAsync().then((layer) => {
    viewer.scene.primitives.add(layer)
  })
  // 启用调试模式以查看性能
  viewer.scene.debugShowFramesPerSecond = true;
  cesiumStore.setViewer(viewer)
  const bbox = [103.980875, 30.6263909, 104.1456699, 30.6936521]
  const ranPolygon = randomPolygon(15, { bbox, num_vertices: 4, max_radial_length: 0.006 })
  const ranLineString = randomLineString(15, { bbox, num_vertices: 4, max_radial_length: 0.006 })

  console.log('LineString: ', LineString);
  console.log(ranLineString);


  const features = ranPolygon.features.map(item => {
    return getCenterOfMass(item)
  })
  const pointGeoJSONs = {
    type: "FeatureCollection",
    features
  }

  const terrain = Terrain.fromWorldTerrain();
  viewer.scene.setTerrain(terrain)
  function geoJSONLoad(geojson, options, callback) {
    const _options = Object.assign({
      markerSize: 50,
      markerSymbol: 'circle',
      markerColor: CesiumColor.RED,
      clampToGround: true, // 贴合地形
      stroke: CesiumColor.BLUE, // 折线和多边形边框颜色
      fill: CesiumColor.YELLOW.withAlpha(0.5), // 多边形填充颜色
      strokeWidth: 3,
    }, options)
    GeoJsonDataSource.load(geojson, _options).then(function (dataSource) {
      viewer.dataSources.add(dataSource).then(e => {
        callback && callback(e)
      })
    });
  }

  terrain.readyEvent.addEventListener((res) => {
    console.log('地形加载完成！', res);
    geoJSONLoad(pointGeoJSON, {}, () => {
      pointGeoJSONs.features.forEach(item => {
        addParabolaToScene(viewer, pointGeoJSON.geometry.coordinates, item.geometry.coordinates, { height: 300 }, res)
      })
    })
    geoJSONLoad(pointGeoJSONs, { markerColor: CesiumColor.GREEN, markerSize: 30 })
    geoJSONLoad(ranPolygon, {}, (data) => {
      viewer.zoomTo(data.entities.values)
    })
    geoJSONLoad(LineString, { clampToGround: false }, (data) => {
      data.entities.values.forEach(item => {
        // console.log(item.polyline.positions.getValue());
      })
    })
  })
  terrain.errorEvent.addEventListener((error) => {
    console.log('获取地形失败: ', error);
  })


  viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => cesiumFlyTo(geometry.coordinates));

  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

  // 点击事件
  handler.setInputAction(function (movement) {
    const pickedObject = viewer.scene.pick(movement.position);
    if (defined(pickedObject) && defined(pickedObject.id)) {
      const entity = pickedObject.id;
      console.log(`LEFT_CLICK: ${entity.name} (ID: ${entity.id})`);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
})
</script>
