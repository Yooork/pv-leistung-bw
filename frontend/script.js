let data;
let abstufungen;
let colors;
let anzAbstufungen = 6;
let map;
let geoJsonLayer;
let barrierFree = false;
let barrierButtonImgSrc = 'img/colorblind_off.png';
let burgerMenu = false;
let burgerMenuButtonImg = 'img/burger_menu.png';
const message = document.querySelector('.message');
let perArea = false;
let quantil = false;
let areaIcon = 'bolt';
let quantilIcon = 'menu';
let eyeIcon = 'visibility_off';

document.addEventListener("DOMContentLoaded", () => {
    const overlay = createOverlay();
    const menu = createMenu();
    document.body.appendChild(overlay);
    document.body.appendChild(menu);


    overlay.querySelector(".reload-button").addEventListener("click", async () => {
        try {
            data = await getData();
            updateAbstufungenAndColors();
            updateMap();
            updateLegend();
            showMessage('Die Daten wurden neu geladen!');
        } catch (error) {
            showMessage("Fehler beim Neuladen der Daten:", error);
        }
    });

    loadDataAndMap();
});

async function getData() {
    try {
        const response = await fetch("http://127.0.0.1:5000", { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        showMessage("Bitte den Server starten!", error);
        sleep(500);
    }
}

async function loadDataAndMap() {
    data = await getData();
    if (data) {
        updateAbstufungenAndColors();
        createBurgerMenu();
        map = L.map('map').setView([48.791, 9.195], 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        geoJsonLayer = L.geoJSON(orte, { onEachFeature, style }).addTo(map);
        addLegend();
    }
}

function createMenu() {
    const menu = document.createElement("div");
    const menuMain = document.createElement("div");
    const menuFog = document.createElement("div");
    const menuIcon = document.createElement("img");
    menuIcon.src = "img/solarWhite.png";
    const menuTitle = document.createElement("div");
    menuTitle.textContent = "PV-Leistungen in Baden-Württemberg";
    document.body.appendChild(menuTitle);


    menu.classList.add("menu");
    menuMain.classList.add("menuMain");
    menuFog.classList.add("menuFog");
    menuIcon.classList.add("menuIcon");
    menuTitle.classList.add("menuTitle");

    menu.appendChild(menuMain);
    menuMain.appendChild(menuIcon);
    menu.appendChild(menuFog);
    return menu;
}

function createBurgerMenu() {
    const menu = document.createElement("div");
    menu.classList.add("burgerMenu");

    const menuMain = document.createElement("div");
    menuMain.classList.add("burgerMenu-main");

    const menuList = document.createElement("ul");

    const searchBar = document.createElement("input");
    searchBar.placeholder = "Suche nach...";
    searchBar.addEventListener("keyup", () => {
        var filter = searchBar.value.toUpperCase();
        var lis = menuList.querySelectorAll("li");
        for (var i = 0; i < lis.length; i++) {
            var name = lis[i].textContent;
            if (name.toUpperCase().includes(filter))
                lis[i].style.display = 'list-item';
            else
                lis[i].style.display = 'none';
        }
    });

    const menuButtonIcon = document.createElement("img");
    menuButtonIcon.classList.add("buttonImage");
    menuButtonIcon.src = 'img/burger_menu.png';

    const menuButton = document.createElement("button");
    menuButton.classList.add("burgerMenu-button");
    menuButton.addEventListener("click", () => {
        menuMain.classList.toggle("open");
        burgerMenu = !burgerMenu;
        gsap.to(menuButtonIcon, {
            duration: 0.2,
            opacity: 0,
            onComplete: () => {
                menuButtonIcon.src = burgerMenu ? 'img/close.png' : 'img/burger_menu.png';
                gsap.to(menuButtonIcon, {
                    duration: 0.2,
                    opacity: 1,
                });
            }
        });

        document.getElementsByClassName("legend")[0].classList.toggle("open");
    });

    // Populate the menu list
    if (data && data.PLZ_PV) {
        for (let datax of data.PLZ_PV) {
            const feature = orte.features.find(item => item.properties?.name === datax.PLZ);
            if (feature?.properties?.plz_name) {
                const listItem = document.createElement("li");
                listItem.innerHTML = `<div class="liOver">${datax.PLZ} ${feature.properties.plz_name}</div><div class="liUnder"><span class="material-symbols-outlined icon_in_search">bolt</span>${formatNumberWithDots(datax.PV)} kW &nbsp;&nbsp; <span class="material-symbols-outlined icon_in_search">pageless</span> ${getPVPerSqmPerPLZ(datax.PLZ).toFixed(0) / 1000} W/qm</div>`;
                listItem.addEventListener("click", () => {
                    highlightPLZ(datax.PLZ);
                });
                menuList.appendChild(listItem);
            }
        }
    }

    menuButton.appendChild(menuButtonIcon);
    menuMain.appendChild(menuList);
    menuMain.appendChild(searchBar);
    menu.appendChild(menuButton);
    menu.appendChild(menuMain);
    document.body.appendChild(menu);
}

function highlightPLZ(plz) {
    geoJsonLayer.eachLayer(layer => {
        if (layer.feature.properties.plz_code === plz) {
            layer.setStyle({
                weight: 3,
                fillOpacity: 0.7
            });

            // Center map on the selected PLZ
            const bounds = layer.getBounds();
            map.fitBounds(bounds);

            // Show popup
            layer.openPopup();
        } else {
            // Reset other styles
            layer.setStyle(style(layer.feature));
        }
    });
}

function updateAbstufungenAndColors() {
    abstufungen = quantil ? getAbstufungenQuantile(anzAbstufungen, perArea) : getAbstufungen(anzAbstufungen, perArea);
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
    button.textContent = "↻";
    button.title = "Daten erneut laden"

    overlay.appendChild(button);
    return overlay;
}

function createLegend() {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = perArea ? '<strong class="legend-title">Bruttoleistung pro Fläche</strong>' : '<strong class="legend-title">Bruttoleistung</strong>'; //dynamic for the different adjustments
    div.innerHTML += quantil ? '<strong class="legend-subtitle">Bruttoleistung pro Fläche</strong>' : '<strong class="legend-subtitle"></strong>';

    abstufungen.forEach((grade, i) => {
        if (perArea) {
            div.innerHTML += `
            <div class="legend-item">
                <i class="legend-icon" style="background:${colors[i]}"></i>
                <span class="legend-text">
                    ${formatNumberWithDots(grade / 1000)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1] / 1000)} W/qm` : '+ W/qm'}
                </span>
            </div>
        `;
        } else {
            div.innerHTML += `
            <div class="legend-item">
                <i class="legend-icon" style="background:${colors[i]}"></i>
                <span class="legend-text">
                    ${formatNumberWithDots(grade)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1])} kW` : '+ kW'}
                </span>
            </div>
        `;
        }
    });

    div.innerHTML += `
        <div class="legend-controls">
            <button class="control-button" id="legend-area"><span class="material-symbols-outlined">${areaIcon}</span></button>
            <button class="control-button" id="legend-quantil"><span class="material-symbols-outlined">${quantilIcon}</span></button>
            <button class="control-button" id="legend-plus"><span class="material-symbols-outlined">add</span></button>
            <button class="control-button" id="legend-minus"><span class="material-symbols-outlined">remove</span></button>
            <button class="control-button" id="legend-barrier"><span class="material-symbols-outlined">${eyeIcon}</span></button>
        </div>
    `;
    addLegendControls(div);
    return div;
}

