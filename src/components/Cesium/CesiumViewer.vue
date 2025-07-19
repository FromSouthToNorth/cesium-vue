<template>
  <div id="cesiumContainer">
    <Control />
    <Info />
  </div>
</template>

<script setup>
import { onMounted, ref, toRaw, unref } from 'vue';
import {
  Viewer, Ion,
  Cartesian3,
  Math as CesiumMath,
  Color as CesiumColor,
  ScreenSpaceEventType,
  Cartographic,
  BoundingSphere,
  HeightReference,
  Ellipsoid,
  defined,
  ScreenSpaceEventHandler,
  PolylineDashMaterialProperty,
  Material,
  PolylineCollection,
  HermiteSpline,
  IonGeocodeProviderType,
  PolylineGeometry,
  PolylineColorAppearance,
  GeometryInstance,
  PolylineMaterialAppearance,
  VertexFormat,
  Primitive,
  JulianDate
} from 'cesium';
import { useCesiumStore } from '@/stores/modules/cesiumStore';
import { useCesium } from '@/hooks/cesium/useCesium'
import Info from './info/index.vue';
import Control from './control/index.vue';

const cesiumStore = useCesiumStore()

onMounted(() => {
  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Viewer('cesiumContainer', {
    infoBox: false,
    timeline: false,
    animation: false,
    // globe: false, // 关闭默认地球
    geocoder: IonGeocodeProviderType.GOOGLE, // 使用 Google 地理编码器
  });
  cesiumStore.setViewer(viewer)
  flyTo()
  function flyTo() {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(104.0705770, 30.5724307, 5000),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-25),
        roll: 0.0
      },
      duration: 3 // 飞行时间（秒）
    });
  }
  const polygons = [
    {
      id: "Polygon_1",
      name: "Polygon_1",
      positions: Cartesian3.fromDegreesArray([
        104.118261187851, 30.65254722059734,
        104.12262045270334, 30.64993982296653,
        104.11727159650144, 30.648536715820708,
        104.11317781038619, 30.651186097762604,
        104.118261187851, 30.65254722059734
      ]),
    },
    {
      id: "Polygon_2",
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
  const points = [
    { lon: 104.06146224184954, lat: 30.66075589926439, name: "Point_1", id: "Point_1" },
    { lon: 104.06391288134151, lat: 30.660752913305988, name: "Point_2", id: "Point_2" },
    { lon: 104.06166459432066, lat: 30.660781966602045, name: "Point_3", id: "Point_3" },
  ];

  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

  points.forEach(point => {
    viewer.entities.add({
      name: point.name,
      position: Cartesian3.fromDegrees(point.lon, point.lat),
      point: {
        pixelSize: 10,
        color: CesiumColor.RED,
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    });
  })

  // 存储多边形中心点
  const centers = [];

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

  viewer.entities.values.forEach((entity) => {
    let geomtry
    let properties = entity.properties ? entity.properties.getValue(JulianDate.now()) : {};
    console.log(properties);

  });

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

  // [104.0168936, 30.6608235]
  // [104.0885922, 30.6607586]
  addParabolaToScene(viewer, [104.06146224184954, 30.66075589926439], [104.06391288134151, 30.660752913305988], { height: 40 })
  addParabolaToScene(viewer, [104.06146224184954, 30.66075589926439], [104.0623844, 30.6503250], { height: 120 })
  addParabolaToScene(viewer, [104.06146224184954, 30.66075589926439], [104.06166459432066, 30.660781966602045], { height: 60 })
})

/**
 * 添加抛物线到场景
 */
const addParabolaToScene = (viewer, startPoint, endPoint, options = {}) => {
  // 获取路径坐标
  const cartesianPositions = setPathData(startPoint, endPoint, options);
  const pointsCount = options.pointsCount || 100;

  // 创建颜色数组，用于给普通线条渐变着色
  const colors = new Array(pointsCount);
  for (let i = 0; i < pointsCount; i++) {
    const ratio = i / (pointsCount - 1);
    // 蓝色逐渐过渡到红色
    colors[i] = CesiumColor.lerp(
      new CesiumColor(0.0, 1.0, 0.0, 0.5), // 蓝色
      new CesiumColor(0.0, 1.0, 0.0, 0.5), // 红色
      ratio,
      new CesiumColor()
    );
  }

  // 1. 添加普通线条（渐变色）
  viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: new PolylineGeometry({
          positions: cartesianPositions,
          width: 6.0,
          vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
          colors: colors,
          colorsPerVertex: true,
        }),
      }),
      appearance: new PolylineColorAppearance(),
    })
  );

  // 2. 创建流动线材质
  const flowingMaterial = createFlowingLineMaterial();

  // 3. 添加流动线
  viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: new PolylineGeometry({
          positions: cartesianPositions,
          width: 20.0,
          vertexFormat: VertexFormat.ALL,
        }),
      }),
      appearance: new PolylineMaterialAppearance({
        material: flowingMaterial,
      }),
    })
  );
};

