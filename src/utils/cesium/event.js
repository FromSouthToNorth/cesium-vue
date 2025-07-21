import {
  ScreenSpaceEventHandler,
  EventHelper
} from 'cesium'


// Cesium 事件管理工具
export class CesiumEventManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    this.eventHelper = new EventHelper();
    this.eventListeners = new Map(); // 存储事件回调以便解绑
  }

  // 绑定 ScreenSpaceEventHandler 事件
  bindScreenSpaceEvent(eventType, callback, options = {}) {
    const { stopPropagation = false, preventDefault = false } = options;
    const wrappedCallback = (event) => {
      console.log('event: ', event);

      if (stopPropagation) event.stopPropagation();
      if (preventDefault) event.preventDefault();
      callback(event);
    };
    this.handler.setInputAction(wrappedCallback, eventType);
    // 存储事件类型和回调以便解绑
    this.eventListeners.set(`${eventType}_${callback.toString()}`, {
      type: eventType,
      callback: wrappedCallback,
    });
    return this; // 支持链式调用
  }

  // 绑定 Cesium.Event 事件（如 camera.changed）
  bindCesiumEvent(event, callback, context = null) {
    const listener = event.addEventListener(callback, context);
    this.eventHelper.add(event, callback, context);
    // 存储以便解绑
    this.eventListeners.set(`${event}_${callback.toString()}`, {
      type: 'CesiumEvent',
      event,
      callback,
      listener,
    });
    return this;
  }

  // 解绑特定 ScreenSpaceEventHandler 事件
  unbindScreenSpaceEvent(eventType, callback) {
    const key = `${eventType}_${callback.toString()}`;
    const listener = this.eventListeners.get(key);
    if (listener && listener.type === eventType) {
      this.handler.removeInputAction(eventType);
      this.eventListeners.delete(key);
    }
    return this;
  }

  // 解绑特定 Cesium.Event 事件
  unbindCesiumEvent(event, callback) {
    const key = `${event}_${callback.toString()}`;
    const listener = this.eventListeners.get(key);
    if (listener && listener.type === 'CesiumEvent') {
      listener.event.removeEventListener(listener.callback);
      this.eventListeners.delete(key);
    }
    return this;
  }

  // 解绑所有事件
  destroy() {
    this.eventListeners.forEach((listener, key) => {
      if (listener.type === 'CesiumEvent') {
        listener.event.removeEventListener(listener.callback);
      } else {
        this.handler.removeInputAction(listener.type);
      }
      this.eventListeners.delete(key);
    });
    this.handler.destroy();
    this.eventHelper.removeAll();
  }
}
