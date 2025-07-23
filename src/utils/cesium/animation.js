import {
  Color as CesiumColor,
  defaultValue,
  Event as CesiumEvent,
  Material,
  defined,
  Cartesian3
} from "cesium";
// 定义 CircleWaveMaterialProperty 类
function CircleWaveMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this._definitionChanged = new CesiumEvent();
  this._color = CesiumColor.clone(options.color && CesiumColor.fromCssColorString(options.color) || CesiumColor.RED);
  this._duration = defaultValue(options.duration, 1000);
  this._count = defaultValue(options.count, 2);
  if (this._count <= 0) {
    this._count = 1;
  }
  this._gradient = defaultValue(options.gradient, 0.1);
  if (this._gradient > 1) {
    this._gradient = 1;
  }
  this._time = performance.now(); // 使用 performance.now() 替代 new Date().getTime()
}

Object.defineProperties(CircleWaveMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return false;
    }
  },
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    }
  },
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      if (!CesiumColor.equals(this._color, value)) {
        this._color = CesiumColor.clone(value, this._color);
        this._definitionChanged.raiseEvent(this);
      }
    }
  },
  duration: {
    get: function () {
      return this._duration;
    },
    set: function (value) {
      if (this._duration !== value) {
        this._duration = value;
        this._definitionChanged.raiseEvent(this);
      }
    }
  },
  count: {
    get: function () {
      return this._count;
    },
    set: function (value) {
      if (this._count !== value) {
        this._count = value > 0 ? value : 1;
        this._definitionChanged.raiseEvent(this);
      }
    }
  },
  gradient: {
    get: function () {
      return this._gradient;
    },
    set: function (value) {
      if (this._gradient !== value) {
        this._gradient = Math.max(0, Math.min(1, value));
        this._definitionChanged.raiseEvent(this);
      }
    }
  }
});

CircleWaveMaterialProperty.prototype.getType = function () {
  return 'CircleWaveMaterial';
};

CircleWaveMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(result)) {
    result = {};
  }
  result.color = CesiumColor.clone(this._color, result.color);
  result.time = ((performance.now() - this._time) % this._duration) / this._duration;
  result.count = this._count;
  result.gradient = 1 + 10 * (1 - this._gradient);
  return result;
};

CircleWaveMaterialProperty.prototype.equals = function (other) {
  return this === other || (
    other instanceof CircleWaveMaterialProperty &&
    CesiumColor.equals(this._color, other._color) &&
    this._duration === other._duration &&
    this._count === other._count &&
    this._gradient === other._gradient
  );
};

// 注册自定义材质
Material._materialCache.addMaterial('CircleWaveMaterial', {
  fabric: {
    type: 'CircleWaveMaterial',
    uniforms: {
      color: new CesiumColor(181 / 255, 241 / 255, 254 / 255, 1), // 默认颜色
      time: 1,
      count: 1,
      gradient: 0.1
    },
    source: `
            czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                material.diffuse = 1.5 * color.rgb;
                vec2 st = materialInput.st;
                vec3 str = materialInput.str;
                float dis = distance(st, vec2(0.5, 0.5));
                float per = fract(time);
                if (abs(str.z) > 0.001) {
                    discard;
                }
                if (dis > 0.5) {
                    discard;
                } else {
                    float perDis = 0.5 / count;
                    float disNum;
                    float bl = 0.0;
                    for (int i = 0; i <= 9; i++) {
                        if (float(i) <= count) {
                            disNum = perDis * float(i) - dis + per / count;
                            if (disNum > 0.0) {
                                if (disNum < perDis) {
                                    bl = 1.0 - disNum / perDis;
                                } else if (disNum - perDis < perDis) {
                                    bl = 1.0 - abs(1.0 - disNum / perDis);
                                }
                                material.alpha = pow(bl, gradient);
                            }
                        }
                    }
                }
                return material;
            }
        `
  },
  translucent: function () {
    return true;
  }
});
export function createCircleWave(viewer, position, options = {}) {
  const color = options.color || '#fadb14'
  const duration = options.duration || 3000
  const gradient = options.gradient || 0.6
  const count = options.gradient || 4
  // 添加带有波纹效果的实体
  viewer.entities.add({
    position: Cartesian3.fromDegrees(position[0], position[1]),
    ellipse: {
      semiMinorAxis: 80,
      semiMajorAxis: 80,
      height: position[2] || 0,
      material: new CircleWaveMaterialProperty({
        color,
        duration,
        gradient,
        count
      })
    }
  });

}

