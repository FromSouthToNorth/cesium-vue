import {
  Color as CesiumColor,
  PinBuilder,
} from 'cesium';

const pinBuilder = new PinBuilder();
const ICON_URL = 'src/assets/svg/marker/ICON.svg';

function replaceIcon(icon) {
  return ICON_URL.replace('ICON', icon);
}

const markerIcon = {
  '海康': replaceIcon('hlk'),
  '氢气': replaceIcon('h2'),
  '人数': replaceIcon('peopleNum'),
  '分站': replaceIcon('branchStation'),
  '氧气': replaceIcon('o2'),
  '粉尘': replaceIcon('dust'),
  '瓦斯': replaceIcon('ch4'),
};

function getMarkerIcon(type) {
  return markerIcon[type];
}

export function createIconMarker(entity) {
  const obj = entity.properties.getValue();
  const iconURL = getMarkerIcon(obj.type);
  if (iconURL) {
    const color = obj['marker-color'] ? CesiumColor.fromCssColorString(obj['marker-color']) : CesiumColor.WHITE;
    pinBuilder.fromUrl(iconURL, color, 32)
      .then(e => {
        // console.log(e.toDataURL());
        entity.billboard.image = e.toDataURL();
      });
  }
}
