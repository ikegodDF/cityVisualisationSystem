const modal = document.getElementById("modal");
const btn = document.getElementById("openTokenModal");
const span = document.getElementsByClassName("close")[0];
const tokenInput = document.getElementById("tokenInput");
const saveToken = document.getElementById("saveToken");

btn.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

saveToken.onclick = function () {
  const token = tokenInput.value;
  if (token) {
    localStorage.setItem("cesiumToken", token);
    window.location.href = "cesium.html";
  } else {
    alert("トークンを入力してください");
  }
};
