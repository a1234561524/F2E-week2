"use strict";
let rentBtn = document.querySelector(".rent-btn");
let returnBtn = document.querySelector(".return-btn");
let btnBackground = document.querySelector(".switch");
let bikeIcon = document.querySelector(".bike");
let parkingIcon = document.querySelector(".parking");
let bikeNumber = document.querySelector(".number");

const mymap = L.map("mapid").setView([0, 0], 13);

L.tileLayer(
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    accessToken:
      "pk.eyJ1IjoicGlnMTUyNDgiLCJhIjoiY2t3MGpvb3loMW45bTJubzF4N3l5aWczbyJ9.voTOzFZD6fNd-xerPABcPQ",
  }
).addTo(mymap);

let myposition = L.icon({
  iconUrl: "img/myposition.gif",

  iconSize: [84], // size of the icon
  iconAnchor: [42, 64], // point of the icon which will correspond to marker's location
});

// 使用 navigator web api 獲取當下位置(經緯度)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const longitude = position.coords.longitude; // 經度
      const latitude = position.coords.latitude; // 緯度
      //console.log(longitude);
      //console.log(latitude);

      // 重新設定 view 的位置
      mymap.setView([latitude, longitude], 15);

      L.marker([latitude, longitude], { icon: myposition }).addTo(mymap);

      // 將經緯度當作參數傳給 getData 執行
      getStationData(longitude, latitude);
    },
    // 錯誤訊息
    function (e) {
      const msg = e.code;
      const dd = e.message;
      console.error(msg);
      console.error(dd);
    }
  );
}

// 串接附近的自行車租借站位資料
let data = [];
function getStationData(longitude, latitude) {
  axios({
    method: "get",
    // url: 'https://ptx.transportdata.tw/MOTC/v2/Bike/Station/Kaohsiung',
    url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Station/NearBy?$spatialFilter=nearby(${latitude},${longitude},500)`,
    headers: GetAuthorizationHeader(),
  })
    .then((response) => {
      console.log("租借站位資料", response);
      data = response.data;

      getAvailableData(longitude, latitude);
    })
    .catch((error) => console.log("error", error));
}
// 串接附近的即時車位資料
let filterData = [];
let filterDataUID = new Set();
function getAvailableData(longitude, latitude) {
  axios({
    method: "get",
    // url: 'https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/Kaohsiung',
    url: `https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/NearBy?$spatialFilter=nearby(${latitude},${longitude},500)`,
    headers: GetAuthorizationHeader(),
  })
    .then((response) => {
      console.log("車位資料", response);
      const availableData = response.data;

      // 比對
      availableData.forEach((availableItem) => {
        data.forEach((stationItem) => {
          if (
            availableItem.StationUID === stationItem.StationUID &&
            !filterDataUID.has(availableItem.StationUID)
          ) {
            availableItem.StationName = stationItem.StationName;
            availableItem.StationAddress = stationItem.StationAddress;
            availableItem.StationPosition = stationItem.StationPosition;
            filterData.push(availableItem);
            filterDataUID.add(availableItem.StationUID);
          }
        });
      });
      console.log("filterData", filterData);

      setMarker();
    })
    .catch((error) => console.log("error", error));
}
// API 驗證用
function GetAuthorizationHeader() {
  var AppID = "2af5643ac6c948c4b206225d87f27506";
  var AppKey = "5ewryF_mUSxIGukfP-b5CyCnE-o";

  var GMTString = new Date().toGMTString();
  var ShaObj = new jsSHA("SHA-1", "TEXT");
  ShaObj.setHMACKey(AppKey, "TEXT");
  ShaObj.update("x-date: " + GMTString);
  var HMAC = ShaObj.getHMAC("B64");
  var Authorization =
    'hmac username="' +
    AppID +
    '", algorithm="hmac-sha1", headers="x-date", signature="' +
    HMAC +
    '"';

  return {
    Authorization: Authorization,
    "X-Date": GMTString,
  };
}

// 標記 icon
function setMarker() {
  let myLayer = 0;
  mymap.eachLayer(function (layer) {
    if (myLayer > 1) {
      mymap.removeLayer(layer);
    }
    myLayer++;
  });
  filterData.forEach((item) => {
    // console.log(item.StationPosition.PositionLon, item.StationPosition.PositionLat)
    L.marker(
      [item.StationPosition.PositionLat, item.StationPosition.PositionLon],
      { icon: icon }
    )
      .addTo(mymap)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          offset: [3.5, 36],
          closeButton: false,
        })
      )
      .setPopupContent(
        `<h4 class="h3-EN  number ${state === "rent" ? "" : "numberColor"}">${
          state === "rent" ? item.AvailableRentBikes : item.AvailableReturnBikes
        }</h4>`
      )
      .openPopup();
  });
}

let iconRent = L.icon({
  iconUrl: "img/Union1.png",

  iconSize: [36, 50], // size of the icon
  iconAnchor: [18, 50], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -30], // point from which the popup should open relative to the iconAnchor
});

let iconReturn = L.icon({
  iconUrl: "img/Union2.png",

  iconSize: [36, 50], // size of the icon
  iconAnchor: [18, 50], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -30], // point from which the popup should open relative to the iconAnchor
});

let icon = iconRent;
function btnSwitch() {
  if (state === "rent") {
    rentBtn.classList.add("btn-on");
    rentBtn.classList.remove("btn-off");
    returnBtn.classList.add("btn-off");
    returnBtn.classList.remove("btn-on");
    btnBackground.style.backgroundColor = "#fff";
    bikeIcon.src = "img/bike.svg";
    parkingIcon.src = "img/parking.svg";
  } else {
    rentBtn.classList.add("btn-off");
    rentBtn.classList.remove("btn-on");
    returnBtn.classList.add("btn-on");
    returnBtn.classList.remove("btn-off");
    btnBackground.style.backgroundColor = "#000";
    bikeIcon.src = "img/bike2.svg";
    parkingIcon.src = "img/parking2.svg";
  }
  setMarker();
}
let state = "rent";
rentBtn.addEventListener("click", function () {
  state = "rent";
  icon = iconRent;
  btnSwitch();
});

returnBtn.addEventListener("click", function () {
  state = "return";
  icon = iconReturn;
  btnSwitch();
});

mymap.addEventListener("click", function (e) {
  getStationData(e.latlng["lng"], e.latlng["lat"]);
});
