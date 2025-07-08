// 削除確率の設定（築年齢ごとに異なる確率）
const demolitionProbabilities = {
  "0~5": 1 - 0,
  "6~15": 1 - 0.099594893,
  "16~25": 1 - 0.059156657,
  "26~35": 1 - 0.094209708,
  "36~45": 1 - 0.264274535,
  "46~": 1 - 0.390645831,
  no_data: 1 - 0.142936261, // 年度データなし
};

// 復活確率の設定
const revivalProbabilities1 = {
  "0~5": 0.059832469,
  "6~15": 0.059832469,
  "16~25": 0.059832469,
  "26~35": 0.059832469,
  "36~45": 0.059832469,
  "46~": 0.059832469,
  no_data: 0.059832469, // 年度データなし
};

// 政策で新築率アップ
const revivalProbabilities2 = {
  "0~5": 0.059832469 * 1.89,
  "6~15": 0.059832469 * 1.89,
  "16~25": 0.059832469 * 1.89,
  "26~35": 0.059832469 * 1.89,
  "36~45": 0.059832469 * 1.89,
  "46~": 0.059832469 * 1.89,
  no_data: 0.059832469 * 1.89, // 年度データなし
};

const visibleEntitiesGroup = [];

// 築年数の値に基づいてモデルの色を選択する関数
function getColorByYear(year, i) {
  const currentYear = new Date().getFullYear(); //現在の年
  const age = 2025 - year + 5 * i; // 年数を計算

  // 色のマッピング
  if (age < 6) {
    return Cesium.Color.fromCssColorString("#8BC34A"); // ~5year 黄緑
  } else if (age < 16) {
    return Cesium.Color.fromCssColorString("#A5D6A7"); // 6~15year  緑
  } else if (age < 26) {
    return Cesium.Color.fromCssColorString("#FFEB3B"); // 16~25year  黄色
  } else if (age < 36) {
    return Cesium.Color.fromCssColorString("#FF9800"); // 26~35year  オレンジ
  } else if (age < 46) {
    return Cesium.Color.fromCssColorString("#F44336"); // 36~45year  赤
  } else if (age < 2000) {
    return Cesium.Color.fromCssColorString("#B71C1C"); // 46~year  濃い赤
  } else {
    return Cesium.Color.fromCssColorString("#1976D2"); //年度データなし  青
  }
}

// 築年数の値に基づいて確率を選択する関数
function getProbabilitiesByYear(year, i) {
  const currentYear = new Date().getFullYear();
  const age = 2025 - year + 5 * (i - 1);
  const Number = modelState.getModelNumber();
  const revivalProbabilities =
    Number === 5 ? revivalProbabilities2 : revivalProbabilities1;
  if (age < 6) {
    return {
      demolition: demolitionProbabilities["0~5"],
      revival: revivalProbabilities["0~5"],
    };
  } else if (age < 16) {
    return {
      demolition: demolitionProbabilities["6~15"],
      revival: revivalProbabilities["6~15"],
    };
  } else if (age < 26) {
    return {
      demolition: demolitionProbabilities["16~25"],
      revival: revivalProbabilities["16~25"],
    };
  } else if (age < 36) {
    return {
      demolition: demolitionProbabilities["26~35"],
      revival: revivalProbabilities["26~35"],
    };
  } else if (age < 46) {
    return {
      demolition: demolitionProbabilities["36~45"],
      revival: revivalProbabilities["36~45"],
    };
  } else if (age < 2000) {
    return {
      demolition: demolitionProbabilities["46~"],
      revival: revivalProbabilities["46~"],
    };
  } else {
    return {
      demolition: demolitionProbabilities["no_data"],
      revival: revivalProbabilities["no_data"],
    };
  }
}

let hiddenBuildings = []; // 削除された建物を管理するリスト
let revivalBuildings = []; //復活した建物を管理するリスト
let temporaryRevivalBuildings = []; //復活した建物の一時管理するリスト

// 各回の状態を保存するリスト（1～5回の状態を順番に格納）
let predictionStates = [];

// 指定した回の状態を保存する関数
function savePredictionState(step) {
  const visibleEntities =
    2246 - Buildings.filter((entity) => !entity.show).length; // 表示状態のエンティティを取得
  const state = Buildings.map((entity) => ({
    name: entity.name,
    show: entity.show, // 表示・非表示状態
    color: entity.model.color, // 現在の色
    hidden: hiddenBuildings.includes(entity) ? 1 : 0,
    revival: revivalBuildings.some((item) => item.entity === entity) ? 1 : 0,
  }));

  // 各ステップの状態を保存 (0~5として保存し、元データと1~5回目のデータとして扱う)
  predictionStates[step] = state;
  visibleEntitiesGroup[step] = visibleEntities;
  console.log(`ステップ${step}の状態を保存しました:`, state);
  console.log(`表示：${visibleEntities}`);
}