function addLegendControls(legendDiv) {
    const plusButton = legendDiv.querySelector('#legend-plus');
    const minusButton = legendDiv.querySelector('#legend-minus');
    const barrierButton = legendDiv.querySelector('#legend-barrier');
    const areaButton = legendDiv.querySelector('#legend-area');
    const quantilButton = legendDiv.querySelector('#legend-quantil');
    plusButton.title = "Abstufungen erhöhen";
    minusButton.title = "Abstufungen verringern";
    barrierButton.title = "Barrierefreier Modus";
    areaButton.title = "Toggle per Area";
    quantilButton.title = "Toggle Quantilskala"

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

    barrierButton.addEventListener('click', () => {
        barrierFree = !barrierFree;
        eyeIcon = (eyeIcon === 'visibility') ? 'visibility_off' : 'visibility';
        updateAbstufungenAndColors();
        updateMap();
        updateLegend();
    });

    areaButton.addEventListener('click', () => {
        areaIcon = (areaIcon === 'bolt') ? 'pageless' : 'bolt';

        perArea = !perArea;
        updateAbstufungenAndColors();
        updateMap();
        updateLegend();
    });

    quantilButton.addEventListener('click', () => {
        quantilIcon = (quantilIcon === 'sort') ? 'menu' : 'sort';
        quantil = !quantil;
        updateAbstufungenAndColors();
        updateMap();
        updateLegend();
    });
}

