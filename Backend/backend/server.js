const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
dotenv.config();

const SALT_ROUNDS = 12;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const API_URL = process.env.API_URL;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// fetch wrapper (dinamikus import)
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Állomás keresés
app.post("/api/searchStation", async (req, res) => {
  const { query } = req.body;

  const payload = {
    func: "getStationOrAddrByText",
    params: {
      inputText: query,
      searchIn: ["stations"],
      searchDate: new Date().toISOString().split("T")[0], // mai dátum
      maxResults: 30,
      networks: [1, 2, 3, 10, 11, 12, 13, 14, 24, 25, 26],
      currentMode: "position_based",
      currentLang: "hu",
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Járatok keresése
app.post("/api/searchRoutes", async (req, res) => {
  const { from, to } = req.body;

  const payload = {
    func: "getRoutes",
    params: {
      networks: [1, 2, 3, 10, 11, 12, 13, 14, 24, 25, 26],
      datum: new Date().toISOString().split("T")[0],
      erk_stype: "megallo",
      ext_settings: "block",
      filtering: 0,
      helyi: "No",

      // indulási pont
      honnan: from.name,
      honnan_ls_id: from.ls_id ?? 0, // <<<< FONTOS
      honnan_settlement_id: from.settlementId,
      honnan_site_code: from.siteCode ?? 0,

      hour: new Date().getHours().toString(),

      // érkezési pont
      hova: to.name,
      hova_ls_id: to.ls_id ?? 0, // <<<< FONTOS
      hova_settlement_id: to.settlementId,
      hova_site_code: to.siteCode ?? 0,

      ind_stype: "megallo",
      keresztul_stype: "megallo",
      maxatszallas: "5",
      maxvar: "240",
      maxwalk: "1000",
      min: new Date().getMinutes().toString(),
      napszak: 3,
      naptipus: 0,
      odavissza: 0,
      preferencia: "0",
      rendezes: "1",
      submitted: 1,
      talalatok: 1,
      target: 0,
      utirany: "oda",
      var: "0",
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Felhasználó által beállított idő szerinti keresés
app.post("/api/searchRoutesCustom", async (req, res) => {
  const { from, to, date, hour, minute } = req.body;

  const payload = {
    func: "getRoutes",
    params: {
      networks: [1, 2, 3, 10, 11, 12, 13, 14, 24, 25, 26],
      datum: date,
      ind_stype: "megallo",
      erk_stype: "megallo",

      honnan: from.name,
      honnan_ls_id: from.ls_id ?? 0,
      honnan_settlement_id: from.settlementId,
      honnan_site_code: from.siteCode ?? 0,

      hova: to.name,
      hova_ls_id: to.ls_id ?? 0,
      hova_settlement_id: to.settlementId,
      hova_site_code: to.siteCode ?? 0,

      hour: hour.toString(),
      min: minute.toString(),

      ext_settings: "block",
      filtering: 0,
      helyi: "No",
      keresztul_stype: "megallo",
      maxatszallas: "5",
      maxvar: "240",
      maxwalk: "1000",
      napszak: 3,
      naptipus: 0,
      odavissza: 0,
      preferencia: "0",
      rendezes: "1",
      submitted: 1,
      talalatok: 1,
      target: 0,
      utirany: "oda",
      var: "0",
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    const normalizeOwner = (owner) => {
      const o = String(owner ?? "").trim().toLowerCase();
      return o === "mátészalka" || o === "mateszalka" ? "MSZ" : owner;
    };

    const normalizeStationForMSZ = (name, owner) => {
      const o = String(owner ?? "").trim().toLowerCase();
      if (o !== "mátészalka" && o !== "mateszalka") return name;

      if (!name) return name;

      let n = String(name).trim();

      if (n.toLowerCase().startsWith("mátészalka,")) {
        n = n.substring("mátészalka,".length).trim();
      }

      return n.charAt(0).toUpperCase() + n.slice(1);
    };

    const talalatok = data?.results?.talalatok;

    if (talalatok && typeof talalatok === "object") {
      Object.values(talalatok).forEach((journey) => {
        const segs = journey?.nativeData;
        if (Array.isArray(segs)) {
          segs.forEach((seg) => {
            if (!seg) return;

            const originalOwner = seg.OwnerName;

            seg.OwnerName = normalizeOwner(seg.OwnerName);
            seg.DepStationName = normalizeStationForMSZ(seg.DepStationName, originalOwner);
            seg.ArrStationName = normalizeStationForMSZ(seg.ArrStationName, originalOwner);
          });
        }
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Járat leírás
app.post("/api/runDescription", async (req, res) => {
  try {
    // Full compatibility: accept both camelCase and snake_case
    const {
      runId, run_id,
      slsId, sls_id,
      elsId, els_id,
      date
    } = req.body;

    const runIdFinal = runId ?? run_id;
    const slsIdFinal = slsId ?? sls_id;
    const elsIdFinal = elsId ?? els_id;

    // Validate parameters
    if (!runIdFinal || !slsIdFinal || !elsIdFinal || !date) {
      return res.status(400).json({
        error: "Missing or invalid parameters",
        received: req.body
      });
    }

    const payload = {
      query: "runDecriptionC",
      run_id: runIdFinal,
      domain_type: 1,
      sls_id: slsIdFinal,
      els_id: elsIdFinal,
      location: "hk",
      datum: date,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return res.json(data?.results?.kifejtes_sor || {});
  }

  catch (err) {
    console.error("runDescription API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Késés lekérés (runId lista)
app.post("/api/runsDelay", async (req, res) => {
  const { runs } = req.body; // pl. [335943, 1492868]

  if (!Array.isArray(runs) || runs.length === 0) {
    return res.status(400).json({ error: "Missing or invalid parameters", received: req.body });
  }

  const payload = {
    func: "getRunsDelay",
    params: { runs }
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // menetrendek válasz: data.result.data = [{run_id, delay, ...}]
    res.json(data?.result?.data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bejelentkezés
app.post("/api/login", async (req, res) => {
  const { felhasznalonev, jelszo } = req.body;

  try {
    // csak usernév alapján keresünk
    const [rows] = await db.query(
      "SELECT * FROM felhasznalo WHERE felhasznalonev = ?",
      [felhasznalonev]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });
    }

    const user = rows[0];

    // bcrypt ellenőrzés
    const ok = await bcrypt.compare(jelszo, user.jelszo);
    if (!ok) {
      return res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });
    }

    // soha ne küldd vissza a hash-t
    delete user.jelszo;

    res.json({ message: "Sikeres bejelentkezés", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Regisztráció
app.post("/api/register", async (req, res) => {
  const { felhasznalonev, jelszo, email, teljes_nev, kedv_id } = req.body;

  try {
    // hash
    const passwordHash = await bcrypt.hash(jelszo, SALT_ROUNDS);

    await db.query(
      "INSERT INTO felhasznalo (felhasznalonev, jelszo, email, teljes_nev, kedv_id) VALUES (?, ?, ?, ?, ?)",
      [felhasznalonev, passwordHash, email, teljes_nev, kedv_id]
    );

    res.json({ message: "Regisztráció sikeres" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Felhasználó adatainak módosítása
app.put("/api/user/:felhasznalonev", async (req, res) => {
  const { felhasznalonev } = req.params;
  const { email, teljes_nev, kedv_id, jelszo } = req.body;

  try {
    let sql = `UPDATE felhasznalo SET email = ?, teljes_nev = ?, kedv_id = ?`;
    const params = [email, teljes_nev, kedv_id];

    if (jelszo && String(jelszo).trim() !== "") {
      const hash = await bcrypt.hash(jelszo, SALT_ROUNDS);
      sql += ", jelszo = ?";
      params.push(hash);
    }

    sql += " WHERE felhasznalonev = ?";
    params.push(felhasznalonev);

    await db.query(sql, params);

    res.json({ message: "Felhasználó adatainak frissítése sikeres" });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Felhasználó törlése
app.delete("/api/user/:felhasznalonev", async (req, res) => {
  const { felhasznalonev } = req.params;
  try {
    const [rows] = await db.query("DELETE FROM felhasznalo WHERE felhasznalonev = ?", [felhasznalonev]);
    res.json({ message: "Felhasználó törlése sikeres" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Felhasználó adatai
app.get("/api/user/:felhasznalonev", async (req, res) => {
  const { felhasznalonev } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM felhasznalo WHERE felhasznalonev = ?", [felhasznalonev]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tervek listázása bejelentkezett felhasználónak
app.get("/api/plans/:felhasznalonev", async (req, res) => {
  const { felhasznalonev } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM tervek WHERE felhasznalonev = ?", [felhasznalonev]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Egy tervhez tartozó járatok részletesen
app.get("/api/planRoutes/:tervId", async (req, res) => {
  const { tervId } = req.params;
  console.log(" ^=^q^i /api/planRoutes called with tervId =", tervId);
  try {
    const [rows] = await db.query(
      `SELECT j.id, j.ind_allomas, j.erk_allomas, j.ind_ido, j.erk_ido,
       j.jegyar, j.jarmu_id, j.ido, j.km, j.run_id, j.sls_id, j.els_id, j.elerte,
       j.bay, j.owner, j.code,
       tj.sorrend
      FROM terv_jarat tj
      JOIN jarat j ON tj.jarat_id = j.id
      WHERE tj.terv_id = ?
      ORDER BY tj.sorrend ASC`,
      [tervId]
    );
    console.log(" ^|^e SQL returned rows:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error(" ^}^l SQL error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Terv létrehozása id: autoincrement
app.post("/api/addPlan", async (req, res) => {
  const { felhasznalonev, nev } = req.body;
  try {
    const [rows] = await db.query(
      "INSERT INTO tervek (felhasznalonev, nev) VALUES (?, ?)",
      [felhasznalonev, nev ?? "Új terv"]
    );

    res.json({
      message: "Sikeres terv hozzáadás",
      tervId: rows.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Járat adatai
app.get("/api/route/:jaratId", async (req, res) => {
  const { jaratId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM jarat WHERE id = ?", [jaratId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Járat hozzáadása
app.post("/api/addRoute", async (req, res) => {
  const { ind_allomas, erk_allomas, ind_ido, erk_ido, jegyar, jarmu_id, ido, km, run_id, sls_id, els_id, elerte, bay, owner, code } = req.body;

  try {
    const [rows] = await db.query(
      "INSERT INTO jarat (ind_allomas, erk_allomas, ind_ido, erk_ido, jegyar, jarmu_id, ido, km, run_id, sls_id, els_id, elerte, bay, owner, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ind_allomas, erk_allomas, ind_ido, erk_ido, jegyar, jarmu_id, ido, km, run_id, sls_id, els_id, elerte ?? 0, bay ?? '', owner ?? '', code ?? '']
    );

    res.json({ message: "Sikeres járat hozzáadás", jaratId: rows.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terv_jarat hozzáadása
app.post("/api/addPlanRoute", async (req, res) => {
  const { jarat_id, terv_id, sorrend } = req.body;
  try {
    const [rows] = await db.query(
      "INSERT INTO terv_jarat (jarat_id, terv_id, sorrend) VALUES (?, ?, ?)",
      [jarat_id, terv_id, sorrend]
    );
    res.json({ message: "Sikeres terv_jarat hozzáadás" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terv_jarat törlése
app.delete("/api/planRouteDelete/:jaratId", async (req, res) => {
  const { jaratId } = req.params;
  try {
    const [rows] = await db.query(
      "DELETE FROM terv_jarat WHERE jarat_id = ?",
      [jaratId]
    );
    res.json({ message: "Sikeres terv_jarat törlés" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terv törlése: törli az összes terv_jarat tábla és az összes járat tábla adatokat + jarat táblából az id, felhasznalonev
app.delete("/api/planDelete/:tervId", async (req, res) => {
  const { tervId } = req.params;
  try {
    const [rows] = await db.query(
      "DELETE FROM terv_jarat WHERE terv_id = ?",
      [tervId]
    );
    const [rows2] = await db.query(
      "DELETE FROM jarat WHERE id IN (SELECT jarat_id FROM terv_jarat WHERE terv_id = ?)",
      [tervId]
    );
    const [rows3] = await db.query(
      "DELETE FROM tervek WHERE id = ?",
      [tervId]
    );
    res.json({ message: "Sikeres terv törlés" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kedvezmények listázása
app.get("/api/kedvezmenyek", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM kedvezmenyek");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// terv -> elérte-e a járatot
app.put("/api/routeStatus/:jaratId", async (req, res) => {
  const { jaratId } = req.params;
  const { elerte } = req.body; // 0 / 1 / 2

  if (elerte !== 0 && elerte !== 1 && elerte !== 2) {
    return res.status(400).json({ error: "Invalid elerte (0/1/2)" });
  }

  try {
    await db.query("UPDATE jarat SET elerte = ? WHERE id = ?", [elerte, jaratId]);
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
