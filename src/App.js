import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import * as XLSX from "xlsx";

/* ================= EMAIL CONFIG ================= */
const EMAILJS_SERVICE_ID = "service_m1ki0js";
const EMAILJS_PUBLIC_KEY = "a1fQr9xeIiL4hJlH8";
const TEMPLATE_SOAK = "template_tkia51p";
const TEMPLATE_CANCEL = "template_y3pl72a";

/* ================= CONSTANTS ================= */
const DAY_24_MS = 24 * 60 * 60 * 1000;

/* ================= MARKET RULES ================= */
const MARKET_RANGES = [
  { from: 0, to: 8, market: "PNW", rsm: "Jesus Ruben", email: "jesus.ruben.luna@ericsson.com" },
  { from: 10, to: 17, market: "MTN", rsm: "Supashya Saurav", email: "supashya.saurav@ericsson.com" },
  { from: 20, to: 27, market: "SW", rsm: "Vivek Kumar", email: "vivek.j.kumar@ericsson.com" },
  { from: 30, to: 38, market: "NoCal", rsm: "Jesus Ruben", email: "jesus.ruben.luna@ericsson.com" },
  { from: 40, to: 54, market: "SoCal", rsm: "Vivek Kumar", email: "vivek.j.kumar@ericsson.com" },
  { from: 142, to: 151, market: "Florida", rsm: "Vivek Singh", email: "vivek.bahadur.s.singh@ericsson.com" },
  { from: 152, to: 164, market: "CAR/TN", rsm: "Vivek Singh", email: "vivek.bahadur.s.singh@ericsson.com" },
  { from: 168, to: 177, market: "GA/AL", rsm: "Isaac David", email: "isaac.david.perez@ericsson.com" },
  { from: 188, to: 198, market: "GP", rsm: "Fernando Gonzalez", email: "fernando.balderrama.gonzalez@ericsson.com" },
  { from: 202, to: 210, market: "IL/WI", rsm: "Irwing Perez", email: "irwing.esquivel.perez@ericsson.com" },
  { from: 214, to: 219, market: "KS/MO", rsm: "Supashya Saurav", email: "supashya.saurav@ericsson.com" },
  { from: 224, to: 233, market: "MI/IN/KY", rsm: "Carlos Adrian", email: "carlos.adrian.melo@ericsson.com" }
];

/* ================= HELPERS ================= */
const emptyRow = {
  date: new Date().toISOString().slice(0, 10),
  project: "",
  sa: "",
  market: "",
  site_id: "",
  signum: "",
  asp_name_number: "",
  asp_email_id: "",
  comments: "",
  rsm: "",
  rsm_email: ""
};

const extractPrefix = value => {
  const match = value?.match(/\d{3}/);
  return match ? parseInt(match[0], 10) : null;
};

const resolveMarket = prefix =>
  MARKET_RANGES.find(r => prefix >= r.from && prefix <= r.to);

/* ================= EMAIL ================= */
const sendEmail = (templateId, site) => {
  const params = {
    to_email: site.asp_email_id || site.rsm_email,
    date: site.date,
    project: site.project,
    sa: site.sa,
    market: site.market,
    site_id: site.site_id,
    signum: site.signum,
    asp_name_number: site.asp_name_number,
    asp_email_id: site.asp_email_id,
    comments: site.comments,
    rsm: site.rsm,
    rsm_email: site.rsm_email,
    soak_start: site.soakStart || ""
  };

  return emailjs.send(
    EMAILJS_SERVICE_ID,
    templateId,
    params,
    EMAILJS_PUBLIC_KEY
  );
};

