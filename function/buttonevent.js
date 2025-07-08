// 出力エリアを作成（HTML内のbodyタグ内に追加しても良い）
const outputDiv = document.createElement("div");
outputDiv.id = "output";
outputDiv.style.position = "absolute";
outputDiv.style.top = "60px"; // ボタンの下に配置
outputDiv.style.left = "50%"; // 左からの距離
outputDiv.style.transform = "translate(-50%, -50%)"; // 中央に揃える
outputDiv.style.zIndex = "10"; // Cesiumのキャンバスより上に表示
outputDiv.style.background = "rgba(255, 255, 255, 0.8)"; // 半透明の背景
outputDiv.style.padding = "15px"; // 内側の余白
outputDiv.style.borderRadius = "5px"; // 角を丸く
outputDiv.style.fontSize = "25px"; // フォントサイズを大きく
outputDiv.style.textAlign = "center"; // テキストを中央揃え
outputDiv.style.fontFamily = "Arial, sans-serif";
document.body.appendChild(outputDiv); // bodyに追加

// ボタンを押した回数をカウントする変数
let clickCount = 0;

document.addEventListener("DOMContentLoaded", function () {
  // ボタンが押された時のイベントリスナーを設定
  document
    .getElementById("futurePrediction")
    .addEventListener("click", async function () {
      clickCount = 0;
      document.getElementById("thunami-scale").style.display = "none";
      document.getElementById("sindo-scale").style.display = "none";

      thunamiReset();
      earthquakeReset();
      restorePredictionState(0);

      predictionStates = [];
      hiddenBuildings = []; // 削除された建物を管理するリスト
      revivalBuildings = []; //復活した建物を管理するリスト
      temporaryRevivalBuildings = []; //復活した建物の一時管理するリスト

      // futurePrediction 関数の非同期処理が完了した後に実行したい処理をここに記述
      await futurePrediction()
        .then(() => {
          // const entityPromises = Buildings.forEach(building =>{
          //     const entity = viewer.entities.values.find(entity => entity.name === building.name);
          //     if(entity){
          //         entity.show = building.show;
          //         entity.model.color = building.model.color;
          //     }
          // } )

          Promise.all(entityPromises)
            .then(() => {
              // すべての建物の再表示が完了した後に、状態を復元
              restorePredictionState(0);
            })
            .catch((error) => {
              console.error(
                "エンティティの追加中にエラーが発生しました:",
                error
              );
            });
        })
        .catch((error) => {
          console.error("予測処理にエラーが発生しました:", error);
        });

      runDemolitionRevival.disabled = false;
      undoButton.disabled = false;

      const resultYear = 2025 + clickCount * 5;
      const visibleEntityCount = viewer.entities.values
        .slice()
        .reverse()
        .filter(
          (entity) => Buildings.includes(entity) && entity.show === true
        ).length;
      outputDiv.innerHTML = `施策:${modelState.getModelType()}　　年度:${resultYear} 　　建物数:${visibleEntityCount}`;
      console.log("表示", visibleEntitiesGroup);
    });

  document
    .getElementById("runDemolitionRevival")
    .addEventListener("click", async function () {
      //ボタンを押したら5年後の将来予測結果を表示する
      clickCount++;

      document.getElementById("thunami-scale").style.display = "none";
      document.getElementById("sindo-scale").style.display = "none";

      thunamiReset();
      earthquakeReset();

      if (clickCount < 6) {
        // // すべてのエンティティを削除
        // viewer.entities.values.slice().reverse().filter(entity => Buildings.includes(entity)).forEach(entity => {
        //     viewer.entities.remove(entity)
        // });

        await Promise.all(entityPromises)
          .then(() => {
            // すべての建物の再表示が完了した後に、状態を復元
            restorePredictionState(clickCount);
          })
          .catch((error) => {
            console.error("エンティティの追加中にエラーが発生しました:", error);
          });

        const resultYear = 2025 + clickCount * 5;
        const visibleEntityCount = viewer.entities.values
          .slice()
          .reverse()
          .filter(
            (entity) => Buildings.includes(entity) && entity.show === true
          ).length;
        outputDiv.innerHTML = `施策:${modelState.getModelType()}　　年度:${resultYear} 　　建物数:${visibleEntityCount}`;
      } else {
        outputDiv.innerText = "Can't go more future";
      }
    });

  // 戻るボタンのイベントリスナーを設定
  document
    .getElementById("undoButton")
    .addEventListener("click", async function () {
      clickCount--;

      document.getElementById("thunami-scale").style.display = "none";
      document.getElementById("sindo-scale").style.display = "none";

      thunamiReset();
      earthquakeReset();

      if (clickCount >= 0) {
        await Promise.all(entityPromises)
          .then(() => {
            // すべての建物の再表示が完了した後に、状態を復元
            restorePredictionState(clickCount);
          })
          .catch((error) => {
            console.error("エンティティの追加中にエラーが発生しました:", error);
          });

        const resultYear = 2025 + clickCount * 5;
        const visibleEntityCount = viewer.entities.values
          .slice()
          .reverse()
          .filter(
            (entity) => Buildings.includes(entity) && entity.show === true
          ).length;
        outputDiv.innerHTML = `施策:${modelState.getModelType()}　　年度:${resultYear} 　　建物数:${visibleEntityCount}`;
      } else {
        outputDiv.innerText = "Can't go back anymore";
      }
    });

  // 津波後のモデルを表示
  document
    .getElementById("thunamiPrediction")
    .addEventListener("click", async function () {
      earthquakeReset();

      document.getElementById("thunami-scale").style.display = "block";
      document.getElementById("sindo-scale").style.display = "none";

      const thunamiEntityCount = await thunamiPrediction.fetchData();

      // 津波浸水深表示
      await thunamiBunpuhyouzi.fetchData();

      const resultYear = 2025 + clickCount * 5;
      const visibleEntityCount = viewer.entities.values
        .slice()
        .reverse()
        .filter(
          (entity) => Buildings.includes(entity) && entity.show === true
        ).length;
      outputDiv.innerHTML = `施策:${modelState.getModelType()}　　年度:${resultYear} 　　建物数:${visibleEntityCount}<br>津波流失＋全壊建物数:${thunamiEntityCount}`;
    });

  //政策によるモデルの切り替え
  document
    .getElementById("changeModel")
    .addEventListener("click", async function () {
      clickCount = 0;
      runDemolitionRevival.disabled = true;
      undoButton.disabled = true;

      document.getElementById("thunami-scale").style.display = "none";
      document.getElementById("sindo-scale").style.display = "none";

      thunamiReset();
      earthquakeReset();

      modelState.modelNumberCount();
      await changeModel();
    });

  //地震後のモデル表示
  document
    .getElementById("earthquakePrediction")
    .addEventListener("click", async function () {
      document.getElementById("thunami-scale").style.display = "none";
      document.getElementById("sindo-scale").style.display = "block";

      thunamiReset();

      const earthquakeEntityCount = await earthquakePrediction2.fetchData2();

      // 震度分布表示
      // await sindoBunpuhyouzi.fetchData();

      const resultYear = 2025 + clickCount * 5;
      const visibleEntityCount = viewer.entities.values
        .slice()
        .reverse()
        .filter(
          (entity) => Buildings.includes(entity) && entity.show === true
        ).length;
      outputDiv.innerHTML = `施策:${modelState.getModelType()}　　年度:${resultYear} 　　建物数:${visibleEntityCount}<br>地震全壊建物数:${earthquakeEntityCount}`;
    });

  let tatemono = [];
  let thunami = [];
  let zisin = [];
  let kaiseki = { tatemono, thunami, zisin };

  async function zisinkaiseki() {
    document.getElementById("thunami-scale").style.display = "none";
    document.getElementById("sindo-scale").style.display = "block";

    thunamiReset();

    const earthquakeEntityCount = await earthquakePrediction.fetchData();
    kaiseki.zisin.push(earthquakeEntityCount);
  }

  async function thunamikaiseki() {
    earthquakeReset();

    document.getElementById("thunami-scale").style.display = "block";
    document.getElementById("sindo-scale").style.display = "none";

    const thunamiEntityCount = await thunamiPrediction.fetchData();
    kaiseki.thunami.push(thunamiEntityCount);
  }

  async function newstage(i) {
    document.getElementById("thunami-scale").style.display = "none";
    document.getElementById("sindo-scale").style.display = "none";
    clickCount = i;

    thunamiReset();
    earthquakeReset();
    await Promise.all(entityPromises)
      .then(() => {
        // すべての建物の再表示が完了した後に、状態を復元
        restorePredictionState(i);
      })
      .catch((error) => {
        console.error("エンティティの追加中にエラーが発生しました:", error);
      });
  }
  async function syouraiyosoku() {
    thunamiReset();
    earthquakeReset();
    restorePredictionState(0);

    predictionStates = [];
    hiddenBuildings = []; // 削除された建物を管理するリスト
    revivalBuildings = []; //復活した建物を管理するリスト
    temporaryRevivalBuildings = []; //復活した建物の一時管理するリスト

    // futurePrediction 関数の非同期処理が完了した後に実行したい処理をここに記述
    await futurePrediction()
      .then(() => {
        // const entityPromises = Buildings.forEach(building =>{
        //     const entity = viewer.entities.values.find(entity => entity.name === building.name);
        //     if(entity){
        //         entity.show = building.show;
        //         entity.model.color = building.model.color;
        //     }
        // } )

        Promise.all(entityPromises)
          .then(() => {
            // すべての建物の再表示が完了した後に、状態を復元
            restorePredictionState(0);
          })
          .catch((error) => {
            console.error("エンティティの追加中にエラーが発生しました:", error);
          });
      })
      .catch((error) => {
        console.error("予測処理にエラーが発生しました:", error);
      });
  }

  async function kaisekiten() {
    for (let i = 1; i < 11; i++) {
      await syouraiyosoku();
      const visibleEntityCount = viewer.entities.values
        .slice()
        .reverse()
        .filter(
          (entity) => Buildings.includes(entity) && entity.show === true
        ).length;
      kaiseki.tatemono.push(visibleEntityCount);
      clickCount = 0;

      await thunamikaiseki();
      await zisinkaiseki();
      for (let u = 1; u < 6; u++) {
        await newstage(u);
        const visibleEntityCount = viewer.entities.values
          .slice()
          .reverse()
          .filter(
            (entity) => Buildings.includes(entity) && entity.show === true
          ).length;
        kaiseki.tatemono.push(visibleEntityCount);

        await thunamikaiseki();
        await zisinkaiseki();
      }
    }
    console.log(kaiseki);
  }

  // document.getElementById('kaisekibutton').addEventListener('click', async function() {
  //     kaisekiten()
  // })

  document
    .getElementById("screenshotButton")
    .addEventListener("click", async function () {
      let count = 0;
      this.style.display = "none"; // ボタン自体を非表示にする

      await clickButtonAndWait1("futurePrediction");
      await takeHighResScreenshot(viewer, 0, count);
      count = 1;
      await clickButtonAndWait2("earthquakePrediction");
      await takeHighResScreenshot(viewer, 0, count);
      count = 2;
      await clickButtonAndWait2("thunamiPrediction");
      await takeHighResScreenshot(viewer, 0, count);

      for (let i = 1; i < 6; i++) {
        count = 0;
        await clickButtonAndWait2("runDemolitionRevival");
        await takeHighResScreenshot(viewer, i, count);
        count = 1;
        await clickButtonAndWait2("earthquakePrediction");
        await takeHighResScreenshot(viewer, i, count);
        count = 2;
        await clickButtonAndWait2("thunamiPrediction");
        await takeHighResScreenshot(viewer, i, count);
      }

      this.style.display = "block";
    });

  // document.getElementById('slider').addEventListener('click', async function() {

  //     let slider = document.getElementById('slider');  // sliderを取得
  //     let status = 0;

  //     status = status === 0 ? 1 : 0;
  //     slider.classList.toggle('active');
  //     slider.querySelector('span').textContent = status === 1 ? 'はい' : 'いいえ';
  //     return status;

  // });
});
