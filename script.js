var data;
var abstufungen;
var colors;
const anzAbstufungen = 6;  //Ändern um Granulatität der Skala anzupassen

//TODO: abstufungen per feld ändern bzw button und seite aktualisieren button
//      legende mit tausender punkten

(async () => {
data = await getData();
abstufungen=getAbstufung(anzAbstufungen);
colors = generateColorGradient(anzAbstufungen);

var map = L.map('map').setView([48.791, 9.195], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.geoJSON(orte, {onEachFeature: onEachFeature, style: style}).addTo(map);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'),
        grades = abstufungen,
        labels = [];

    div.innerHTML += '<strong>Bruttoleistung in Watt</strong><br>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '; display: inline-block; width: 18px; height: 18px;margin-right: 8px;border-radius: 3px;"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
})()

function getColor(pv) {
    for(let i = anzAbstufungen-1; i>=0;i--){
        if(pv>=abstufungen[i])return colors[i];
    }
    return '#000000';
}

function style(feature) {
    return {
        fillColor: getColor(parseInt(getPvPerPLZ(feature.properties.plz_code))),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.95
    }
}

function generateColorGradient(steps) {
    const colors = [];
    
    for (let i = 0; i < steps; i++) {
      const hue = (i * 120) / (steps - 1); 
      const color = `hsl(${hue}, 100%, 50%)`;
      colors.push(color);
    }
  
    return colors;
}

function onEachFeature(feature, layer) {
    pPerPLZ=getPvPerPLZ(feature.properties.plz_code);
    formatted = pPerPLZ.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    layer.bindPopup(
        '<p><h4>' + feature.properties.plz_code+' '+feature.properties.plz_name + ' </h4></p>'+
        '<p><h5>Bruttoleistung: '+ formatted+' Watt</h4></p>');
}

function getPvPerPLZ(plz){
    for(let datax of data.PLZ_PV){
        if(datax.PLZ==plz){
            return datax.PV
        }
    }
}

function getAbstufung(numberOfAbstufung){
    var max = 0;
    for(let datax of data.PLZ_PV){
        if(datax.PV>max){
            max=datax.PV;
            //runde auf nächste glatte zahl
        }
    } 

    var abstufungen=[];

    for(var i=0;i<=numberOfAbstufung-1;i++){
        abstufungen[i]=parseFloat((max / numberOfAbstufung) * i).toFixed(0);
    }
    
    return abstufungen;

}

async function getData() {
    const url = "http://127.0.0.1:5000";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        const data = await response.json();
        return data; 
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        return null;
    }
}
