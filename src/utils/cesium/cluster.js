import { PinBuilder, Color as CesiumColor, defined, VerticalOrigin } from 'cesium'

export function cluster(dataSource) {
  const { clustering } = dataSource
  clustering.enabled = true
  const pinBuilder = new PinBuilder();
  const pin50 = pinBuilder.fromText("50+", CesiumColor.RED, 48).toDataURL();
  const pin40 = pinBuilder.fromText("40+", CesiumColor.ORANGE, 48).toDataURL();
  const pin30 = pinBuilder.fromText("30+", CesiumColor.YELLOW, 48).toDataURL();
  const pin20 = pinBuilder.fromText("20+", CesiumColor.GREEN, 48).toDataURL();
  const pin10 = pinBuilder.fromText("10+", CesiumColor.BLUE, 48).toDataURL();
  let removeListener;
  const singleDigitPins = new Array(8);
  for (let i = 0; i < singleDigitPins.length; ++i) {
    singleDigitPins[i] = pinBuilder
      .fromText(`${i + 2}`, CesiumColor.VIOLET, 48)
      .toDataURL();
  }

  function customStyle() {
    if (defined(removeListener)) {
      removeListener();
      removeListener = undefined;
    } else {
      removeListener = dataSource.clustering.clusterEvent.addEventListener(
        function (clusteredEntities, cluster) {
          cluster.label.show = false;
          cluster.billboard.show = true;
          cluster.billboard.id = cluster.label.id;
          cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM;

          if (clusteredEntities.length >= 50) {
            cluster.billboard.image = pin50;
          } else if (clusteredEntities.length >= 40) {
            cluster.billboard.image = pin40;
          } else if (clusteredEntities.length >= 30) {
            cluster.billboard.image = pin30;
          } else if (clusteredEntities.length >= 20) {
            cluster.billboard.image = pin20;
          } else if (clusteredEntities.length >= 10) {
            cluster.billboard.image = pin10;
          } else {
            cluster.billboard.image =
              singleDigitPins[clusteredEntities.length - 2];
          }
        },
      );
    }
  }

  // force a re-cluster with the new styling
  const pixelRange = dataSource.clustering.pixelRange;
  dataSource.clustering.pixelRange = 0;
  dataSource.clustering.pixelRange = pixelRange;

  // start with custom style
  customStyle();
}
