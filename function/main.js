"use strict";

const viewer = (function () {
  // Cesium IONアクセストークンを設定
  Cesium.Ion.defaultAccessToken = localStorage.getItem("cesiumToken");
  const viewer = new Cesium.Viewer("CesiumContainer");

  // カメラの初期位置を設定(俯瞰)
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(141.925, 42.563, 500), //日本全体(138, 29, 4000000)
    orientation: {
      heading: 0, // 視点の向き
      pitch: (-20 * Math.PI) / 180, // 視点のピッチ
      roll: 0,
    },
  });

  // UTCで2025年1月1日0時を設定
  const targetTime = new Date(Date.UTC(2025, 0, 1, 0, 0, 0)); // UTCの0時
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(targetTime);

  return viewer;
})();