/* ================= APP ================= */
export default function App() {
  const [ongoing, setOngoing] = useState([]);
  const [soak, setSoak] = useState([]);
  const [cancelled, setCancelled] = useState([]);

  /* ---------- Load + AUTO CLEANUP ---------- */
  useEffect(() => {
    const now = Date.now();

    const cleanSoak = (JSON.parse(localStorage.getItem("soak")) || [])
      .filter(r => now - r.soakStartEpoch < DAY_24_MS);

    const cleanCancelled = (JSON.parse(localStorage.getItem("cancelled")) || [])
      .filter(r => now - r.cancelledAtEpoch < DAY_24_MS);

    setOngoing(JSON.parse(localStorage.getItem("ongoing")) || []);
    setSoak(cleanSoak);
    setCancelled(cleanCancelled);

    localStorage.setItem("soak", JSON.stringify(cleanSoak));
    localStorage.setItem("cancelled", JSON.stringify(cleanCancelled));
  }, []);

  /* ---------- Persist ---------- */
  useEffect(() => localStorage.setItem("ongoing", JSON.stringify(ongoing)), [ongoing]);
  useEffect(() => localStorage.setItem("soak", JSON.stringify(soak)), [soak]);
  useEffect(() => localStorage.setItem("cancelled", JSON.stringify(cancelled)), [cancelled]);

  const update = (index, field, value) => {
    const rows = [...ongoing];
    const row = { ...rows[index], [field]: value };

    if (field === "site_id") {
      const prefix = extractPrefix(value);
      const match = resolveMarket(prefix);
      if (match) {
        row.market = match.market;
        row.rsm = match.rsm;
        row.rsm_email = match.email;
      }
    }

    rows[index] = row;
    setOngoing(rows);
  };

  const addRow = () => setOngoing([...ongoing, { ...emptyRow }]);

  const moveToSoak = index => {
    const site = {
      ...ongoing[index],
      soakStart: new Date().toLocaleString(),
      soakStartEpoch: Date.now()
    };

    sendEmail(TEMPLATE_SOAK, site);
    setSoak([...soak, site]);
    setOngoing(ongoing.filter((_, i) => i !== index));
  };

  const cancelSite = index => {
    const site = {
      ...ongoing[index],
      cancelledAtEpoch: Date.now()
    };

    sendEmail(TEMPLATE_CANCEL, site);
    setCancelled([...cancelled, site]);
    setOngoing(ongoing.filter((_, i) => i !== index));
  };

  /* ---------- MANUAL DELETE ---------- */
  const deleteOngoing = i => setOngoing(ongoing.filter((_, idx) => idx !== i));
  const deleteSoak = i => setSoak(soak.filter((_, idx) => idx !== i));
  const deleteCancelled = i => setCancelled(cancelled.filter((_, idx) => idx !== i));

  /* ================= EXCEL ================= */
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const addSheet = (data, name) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    addSheet(ongoing, "Ongoing Sites");
    addSheet(soak, "Soak Completed Sites");
    addSheet(cancelled, "Cancelled Sites");
    XLSX.writeFile(wb, "Whiteboard_Sites.xlsx");
  };

  const headers = Object.keys(emptyRow);

  const renderHeader = extra =>
    <tr>{headers.map(h => <th key={h}>{h.toUpperCase()}</th>)}{extra && <th>ACTIONS</th>}</tr>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <img src="/ericsson.png" alt="Ericsson" style={{ height: 40 }} />
        <h1>Whiteboard</h1>
      </div>

      <button onClick={addRow}>➕ Add Row</button>{" "}
      <button onClick={exportToExcel}>📊 Export to Excel</button>

      {/* ONGOING */}
      <h2>Ongoing Sites</h2>
      <table border="1" width="100%">
        <thead>{renderHeader(true)}</thead>
        <tbody>
          {ongoing.map((r, i) => (
            <tr key={i}>
              {headers.map(k => (
                <td key={k}><input value={r[k]} onChange={e => update(i, k, e.target.value)} /></td>
              ))}
              <td>
                <button onClick={() => moveToSoak(i)}>➡ Soak</button>{" "}
                <button onClick={() => cancelSite(i)}>❌ Cancel</button>{" "}
                <button onClick={() => deleteOngoing(i)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SOAK */}
      <h2>Soak Completed</h2>
      <table border="1" width="100%">
        <thead>{renderHeader(true)}</thead>
        <tbody>
          {soak.map((r, i) => (
            <tr key={i}>
              {headers.map(k => <td key={k}><input value={r[k]} readOnly /></td>)}
              <td>
                <span>{r.soakStart}</span>{" "}
                <button onClick={() => deleteSoak(i)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CANCELLED */}
      <h2 style={{ color: "red" }}>❌ Cancelled Sites</h2>
      <table border="1" width="100%">
        <thead>{renderHeader(true)}</thead>
        <tbody>
          {cancelled.map((r, i) => (
            <tr key={i} style={{ background: "#ffd6d6" }}>
              {headers.map(k => <td key={k}><input value={r[k]} readOnly /></td>)}
              <td>
                <button onClick={() => deleteCancelled(i)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
