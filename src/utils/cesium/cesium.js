import { toRaw, unref } from 'vue'

import {
  Primitive,
  GeometryInstance,
  PolylineColorAppearance,
  PolylineMaterialAppearance,
  Color as CesiumColor,
  Cartesian3,
  Math as CesiumMath,
  PolylineGeometry,
  Material,
  VertexFormat,
  JulianDate,
  Cartographic
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';

function getViewer() {
  const { viewer } = useCesium();
  return toRaw(unref(viewer));
}


export const cesiumFlyTo = (point, options = {}, viewer) => {
  viewer = viewer || getViewer();
  options.height = options.height || 5000;
  options.heading = options.heading || 0;
  options.pitch = options.pitch || -25;
  const { height, heading, pitch } = options
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(point[0], point[1], height),
    orientation: {
      heading: CesiumMath.toRadians(heading),
      pitch: CesiumMath.toRadians(pitch),
      roll: 0.0
    },
    duration: 3 // 飞行时间（秒）
  });
}

/**
 * 添加抛物线到场景
 */
export function addParabolaToScene(viewer, startPoint, endPoint, options = {}) {
  const _viewer = viewer || getViewer();
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
  _viewer.scene.primitives.add(
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
  _viewer.scene.primitives.add(
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

export function cesiumEntityToGeoJSON(entity) {
  const feature = {
    type: "Feature",
    properties: {},
    geometry: null
  };

  // Extract properties
  if (entity.name) feature.properties.name = entity.name;
  if (entity.description) feature.properties.description = entity.description.getValue();
  if (entity.properties) {
    const props = entity.properties.getValue(JulianDate.now());
    for (const key in props) {
      feature.properties[key] = props[key];
    }
  }

  // Handle point geometry
  if (entity.position) {
    const cartographic = Cartographic.fromCartesian(
      entity.position.getValue(JulianDate.now())
    );
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    const altitude = cartographic.height || 0;

    feature.geometry = {
      type: "Point",
      coordinates: [longitude, latitude, altitude]
    };
  }
  // Handle polyline geometry
  else if (entity.polyline) {
    const positions = entity.polyline.positions.getValue(JulianDate.now());
    const coordinates = positions.map(pos => {
      const cartographic = Cartographic.fromCartesian(pos);
      return [
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
        cartographic.height || 0
      ];
    });

    feature.geometry = {
      type: "LineString",
      coordinates: coordinates
    };
  }
  // Handle polygon geometry
  else if (entity.polygon) {
    const hierarchy = entity.polygon.hierarchy.getValue(JulianDate.now());
    const coordinates = [hierarchy.positions.map(pos => {
      const cartographic = Cartographic.fromCartesian(pos);
      return [
        CesiumMath.toDegrees(cartographic.longitude),
        CesiumMath.toDegrees(cartographic.latitude),
        cartographic.height || 0
      ];
    })];

    // Ensure polygon is closed
    if (coordinates[0].length > 0) {
      coordinates[0].push(coordinates[0][0]);
    }

    feature.geometry = {
      type: "Polygon",
      coordinates: coordinates
    };
  }

  // Add feature if it has valid geometry
  if (feature.geometry) {
    return feature
  }
}

export function entityToGeoJSON(entity) {
  let geojson = {
    geometry: {
      type: "",
      coordinates: []
    },
    properties: {},
    type: "Feature"
  }
  if (entity.point) {
    geojson.geometry.type = "Point"
  }
  else if (entity.polygon) {
    const positions = entity.polygon.hierarchy.getValue().positions
    const coordinates = positions.map(e => {
      const cart = Cartographic.fromCartesian(e)
      return [
        CesiumMath.toDegrees(cart.longitude),
        CesiumMath.toDegrees(cart.latitude),
      ]
    })
    geojson.geometry.type = "Polygon"
    geojson.geometry.coordinates = [coordinates]
  }
  else if (entity.polyline) {
    geojson.geometry.type = "LineString"
  }
  return geojson
}



// 计算距离和坐标
export function getDistance(basePos, targetPos) {
  if (!basePos || !targetPos) return null;

  // 计算直线距离
  const distance = Cartesian3.distance(basePos, targetPos);

  // 转换为经纬度
  const baseCarto = Cartographic.fromCartesian(basePos);
  const targetCarto = Cartographic.fromCartesian(targetPos);
  const baseCoords = {
    longitude: CesiumMath.toDegrees(baseCarto.longitude),
    latitude: CesiumMath.toDegrees(baseCarto.latitude)
  };
  const targetCoords = {
    longitude: CesiumMath.toDegrees(targetCarto.longitude),
    latitude: CesiumMath.toDegrees(targetCarto.latitude)
  };

  return { distance, baseCoords, targetCoords };
}
