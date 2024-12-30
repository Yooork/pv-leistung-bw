let data;
let abstufungen;
let colors;
let anzAbstufungen = 6;
let map;
let geoJsonLayer;
const message = document.querySelector('.message');

document.addEventListener("DOMContentLoaded", () => {
    const overlay = createOverlay();
    document.body.appendChild(overlay);

    overlay.querySelector(".reload-button").addEventListener("click", async () => {
        try {
            data = await getData();
            updateAbstufungenAndColors();
            updateMap();
            updateLegend();
            showMessage('Die Daten wurden neu geladen!');
        } catch (error) {
            showMessage("Fehler beim neuladen der Daten:", error);
        }
    });

    loadDataAndMap();
});

async function getData() {
    try {
        const response = await fetch("http://127.0.0.1:5000");
        if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        showMessage("Bitte den Server starten!", error);
        return null;
    }
}

async function loadDataAndMap() {
    data = await getData();
    if (data) {
        updateAbstufungenAndColors();

        map = L.map('map').setView([48.791, 9.195], 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        geoJsonLayer = L.geoJSON(orte, { onEachFeature, style }).addTo(map);
        addLegend();
    }
}

function updateAbstufungenAndColors() {
    abstufungen = getAbstufung(anzAbstufungen);
    colors = generateColorGradient(anzAbstufungen);
}

function updateMap() {
    map.removeLayer(geoJsonLayer);
    geoJsonLayer = L.geoJSON(orte, { onEachFeature, style }).addTo(map);
}

function addLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = createLegend;
    legend.addTo(map);
}

function createOverlay() {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    const button = document.createElement("button");
    button.classList.add("reload-button");
    button.textContent = "Daten neu laden";

    overlay.appendChild(button);
    return overlay;
}

function createLegend() {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<strong class="legend-title">Bruttoleistung in Watt</strong>';

    abstufungen.forEach((grade, i) => {
        div.innerHTML += `
            <div class="legend-item">
                <i class="legend-icon" style="background:${colors[i]}"></i>
                <span class="legend-text">
                    ${formatNumberWithDots(grade)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1])}` : '+'}
                </span>
            </div>
        `;
    });

    div.innerHTML += `
        <div class="legend-controls">
            <button class="control-button" id="legend-plus">+</button>
            <button class="control-button" id="legend-minus">-</button>
        </div>
    `;

    addLegendControls(div);
    return div;
}

function addLegendControls(legendDiv) {
    const plusButton = legendDiv.querySelector('#legend-plus');
    const minusButton = legendDiv.querySelector('#legend-minus');

    plusButton.addEventListener('click', () => {
        if (anzAbstufungen < 15) {
            anzAbstufungen++;
            updateAbstufungenAndColors();
            updateMap();
            updateLegend();
        }
        else {
            showMessage('Die Anzahl der Abstufungen kann nicht weiter erhöht werden!');
        }
    });

    minusButton.addEventListener('click', () => {
        if (anzAbstufungen > 2) {
            anzAbstufungen--;
            updateAbstufungenAndColors();
            updateMap();
            updateLegend();
        }
        else {
            showMessage('Die Anzahl der Abstufungen kann nicht weiter reduziert werden!');
        }
    });
}

function updateLegend() {
    const legend = document.querySelector('.legend');
    if (legend) {
        legend.innerHTML = '';
        legend.innerHTML = '<strong class="legend-title">Bruttoleistung in Watt</strong>';

        abstufungen.forEach((grade, i) => {
            legend.innerHTML += `
                <div class="legend-item">
                    <i class="legend-icon" style="background:${colors[i]}"></i>
                    <span class="legend-text">
                        ${formatNumberWithDots(grade)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1])}` : '+'}
                    </span>
                </div>
            `;
        });

        legend.innerHTML += `
            <div class="legend-controls">
                <button class="control-button" id="legend-plus">+</button>
                <button class="control-button" id="legend-minus">-</button>
            </div>
        `;

        addLegendControls(legend);
    }
}

function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getColor(pv) {
    for (let i = anzAbstufungen - 1; i >= 0; i--) {
        if (pv >= abstufungen[i]) return colors[i];
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
    };
}

function generateColorGradient(steps) {
    return Array.from({ length: steps }, (_, i) => {
        const lightness = 90 - (80 * i) / (steps - 1); // Von 10% (dunkel) bis 90% (hell)
        return `hsl(240, 100%, ${lightness}%)`; // 240 ist der Farbton für Blau
    });
}

function onEachFeature(feature, layer) {
    const pPerPLZ = getPvPerPLZ(feature.properties.plz_code);
    const formatted = formatNumberWithDots(pPerPLZ);
    layer.bindPopup(`
        <div class="popup-title">${feature.properties.plz_code} ${feature.properties.plz_name}</div>
        <div class="popup-subtitle">Bruttoleistung: ${formatted} Watt</div>
    `);
}

function getPvPerPLZ(plz) {
    const datax = data.PLZ_PV.find(item => item.PLZ == plz);
    return datax ? datax.PV : 0;
}

function getAbstufung(anzAbstufungen) {
    let max = 0;
    for (let datax of data.PLZ_PV) {
        if (datax.PV > max) {
            max = datax.PV;
        }
    }

    const abstufungen = [];
    for (let i = 0; i < anzAbstufungen; i++) {
        let abstufung = Math.round((max / anzAbstufungen) * i);
        abstufung = Math.ceil(abstufung / 10000) * 10000;
        // wollen wir das?
        abstufungen.push(abstufung);
    }

    return abstufungen;
}

function showMessage(messageText, error = '') {
    if (!error) {
        message.textContent = messageText;
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }
    else {
        message.textContent = messageText + " " + error;
        message.style.backgroundColor = '#f44336';
    }

    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}