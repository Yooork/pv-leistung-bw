import os
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
import math


def calculate_bruttoleistung_per_postleitzahl(directory):
    # Dictionary zur Speicherung der Ergebnisse
    bruttoleistung_per_plz = defaultdict(float)
    pattern_for_filename= re.compile(r"^EinheitenSolar_\d{1,2}\.xml$")

    #für ladebalken


    file_count = sum(1 for file in os.listdir(directory) if pattern_for_filename.match(file))

    counter = 1
    for filename in os.listdir(directory):
        if pattern_for_filename.match(filename):
            progress = int(50 * counter / file_count)
            percent = int(100/file_count*counter)
            bar = "#" * progress + "." * (50 - progress)
            print(f"\r[{bar}] {percent}%", end="", flush=True)

            if filename.endswith('.xml'):
                file_path = os.path.join(directory, filename)

                # XML-Datei parsen
                tree = ET.parse(file_path)
                root = tree.getroot()

                for einheit in root.findall('.//EinheitSolar'):
                    # Bundesland überprüfen (1402 = Baden-Württemberg)
                    bundesland = einheit.find('Bundesland')
                    if bundesland is not None and bundesland.text == '1402':

                        plz = einheit.find('Postleitzahl')

                        bruttoleistung = einheit.find('Bruttoleistung')
                        id = einheit.find('EinheitMastrNummer')

                        if plz is not None and bruttoleistung is not None:
                            try:
                                leistung = math.trunc(float(bruttoleistung.text))
                                if leistung > 40000:  # Leistung über 40000 kW
                                    user_input = input(f"\nDie Bruttoleistung {leistung} kW, der Anlage {id.text} in {plz.text} aus {filename}, ist größer als 40.000 kW. Möchten Sie diese Leistung akzeptieren? (y/n): ").strip().lower()
                                    if user_input != 'y':
                                        while 1:
                                            user_input = input(f"Den Wert angepasst eintrage? Ja -> Zahl angeben xxxx.x, Nein -> n: ").strip().lower()
                                            if user_input == 'n':
                                                print(f"Die Bruttoleistung {leistung} kW wurde verworfen.")
                                                break  # Überspringe diesen Eintrag
                                            else:
                                                try:
                                                    leistung = float(user_input)
                                                    print(f"Wurde als {leistung} kW übernommen.")
                                                    bruttoleistung_per_plz[plz.text] += leistung
                                                    break
                                                except ValueError:
                                                    print(f"Ungültige Eingabe")
                                    else:
                                        bruttoleistung_per_plz[plz.text] += leistung
                                else:
                                    bruttoleistung_per_plz[plz.text] += leistung

                            except ValueError:
                                print(f"Ungültige Bruttoleistung in Datei {filename}: {bruttoleistung.text}")
            counter+=1

    return bruttoleistung_per_plz