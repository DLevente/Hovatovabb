
# 📱 HovaTovább Lite

A **HovaTovább Lite** egy letisztult, gyors és könnyen használható mobil menetrendkereső alkalmazás.
Azoknak a felhasználóknak készült, akik telefonjukon kizárólag a legegyszerűbb és legátláthatóbb menetrendkeresési funkciót szeretnék elérni – felesleges extra szolgáltatások nélkül.

A Lite verzió célja a gyors keresés, a minimális kezelőfelület és a mobilra optimalizált felhasználói élmény biztosítása.

---

## 🎯 Célkitűzés

A HovaTovább Lite olyan felhasználóknak készült, akik:

- 📍 Gyorsan szeretnének két állomás között menetrendet keresni
- 📅 Egyedi dátum és idő alapján keresnének járatot
- 🔁 Átszállásos útvonalakat is áttekinthetően szeretnének látni
- 📱 Egyszerű, sötét témájú mobil felületet preferálnak
- 🚫 Nem igényelnek regisztrációt vagy tervkezelési funkciókat

---

## ✨ Funkciók

- 🔎 Állomáskeresés automatikus javaslatokkal
- 🔄 Indulási és érkezési állomás felcserélése
- 📅 Dátum és idő kiválasztása
- 🚆 Járatok listázása
- 🔁 Átszállásos útvonalak kezelése
- 📊 Szakaszokra bontott megjelenítés
- ℹ️ Részletes megállólista (információs modal)
- 🎨 Modern, letisztult sötét UI

---

## 🧱 Technológiai háttér

Az alkalmazás az alábbi technológiákra épül:

- **React Native**
- **Expo**
- **TypeScript**
- **expo-router**
- **react-native-svg**
- REST API alapú backend kommunikáció

---

## 🚀 Telepítés és futtatás

### 1️⃣ Függőségek telepítése

```bash
npm install
```

### 2️⃣ Fejlesztői mód indítása

```bash
npx expo start
```

Ezután:

- `a` → Android emulátor indítása
- `i` → iOS szimulátor indítása (csak macOS-en)
- QR-kód → Expo Go alkalmazással való futtatás fizikai eszközön

---

## 🌐 Backend kapcsolat

Az alkalmazás REST API-n keresztül kommunikál a menetrend szolgáltató rendszerrel.

Főbb végpontok:

- `/searchStation` – Állomáskeresés szöveg alapján
- `/searchRoutesCustom` – Járatkeresés dátum és idő szerint
- `/runDescription` – Egy adott járat részletes megállólistája

Az alkalmazás kizárólag olvasási műveleteket végez, adatot nem tárol a felhasználó eszközén.

---

## 🎨 Design alapelvek

- Minimalista, letisztult megjelenés
- Sötét (dark mode) alapértelmezett téma
- Mobilképernyőre optimalizált elrendezés
- Átlátható tipográfia és konzisztens ikonhasználat
- Gyors navigáció és azonnali visszajelzés

A cél a gyors információelérés és az intuitív használhatóság biztosítása.

---

## 📦 Verzió

`1.0.0`

---

## 📄 Licenc

Ez a projekt oktatási célból készült.
