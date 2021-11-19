"use strict";

const mymap = L.map("mapid").setView([0, 0], 12);
$("#mapid").hide();
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

const bikeRoute = document.querySelector("#bikeRoute");
function getRoutesData(city) {
  axios({
    method: "get",
    url: `https://ptx.transportdata.tw/MOTC/v2/Cycling/Shape/${city}`,
    headers: GetAuthorizationHeader(),
  })
    .then((response) => {
      console.log("自行車的路線", response);
      const routeData = response.data;

      let str = "";
      routeData.forEach((item) => {
        str += `<option value="${item.RouteName}"><h5 class="h5-TC">${item.RouteName}</h5></option>`;
      });
      bikeRoute.innerHTML = str;

      bikeRoute.addEventListener("change", (e) => {
        const value = e.target.value;

        if (myLayer) {
          // console.log(myLayer);
          mymap.removeLayer(myLayer);
        }

        routeData.forEach((item) => {
          if (item.RouteName === value) {
            let geo = item.Geometry;
            console.log("geo", geo);

            getmap();
            // 畫線的方法
            polyLine(geo);
          }
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
  console.log("geojsonFeature", geojsonFeature);
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
