"use strict";

const mymap = L.map("mapid").setView([0, 0], 12);
const selectCity = document.querySelector(".select__city");
const bikeroadsearch = document.querySelector(".bikeroadsearch");
const returnBtn = document.querySelector(".select__return");
const mapid = document.querySelector("#mapid");
const bikeRoute = document.querySelector(".searchresult");

$(mapid).hide();
$(returnBtn).hide();

function getmap() {
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

let cityBox = document.querySelector(".select__city");
// 獲取縣市名稱
axios({
  method: "get",
  url: "https://gist.motc.gov.tw/gist_api/V3/Map/Basic/City?$format=JSON",
  headers: GetAuthorizationHeader(),
})
  .then((response) => {
    //console.log(response.data);

    const cityData = response.data;

    let cityName = "";
    cityData.forEach((item) => {
      cityName += `<option  value="${item.City}">${item.CityName}</option>`;
    });
    cityBox.insertAdjacentHTML("beforeend", cityName);
  })
  .catch((error) => console.log("error", error));

cityBox.addEventListener("change", function () {
  getRoutesData(cityBox.value);
});

let routeData, serialNumber;
function getRoutesData(city) {
  axios({
    method: "get",
    url: `https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/${city}`,
    headers: GetAuthorizationHeader(),
  })
    .then((response) => {
      console.log("自行車的路線", response.data);
      routeData = response.data;

      let html = "";
      serialNumber = 0;
      routeData.forEach((item) => {
        html += `        <li class="result" id="${serialNumber++}">
        <h2 class="result__title h2-TC">${item.RouteName}</h2>
        <h5 class="result__distance h5-EN">${item.Direction ?? ""} ${
          item.CyclingLength
            ? (item.CyclingLength / 1000).toFixed(2) + " 公里"
            : ""
        } </h5>
        <div class="result__location">
          <img class="result__location-icon" src="img/location.svg" alt="" />
          <h5 class="h5-TC theme">${item.City ?? ""} ${item.Town ?? ""}</h5>
        </div>
      </li>`;
      });
      bikeRoute.insertAdjacentHTML("afterbegin", html);

      const result = document.querySelectorAll(".result");

      result.forEach(function (res) {
        res.addEventListener("click", function () {
          let value = res.getAttribute("id");
          let geo = routeData[value].Geometry;
          $(bikeroadsearch).hide();
          $(returnBtn).show();
          $(mapid).show();

          getmap();
          // 畫線的方法
          polyLine(geo);
        });
      });
    })
    .catch((error) => console.log("error", error));
}
// 畫出自行車的路線;

let myLayer = null;

function polyLine(geo) {
  // 建立一個 wkt 的實體
  const wicket = new Wkt.Wkt();
  const geojsonFeature = wicket.read(geo).toJson();
  let start = [geojsonFeature.coordinates[0][0]];
  let end = geojsonFeature.coordinates[0].slice(-1);

  setMarker(start, end);
  // 預設樣式
  // myLayer = L.geoJSON(geojsonFeature).addTo(mymap);

  const myStyle = {
    color: "#000000",
    weight: 3,
    opacity: 0.65,
    dashArray: "10 10 ",
  };
  const myLayer = L.geoJSON(geojsonFeature, {
    style: myStyle,
  }).addTo(mymap);

  myLayer.addData(geojsonFeature);
  // zoom the map to the layer
  mymap.fitBounds(myLayer.getBounds());
}

function mapInit() {
  mymap.eachLayer(function (layer) {
    if (myLayer > 0) {
      mymap.removeLayer(layer);
    }
    myLayer++;
  });

  $(mapid).hide();
  $(bikeroadsearch).show();
}
returnBtn.addEventListener("click", function () {
  mapInit();
});

selectCity.addEventListener("change", function () {
  mapInit();
});

function setMarker(start, end) {
  let point = [...start, ...end];

  let count = 0;
  point.forEach((item) => {
    // console.log(item.StationPosition.PositionLon, item.StationPosition.PositionLat)

    L.marker([item[1], item[0]], { icon: icon })
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
        `<h4 class="h3-EN  point">${count++ === 0 ? "始" : "終"}</h4>`
      )
      .openPopup();
  });
}

//標記 icon
let icon = L.icon({
  iconUrl: "img/Union2.png",

  iconSize: [36, 50], // size of the icon
  iconAnchor: [18, 50], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -30], // point from which the popup should open relative to the iconAnchor
});
