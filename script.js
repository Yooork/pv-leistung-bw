var data;
var abstufungen;
const anzAbstufungen = 6;

(async () => {
     data = await getData();
    console.log("Erhaltene Daten:", data?.PLZ_PV); // Auf PLZ_PV zugreifen
})()


setTimeout(() => {

    abstufungen=getAbstufung(anzAbstufungen);



var map = L.map('map').setView([48.791, 9.195], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.geoJSON(orte, {onEachFeature: onEachFeature, style: style}).addTo(map);


var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'),
        grades = [ 0, 1900, 1920, 1940, 1960, 1980, 2000],
        labels = [];

    div.innerHTML += '<strong>Baujahr</strong><br>';
    div.innerHTML += '<i style="background:black; display: inline-block; width: 18px; height: 18px;margin-right: 8px;border-radius: 3px;"></i> ' +
    'undefined<br>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i]) + '; display: inline-block; width: 18px; height: 18px;margin-right: 8px;border-radius: 3px;"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);

}, 2000);

function getColor(pv) {
    return pv > abstufungen[anzAbstufungen-1] ? '#00FF00' :
    pv > abstufungen[anzAbstufungen-2] ? '#80FF00' :
    pv > abstufungen[anzAbstufungen-3] ? '#FFFF00' :
    pv > abstufungen[anzAbstufungen-4] ? '#FFC000' : 
    pv > abstufungen[anzAbstufungen-5] ? '#FF8000' :
    pv > 0 ? '#FF0000' : (() => { 
        console.log('PV0:', pv); 
        return '#000000'; 
    })();

}

function style(feature) {
    console.log(getPvPerPLZ(feature.properties.plz_code));
    return {
        fillColor: getColor(parseInt(getPvPerPLZ(feature.properties.plz_code))),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.95
    }
}

function onEachFeature(feature, layer) {
    layer.bindPopup(
        '<h4>Year of construction: ' +  
        feature.properties.plz_name + ' </h4>');
}

function getPvPerPLZ(plz){
    for(let datax of data.PLZ_PV){
        if(datax.PLZ==plz){
            return datax.PV
        }
    }
}

function getAbstufung(numberOfAbstufung){
    var min = data.PLZ_PV[0];
    var max = 0;
    for(let datax of data.PLZ_PV){
        if(datax.PV>max){
            max=datax.PV;
            console.log(datax.PV,'dd')
        }
    } 

    var abstufungen=[];

    for(var i=0;i<=numberOfAbstufung;i++){
        abstufungen[i]=(max/numberOfAbstufung)*i;
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
        console.log("Abgerufene Daten:", data);
        return data; // Die JSON-Daten werden zurückgegeben
    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        return null; // Gib im Fehlerfall `null` zurück
    }
}