// 指定したステップの状態を復元する関数
function restorePredictionState(step) {
  if (!predictionStates[step]) {
    console.error(`ステップ${step + 1}の状態が保存されていません。`);
    return;
  }

  predictionStates[step].forEach((state) => {
    const entity = viewer.entities.values.find(
      (building) => building.name === state.name
    );
    if (entity) {
      entity.show = state.show; // 表示・非表示状態を復元
      entity.model.color = state.color; // 色を復元
      console.log("完了");
    }
  });
  console.log(`ステップ${step}の状態を復元しました`);
}

// 各ステップで保存する例
async function futurePrediction() {
  savePredictionState(0);
  // 予測ステップごとに処理を実行し、状態を保存
  for (let i = 1; i < 6; i++) {
    await applyDemolition(i); // applyDemolition の完了を待つ
    await applyRevival(i); // applyRevival の完了を待つ
    savePredictionState(i); // 現在のステップの状態を保存
  }
  console.log("全ての未来予測が完了しました");
}

// 人口政策による建物増減の変化関数

// 建物を削除する関数
function applyDemolition(i) {
  // 参照ファイル確認の為の変数
  const folderPath = modelState.getModelType();

  const Propotion = modelState.getModelPropotion();

  return new Promise((resolve) => {
    const demolitionPromises = [];

    viewer.entities.values.forEach((entity) => {
      if (!entity.show || hiddenBuildings.includes(entity)) return;

      if (entity.model) {
        const jsonPath = `3Dモデル/${folderPath}/${entity.name}/esriGeometryMultiPatch_ESRI3DO.json`;

        const demolitionPromise = fetch(jsonPath)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            let year;
            if (revivalBuildings.some((b) => b.entity.name === entity.name)) {
              const revivalBuilding = revivalBuildings.find(
                (b) => b.entity.name === entity.name
              );
              year = revivalBuilding.revivalYear;
            } else {
              year = data.attributes.k14_Nendo;
            }

            const { demolition } = getProbabilitiesByYear(year, i);

            if (Math.random() > demolition * Propotion[i]) {
              entity.show = false;
              hiddenBuildings.push(entity);

              // revivalBuildings に同じ名前の建物が存在する場合、それを削除
              const index = revivalBuildings.findIndex(
                (b) => b.entity.name === entity.name
              );
              if (index !== -1) {
                revivalBuildings.splice(index, 1); // 該当の entity を削除
              }
            }

            entity.model.color = getColorByYear(year, i);

            // if (temporaryRevivalBuildings.some(b => b.entity.name === entity.name)) {
            //     const revivalBuilding = temporaryRevivalBuildings.find(b => b.entity.name === entity.name);
            //     const revivalYear = revivalBuilding.revivalYear;
            //     entity.model.color = getColorByYear(revivalYear, i);
            // } else {
            //     entity.model.color = getColorByYear(year, i);
            // }
          })
          .catch((error) =>
            console.error(
              `Error loading JSON for ${entity.name}: ${error.message}`
            )
          );

        demolitionPromises.push(demolitionPromise);
      }
    });

    Promise.all(demolitionPromises).then(() => {
      console.log("Final Hidden Buildings List:", hiddenBuildings);
      resolve();
    });
  });
}

// 建物を復活させる関数
function applyRevival(i) {
  const Propotion = modelState.getModelPropotion();

  return new Promise((resolve) => {
    const revivalPromises = [];

    const correctPrediction =
      visibleEntitiesGroup[i - 1] / hiddenBuildings.length;

    for (let u = hiddenBuildings.length - 1; u >= 0; u--) {
      const building = hiddenBuildings[u];
      const jsonPath = `3Dモデル/${folderPath}/${building.name}/esriGeometryMultiPatch_ESRI3DO.json`;

      const revivalPromise = fetch(jsonPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const year = data.attributes.k14_Nendo;
          const { revival } = getProbabilitiesByYear(year, i);

          if (Math.random() < revival * correctPrediction * Propotion[i]) {
            building.show = true;
            const revivalYear = Math.floor(Math.random() * 6) + 2019 + 5 * i;
            building.model.color = getColorByYear(revivalYear, i);

            hiddenBuildings.splice(u, 1);
            revivalBuildings.push({
              entity: building,
              revivalYear: revivalYear,
            });
            temporaryRevivalBuildings.push({
              entity: building,
              revivalYear: revivalYear,
            });
          }
        })
        .catch((error) =>
          console.error(`Error loading JSON for ${building.name}:`, error)
        );

      revivalPromises.push(revivalPromise);
    }

    Promise.all(revivalPromises).then(() => {
      console.log(`Finished function ${i + 1} count`);
      console.log("Remaining Hidden Buildings:", hiddenBuildings);
      console.log("Remaining Revival Buildings:", revivalBuildings);
      resolve();
    });
  });
}