function updateLegend() {
    const legend = document.querySelector('.legend');
    if (legend) {
        legend.innerHTML = '';
        legend.innerHTML = perArea ? '<strong class="legend-title">Bruttoleistung pro Fläche</strong>' : '<strong class="legend-title">Bruttoleistung</strong>'; //dynamic for the different adjustments
        legend.innerHTML += quantil ? '<weak class="legend-subtitle">Abstufung entspricht ' + (Math.round((100 / anzAbstufungen) * 100) / 100) + ' % der Werte.</weak>' : '<strong class="legend-subtitle"></strong>';

        abstufungen.forEach((grade, i) => {
            if (perArea) {
                legend.innerHTML += `
                <div class="legend-item">
                    <i class="legend-icon" style="background:${colors[i]}"></i>
                    <span class="legend-text">
                        ${formatNumberWithDots(grade / 1000)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1] / 1000)} W/qm` : '+ W/qm'}
                    </span>
                </div>
            `;
            } else {
                legend.innerHTML += `
                <div class="legend-item">
                    <i class="legend-icon" style="background:${colors[i]}"></i>
                    <span class="legend-text">
                        ${formatNumberWithDots(grade)} ${abstufungen[i + 1] ? ` &ndash; ${formatNumberWithDots(abstufungen[i + 1])} kW` : '+ kW'}
                    </span>
                </div>
            `;
            }
        });

        legend.innerHTML += `
           <div class="legend-controls">
            <button class="control-button" id="legend-area"><span class="material-symbols-outlined">${areaIcon}</span></button>
            <button class="control-button" id="legend-quantil"><span class="material-symbols-outlined">${quantilIcon}</span></button>
            <button class="control-button" id="legend-plus"><span class="material-symbols-outlined">add</span></button>
            <button class="control-button" id="legend-minus"><span class="material-symbols-outlined">remove</span></button>
            <button class="control-button" id="legend-barrier"><span class="material-symbols-outlined">${eyeIcon}</span></button>
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
        fillColor: getColor(perArea ? getPVPerSqmPerPLZ(feature.properties.plz_code) : getPvPerPLZ(feature.properties.plz_code)),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 1
    };
}

function generateColorGradient(steps) {
    if (!barrierFree) {
        return Array.from({ length: steps }, (_, i) => {
            const hue = 120 * (i / (steps - 1)); // 0 (rot) bis 120 (grün)
            return `hsl(${hue}, 70%, 50%)`;
        });
    }
    return Array.from({ length: steps }, (_, i) => {
        const lightness = 10 + (80 * i) / (steps - 1);
        return `hsl(240, 100%, ${lightness}%)`;
    }).reverse();;
}

function onEachFeature(feature, layer) {
    const PLZpF = formatNumberWithDots(getPVPerSqmPerPLZ(feature.properties.plz_code).toFixed(0) / 1000);
    const PV = formatNumberWithDots(getPvPerPLZ(feature.properties.plz_code));
    layer.bindPopup(`
       <div class="popup-title">${feature.properties.plz_code} ${feature.properties.plz_name}</div>
       <div class="popup-subtitle">Bruttoleistung: ${PV} kW</div>
       <div class="popup-subtitle">Bruttoleistung pro Fläche: ${PLZpF} W/qm</div>
    `);
}

function getPvPerPLZ(plz) {
    const datax = data.PLZ_PV.find(item => item.PLZ == plz);
    return datax ? datax.PV : 0;
}

function getPVPerSqmPerPLZ(plz) {
    const datax = orte.features.filter(item => item.properties.name === plz);
    let size = 0;

    for (const dataxx of datax) {
        size += dataxx.properties.area_sqm || 0; // Wenn area_sqm 0 oder undefined ist, bleibt size 0
    }

    return size > 0 ? getPvPerPLZ(plz) * 1000000 / size : 0; // Verhindert Division durch 0
}


function getAbstufungenQuantile(anzAbstufungen, perArea) { //perArea flag to toggle between just bruttoleistung and per Area
    const values = [];
    for (let datax of data.PLZ_PV) {
        if (perArea) {
            values.push(getPVPerSqmPerPLZ(datax.PLZ));
        } else {
            values.push(datax.PV);
        }
    }
    values.sort((a, b) => a - b);
    const abstufungen = [];

    var length = Math.trunc(values.length / anzAbstufungen);
    abstufungen.push(0.0);
    for (let i = 1; i < anzAbstufungen; i++) {
        var pos = i * length;
        abstufungen.push(Math.trunc(values[pos]));//Grenze zwischen zwei wirkliche Values
    }

    return abstufungen;
}

function getAbstufungen(anzAbstufungen, perArea) { //perArea flag to toggle between just bruttoleistung and per Area
    var max = 0;
    counter = 0;
    for (let datax of data.PLZ_PV) {
        counter += Number(datax.PV);
        if (perArea == true) {
            if (getPVPerSqmPerPLZ(datax.PLZ) > max) {
                max = getPVPerSqmPerPLZ(datax.PLZ);
            }
        } else {
            if (max - datax.PV < 0) {
                max = datax.PV;
            }
        }
    }
    const abstufungen = [];
    for (let i = 0; i < anzAbstufungen; i++) {
        let abstufung = Math.round((max / anzAbstufungen) * i);
        if (!perArea) abstufung = Math.ceil(abstufung / 10000) * 10000;
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