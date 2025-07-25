<template>
  <div id="cesiumContainer">
    <Control/>
    <Info/>
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
  NearFarScalar,
  Material,
  CallbackProperty,
  Cartographic,
  ClippingPolygon,
  ClippingPolygonCollection,
  ClippingPlane,
  ClippingPlaneCollection,
  JulianDate,
  sampleTerrainMostDetailed,
} from 'cesium';
import { randomPolygon, randomLineString, randomPoint, bbox as turfBbox, bboxPolygon, centroid } from '@turf/turf';
import { getCenterOfMass } from '@/utils/geo';
import { addParabolaToScene, cesiumFlyTo, cluster, createCircleWave } from '@/utils/cesium';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import Info from './info/index.vue';
import Control from './control/index.vue';

import LineString from '@/assets/geojson/LineString.json';
import PointGeoJSON from '@/assets/geojson/PointGeoJSON.json';

const cesiumStore = useCesiumStore();

const pointGeoJSON = {
  'id': 'Point_A',
  'type': 'Feature',
  'properties': {
    'name': '山西保安煤业',
    'label': '山西保安煤业',
  },
  'geometry': {
    'type': 'Point',
    'coordinates': [113.3532063, 37.8781213, 939.61],
  },
};

const points = {
  type: 'FeatureCollection',
  features: [{
    'id': 'Point_B',
    'type': 'Feature',
    'properties': {
      'name': '山西保安煤业',
      'label': '山西保安煤业',
    },
    'geometry': {
      'type': 'Point',
      'coordinates': [113.351826667, 37.872431263],
    },
  },
    {
      'id': 'Point_C',
      'type': 'Feature',
      'properties': {
        'name': '山西保安煤业',
        'label': '山西保安煤业',
      },
      'geometry': {
        'type': 'Point',
        'coordinates': [113.353704214, 37.874336792],
      },
    }],
};

const PolygonGeoJSON = {
  'id': 'Polygeo_B',
  'type': 'Feature',
  'properties': {
    'name': '山西保安煤业',
    'label': '山西保安煤业',
  },
  'geometry': {
    'type': 'Polygon',
    'coordinates': [
      [
        [113.378949, 37.861113],
        [113.353792, 37.878997],
        [113.353694, 37.890258],
        [113.291741, 37.889901],
        [113.287957, 37.869607],
        [113.308382, 37.873108],
        [113.331193, 37.864230],
        [113.345405, 37.868184],
        [113.353758, 37.874640],
      ],
    ],
  },
};

onMounted(() => {
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA';
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

  const scene = viewer.scene;
  const globe = scene.globe;
  globe.translucency.frontFaceAlphaByDistance = new NearFarScalar(
      400.0,
      0.0,
      800.0,
      1.0,
  );
  globe.translucency.enabled = true;
  globe.translucency.frontFaceAlphaByDistance.nearValue = 0.5;
  const position = Cartesian3.fromDegrees(104.0633, 30.6597);

  const resource = IonResource.fromAssetId(3565717)
      .then(e => {
        viewer.entities.add({
          model: {
            uri: e,
            minimumPixelSize: 14,
            maximumScale: 200,
          },
          position,
        });
      });

  const tileset = createOsmBuildingsAsync()
      .then((layer) => {
        scene.primitives.add(layer);
      });

  // 启用调试模式以查看性能
  scene.debugShowFramesPerSecond = true;
  cesiumStore.setViewer(viewer);
  const bbox = [103.980875, 30.6263909, 104.1456699, 30.6936521];
  // const bboxMax = [103.748703, 30.5285536, 104.4078827, 30.7975895]
  const ranPolygon = randomPolygon(15, { bbox, num_vertices: 4, max_radial_length: 0.006 });
  // const ranLineString = randomLineString(15, { bbox, num_vertices: 4, max_radial_length: 0.006 })
  const ranPoint = randomPoint(460, { bbox: [104.0584928, 30.6590906, 104.0687925, 30.6632943] });
  console.log('LineString: ', LineString);
  // console.log(ranLineString);
  console.log(ranPolygon);

  const features = ranPolygon.features.map(item => {
    return getCenterOfMass(item);
  });

  const pointGeoJSONs = {
    type: 'FeatureCollection',
    features,
  };

  const terrain = Terrain.fromWorldTerrain();
  scene.setTerrain(terrain);

  function geoJSONLoad(geojson, options, callback) {
    const _options = Object.assign({
      markerSize: 50,
      markerSymbol: 'circle',
      markerColor: CesiumColor.RED,
      clampToGround: true, // 贴合地形
      stroke: CesiumColor.BLUE, // 折线和多边形边框颜色
      fill: CesiumColor.YELLOW.withAlpha(0.5), // 多边形填充颜色
      strokeWidth: 3,
      extrudedHeight: 0,
    }, options);
    GeoJsonDataSource.load(geojson, _options)
        .then(function(dataSource) {
          viewer.dataSources.add(dataSource)
              .then(e => {
                callback && callback(e);
              });
        });
  }

  terrain.readyEvent.addEventListener((terr) => {
    console.log('地形加载完成！', terr);
    console.log('PolygonGeoJSON: ');
    const bbox = bboxPolygon(turfBbox(LineString));
    const { coordinates } = bbox.geometry;
    const positions = coordinates[0].map(e => {
      return Cartesian3.fromDegrees(e[0], e[1], 1000);
    });
    let clippingPolygonEnabled = true;
    const viewModel = {
      clippingPlanesEnabled: true,
    };
    const polygon = new ClippingPolygon({ positions });
    const clippingPolygons = new ClippingPolygonCollection({
      polygons: [polygon],
      enabled: clippingPolygonEnabled,
    });
    globe.clippingPolygons = clippingPolygons;

    geoJSONLoad(pointGeoJSON, { clampToGround: false });
    // geoJSONLoad(PolygonGeoJSON)
    geoJSONLoad(LineString, { clampToGround: false }, (dataSource) => {
      viewer.flyTo(dataSource.entities.values, {
        duration: 2.0,
      });
    });
    geoJSONLoad(PointGeoJSON, { clampToGround: false, markerSize: 20, markerColor: CesiumColor.GREEN });
    createCircleWave(viewer, pointGeoJSON.geometry.coordinates, { color: '#cf1322' });
    geoJSONLoad(points, { markerSize: 30 }, (dataSource) => {
      const positions = [];
      dataSource.entities.values.forEach((entity) => {
        const lonLat = Cartographic.fromCartesian(entity.position.getValue());
        positions.push(lonLat);
        const pos = [CesiumMath.toDegrees(lonLat.longitude), CesiumMath.toDegrees(lonLat.latitude)];
        addParabolaToScene(viewer, pointGeoJSON.geometry.coordinates, pos, {}, terr);
      });
      sampleTerrainMostDetailed(terr, positions)
          .then((result) => {
            result.forEach(e => {
              createCircleWave(viewer, [CesiumMath.toDegrees(e.longitude), CesiumMath.toDegrees(e.latitude), e.height], {});
            });
          });
    });
  });
  terrain.errorEvent.addEventListener((error) => {
    console.log('获取地形失败: ', error);
  });

  viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => cesiumFlyTo(pointGeoJSON.geometry.coordinates));

  const handler = new ScreenSpaceEventHandler(scene.canvas);

  // 点击事件
  handler.setInputAction(function(movement) {
    const pickedObject = scene.pick(movement.position);
    if (defined(pickedObject) && defined(pickedObject.id)) {
      const entity = pickedObject.id;
      console.log(entity);
      console.log(`LEFT_CLICK: ${entity.name} (ID: ${entity.id})`);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
});
</script>
