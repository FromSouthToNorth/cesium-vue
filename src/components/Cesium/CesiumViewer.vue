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
} from 'cesium';
import { randomPolygon, randomPoint } from '@turf/turf'
import { getCenterOfMass } from '@/utils/geo'
import { addParabolaToScene, cesiumFlyTo } from '@/utils/cesium';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import Info from './info/index.vue';
import Control from './control/index.vue';

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

  const ranPolygon = randomPolygon(15, { bbox: [103.980875, 30.6263909, 104.1456699, 30.6936521], num_vertices: 4, max_radial_length: 0.006 })
  const ranPoint = randomPoint(20, { bbox: [103.980875, 30.6263909, 104.1456699, 30.6936521] })
  const features = ranPolygon.features.map(item => {
    return getCenterOfMass(item)
  })
  const pointGeoJSONs = {
    type: "FeatureCollection",
    features
  }

  const terrain = Terrain.fromWorldTerrain();
  viewer.scene.setTerrain(terrain)
  console.log(viewer.scene);

  terrain.readyEvent.addEventListener((res) => {
    console.log('地形加载完成！', res);
    GeoJsonDataSource.load(pointGeoJSON, {
      clampToGround: true, // 贴合地形
      markerSize: 50,
      markerSymbol: 'circle',
      markerColor: CesiumColor.RED
    }).then((dataSource) => {
      viewer.dataSources.add(dataSource).then(data => {
        console.log(data.entities.values[0].position.getValue());
        console.log('pointGeoJSONs: ', pointGeoJSONs.features);
        pointGeoJSONs.features.forEach(item => {
          addParabolaToScene(viewer, pointGeoJSON.geometry.coordinates, item.geometry.coordinates, { height: 300 }, res)
        })
      })
    })
    GeoJsonDataSource.load(pointGeoJSONs, {
      clampToGround: true, // 贴合地形
      stroke: CesiumColor.BLUE, // 折线和多边形边框颜色
      fill: CesiumColor.YELLOW.withAlpha(0.5), // 多边形填充颜色
      strokeWidth: 3,
      markerSize: 20, // 点大小
      markerSymbol: 'circle', // 点符号
      markerColor: CesiumColor.RED // 点颜色
    }).then((dataSource) => {
      viewer.dataSources.add(dataSource).then(data => {
        // console.log(data.entities.values);
      })
    })
    GeoJsonDataSource.load(ranPolygon, {
      clampToGround: true, // 贴合地形
      stroke: CesiumColor.BLUE, // 折线和多边形边框颜色
      fill: CesiumColor.YELLOW.withAlpha(0.5), // 多边形填充颜色
      strokeWidth: 3,
    }).then((dataSource) => {
      // 将数据源添加到 Viewer
      viewer.dataSources.add(dataSource).then((data) => {
        viewer.zoomTo(data.entities.values);
      })
    })
  })
  terrain.errorEvent.addEventListener((error) => {
    console.log('获取地形失败: ', error);
  })

  // GeoJsonDataSource.load(ranPolygon, {
  //   // 设置高度参考为地面
  //   heightReference: HeightReference.CLAMP_TO_GROUND,
  //   stroke: CesiumColor.BLUE, // 折线和多边形边框颜色
  //   fill: CesiumColor.YELLOW.withAlpha(0.5), // 多边形填充颜色
  //   strokeWidth: 3,
  //   markerSize: 20, // 点大小
  //   markerSymbol: 'circle', // 点符号
  //   markerColor: CesiumColor.RED // 点颜色
  // }).then((dataSource) => {
  //   // 将数据源添加到 Viewer
  //   viewer.dataSources.add(dataSource).then((data) => {
  //     console.log(data.entities.values);
  //     // .forEach(entity => {
  //     //   entity.polygon.extrudedHeight = 200
  //     // })
  //   })
  // })

  // // 加载 GeoJSON 数据
  // async function loadGeoJson(url, options) {
  //   try {
  //     const dataSource = await GeoJsonDataSource.load(url, options);
  //     await viewer.dataSources.add(dataSource);
  //     return dataSource;
  //   } catch (error) {
  //     console.error(`加载 GeoJSON 文件 ${url} 失败:`, error);
  //     throw error;
  //   }
  // }

  // // 获取实体位置（支持点和其他类型）
  // function getEntityPosition(entity, time = JulianDate.now()) {
  //   if (!entity) return null;
  //   if (entity.position) {
  //     return entity.position.getValue(time);
  //   }
  //   // 未来可扩展支持多边形等类型的中心点
  //   console.warn(`实体 ${entity.id} 没有有效位置`);
  //   return null;
  // }

  // processPointsAndDistances(pointGeoJSON, pointGeoJSONs)

  // // 主函数：处理点并计算距离
  // async function processPointsAndDistances(pointGeoJSON, pointGeoJSONs) {
  //   try {
  //     // 加载基准点 GeoJSON
  //     const baseDataSource = await loadGeoJson(pointGeoJSON, {
  //       // 设置高度参考为地面
  //       heightReference: HeightReference.CLAMP_TO_GROUND,
  //       markerSize: 50,
  //       markerSymbol: 'circle',
  //       markerColor: CesiumColor.RED
  //     });

  //     // 验证基准点
  //     const basePoint = baseDataSource.entities.values[0];
  //     if (!basePoint) {
  //       throw new Error('第一个 GeoJSON 中没有找到基准点');
  //     }
  //     const basePosition = getEntityPosition(basePoint);
  //     if (!basePosition) {
  //       throw new Error('基准点没有有效位置');
  //     }

  //     // 加载其他点 GeoJSON
  //     const pointsDataSource = await loadGeoJson(pointGeoJSONs, {
  //       // 设置高度参考为地面
  //       heightReference: HeightReference.CLAMP_TO_GROUND,
  //       markerSize: 40,
  //       markerSymbol: 'circle',
  //       markerColor: CesiumColor.GREEN
  //     });

  //     // 处理第二个 GeoJSON 中的每个实体
  //     const entities = pointsDataSource.entities.values;
  //     if (entities.length === 0) {
  //       console.warn('第二个 GeoJSON 中没有实体');
  //       return;
  //     }

  //     for (const entity of entities) {
  //       const targetPosition = getEntityPosition(entity);
  //       // console.log('targetPosition: ', targetPosition);

  //       if (!targetPosition) return; // 跳过无位置的实体

  //       const result = getDistance(basePosition, targetPosition);
  //       if (!result) return;

  //       const { distance, baseCoords, targetCoords } = result;

  //       // 绘制抛物线
  //       addParabolaToScene(viewer,
  //         [baseCoords.longitude, baseCoords.latitude, basePosition.height],
  //         [targetCoords.longitude, targetCoords.latitude, targetPosition.height],
  //         { height: distance / 10 }
  //       );
  //     }

  //     // 缩放到数据
  //     viewer.zoomTo(pointsDataSource);
  //   } catch (error) {
  //     console.error('处理点数据时出错:', error);
  //   }
  // }

  // const { geometry } = pointGeoJSON

  // cesiumFlyTo(geometry.coordinates)

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
