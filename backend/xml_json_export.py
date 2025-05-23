import os
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
import math
import threading

def input_with_timeout(prompt, timeout):
    user_input = [None]

    def get_input():
        try:
            user_input[0] = input(prompt)
        except EOFError:
            pass  # Für manche Umgebungen notwendig

    thread = threading.Thread(target=get_input)
    thread.start()
    thread.join(timeout)
    if thread.is_alive():
        print("\n[Timeout] Keine Eingabe erkannt, Eintrag wird übersprungen.")
        return None
    return user_input[0]

def calculate_bruttoleistung_per_postleitzahl(directory):
    bruttoleistung_per_plz = defaultdict(float)
    pattern_for_filename = re.compile(r"^EinheitenSolar_\d{1,2}\.xml$")

    file_count = sum(1 for file in os.listdir(directory) if pattern_for_filename.match(file))

    counter = 1
    for filename in os.listdir(directory):
        if pattern_for_filename.match(filename):
            progress = int(50 * counter / file_count)
            percent = int(100 / file_count * counter)
            bar = "#" * progress + "." * (50 - progress)
            print(f"\r[{bar}] {percent}%", end="", flush=True)

            file_path = os.path.join(directory, filename)

            try:
                tree = ET.parse(file_path)
                root = tree.getroot()
            except ET.ParseError:
                print(f"\nFehler beim Parsen der Datei: {filename}")
                continue

            for einheit in root.findall('.//EinheitSolar'):
                bundesland = einheit.find('Bundesland')
                if bundesland is not None and bundesland.text == '1402':
                    plz = einheit.find('Postleitzahl')
                    bruttoleistung = einheit.find('Bruttoleistung')
                    id = einheit.find('EinheitMastrNummer')

                    if plz is not None and bruttoleistung is not None:
                        try:
                            leistung = math.trunc(float(bruttoleistung.text))
                            if leistung > 40000:
                                user_input = input_with_timeout(
                                    f"\nDie Bruttoleistung {leistung} kW, der Anlage {id.text} in {plz.text} aus {filename}, ist größer als 40.000 kW. Möchten Sie diese Leistung akzeptieren? (y/n): ",
                                    10
                                )
                                if user_input != 'y':
                                    if user_input is None:
                                        print(f"Die Bruttoleistung {leistung} kW wurde verworfen (Timeout).")
                                        continue  # <<< Direkt weitermachen
                                    while True:
                                        user_input = input_with_timeout(
                                            "Den Wert angepasst eintragen? Ja -> Zahl angeben xxxx.x, Nein -> n: ", 10)
                                        if user_input is None or user_input == 'n':
                                            print(f"Die Bruttoleistung {leistung} kW wurde verworfen.")
                                            break
                                        else:
                                            try:
                                                leistung = float(user_input)
                                                print(f"Wurde als {leistung} kW übernommen.")
                                                bruttoleistung_per_plz[plz.text] += leistung
                                                break
                                            except ValueError:
                                                print("Ungültige Eingabe")
                                else:
                                    bruttoleistung_per_plz[plz.text] += leistung
                        except ValueError:
                            print(f"\nUngültige Bruttoleistung in Datei {filename}: {bruttoleistung.text}")
            counter += 1

    return bruttoleistung_per_plz