/**
 * 生成抛物线路径数据
 */
const setPathData = (pointStart, pointEnd, options = {}) => {
  // 合并默认选项
  const height = options.height || 10000;
  const pointsCount = options.pointsCount || 100;

  // 提取起点和终点的经纬度
  const startLon = pointStart[0];
  const startLat = pointStart[1];
  const endLon = pointEnd[0];
  const endLat = pointEnd[1];

  // 预分配数组（每个点有经度、纬度、高度共 3 个值）
  const positionsArray = new Array(pointsCount * 3);

  // 生成抛物线点集
  for (let i = 0; i < pointsCount; i++) {
    // 计算当前点在起点到终点连线上的比例
    const ratio = i / (pointsCount - 1);

    // 线性插值计算当前经纬度
    const lon = startLon + ratio * (endLon - startLon);
    const lat = startLat + ratio * (endLat - startLat);

    // 计算抛物线高度 - 利用公式 y = 4 * h * x * (1 - x)
    const curHeight = 4 * height * ratio * (1 - ratio);

    // 写入数组
    const idx = i * 3;
    positionsArray[idx] = lon;
    positionsArray[idx + 1] = lat;
    positionsArray[idx + 2] = curHeight;
  }

  // 返回 Cesium 坐标数组
  return Cartesian3.fromDegreesArrayHeights(positionsArray);
};

/**
 * 创建流动线材质
 */
const createFlowingLineMaterial = () => {
  // GLSL 代码
  const flowingLineGLSL = `
    float SPEED_STEP = 0.01; // 增加速度步长，使光线移动更快
    vec4 drawLight(float xPos, vec2 st, float headOffset, float tailOffset, float widthOffset) {
      float lineLength = smoothstep(xPos + headOffset, xPos, st.x) - smoothstep(xPos, xPos - tailOffset, st.x);
      float lineWidth = smoothstep(widthOffset, 0.5, st.y) - smoothstep(0.5, 1.0 - widthOffset, st.y);
      return vec4(lineLength * lineWidth);
    }
    czm_material czm_getMaterial(czm_materialInput materialInput) {
      // 获取基础材质
      czm_material m = czm_getDefaultMaterial(materialInput);
      // sinTime 用来让光线往复运动
      float sinTime = sin(czm_frameNumber * SPEED_STEP * speed);
      float xPos = 0.0;
      if (sinTime < 0.0) {
        xPos = cos(czm_frameNumber * SPEED_STEP * speed) + 1.0 - tailsize;
      } else {
        xPos = -cos(czm_frameNumber * SPEED_STEP * speed) + 1.0 - tailsize;
      }
      // 计算光带范围
      vec4 v4_color = drawLight(xPos, materialInput.st, headsize, tailsize, widthoffset);
      // 光带的“核心”更加亮，宽度更小
      vec4 v4_core = drawLight(xPos, materialInput.st, coresize, coresize * 2.0, widthoffset * 2.0);
 
      // 叠加核心与整体颜色
      m.diffuse = color.xyz + v4_core.xyz * v4_core.w * 0.8;
      m.alpha = pow(v4_color.w, 3.0);
      return m;
    }
  `;

  // 创建 Cesium 材质对象
  return new Material({
    fabric: {
      type: "FlowingLineMaterial",
      uniforms: {
        color: new CesiumColor(0.0, 1.0, 0.0, 0.5), // 线条的整体颜色（绿色+透明度）
        speed: 2, // 流动速度
        headsize: 0.05, // 光带头部尺寸
        tailsize: 0.5, // 光带尾部尺寸
        widthoffset: 0.1, // 光带在宽度方向的占比
        coresize: 0.05, // 核心光带
      },
      source: flowingLineGLSL,
    },
  });
};

</script>
