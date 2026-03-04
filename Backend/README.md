# HovaTovább: Backend (Node.js + Express)

A HovaTovább backend egy **Node.js + Express** alapú REST API, amely:
- továbbítja a menetrendi lekérdezéseket a külső menetrend szolgáltatás felé,
- kezeli a felhasználókat (regisztráció / bejelentkezés / profil módosítás),
- kezeli a menetrendterveket (tervek, járatok mentése, státusz, törlés),
- MySQL adatbázissal dolgozik.

---

## Követelmények

- **Node.js** (ajánlott: 18+)
- **npm** (Node-dal együtt)
- **MySQL** (vagy MariaDB)
- (Ajánlott) **phpMyAdmin** a DB kezeléshez

---

## Telepítés

1) Csomagok telepítése:
```bash
npm install
```

2) Indítás (fejlesztői mód)
```bash
node server.js
```

## Alap működés

A backend REST végpontokon keresztül kommunikál:

- a frontend hívja a backend API-t,
- a backend:
  - vagy a MySQL adatbázisból szolgál ki adatot,
  - vagy továbbküld egy kérést a külső menetrend API felé,
  - majd a választ visszaadja a frontendnek.

---

## Végpontok áttekintése

### Menetrend / külső API lekérdezések

- `POST /api/searchStation` – állomás keresés  
- `POST /api/searchRoutes` – alap járat keresés (aktuális idővel)  
- `POST /api/searchRoutesCustom` – járat keresés megadott dátummal és idővel  
- `POST /api/runDescription` – járat részletes megállólista  
- `POST /api/runsDelay` – késések lekérése (`run_id` lista alapján)

---

### Felhasználók

- `POST /api/register` – regisztráció  
- `POST /api/login` – bejelentkezés  
- `GET /api/user/:felhasznalonev` – felhasználó adatai  
- `PUT /api/user/:felhasznalonev` – profil frissítése (opcionálisan jelszó)  
- `DELETE /api/user/:felhasznalonev` – felhasználó törlése  

---

### Tervek / mentett járatok

- `GET /api/plans/:felhasznalonev` – tervek listája  
- `POST /api/addPlan` – terv létrehozása  
- `GET /api/planRoutes/:tervId` – tervhez tartozó járatok  
- `POST /api/addRoute` – járat mentése  
- `POST /api/addPlanRoute` – járat hozzárendelése tervhez  
- `PUT /api/routeStatus/:jaratId` – „elérte” státusz frissítése (0 / 1 / 2)  
- `DELETE /api/planRouteDelete/:jaratId` – járat leválasztása tervről  
- `DELETE /api/planDelete/:tervId` – terv törlése  

---

### Kedvezmények

- `GET /api/kedvezmenyek` – kedvezmények listája

---

## Hibakezelés

A backend az alábbi megoldásokat használja:

- `try/catch` blokkok az aszinkron végpontokban  
- hibák esetén:
  - `500` válasz `{ error: "..." }` formátumban
  - paraméterhiba esetén `400`
  - auth hiba esetén `401`

---

## Biztonság

- Jelszavak tárolása: `bcrypt` hash (`SALT_ROUNDS=12`)
- CORS engedélyezve a frontend kiszolgálásához
- Érzékeny adatok `.env` fájlban kerülnek tárolásra
