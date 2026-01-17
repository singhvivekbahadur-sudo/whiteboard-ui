import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

const EMAIL_SERVICE_ID = "service_m1ki0js";
const EMAIL_TEMPLATE_ID = "template_tkia51p";
const EMAIL_PUBLIC_KEY = "a1fQr9xeIiL4hJlH8";

/* ---------------- AUTOFILL CONFIG ---------------- */
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

export default function App() {
  const [rows, setRows] = useState([]);
  const [soakRows, setSoakRows] = useState([]);
  const [cancelRows, setCancelRows] = useState([]);

  /* -------- LOAD & AUTO DELETE 24HR SOAK -------- */
  useEffect(() => {
    const now = Date.now();
    setRows(JSON.parse(localStorage.getItem("wb_rows") || "[]"));
    setCancelRows(JSON.parse(localStorage.getItem("wb_cancel") || "[]"));
    setSoakRows(
      JSON.parse(localStorage.getItem("wb_soak") || "[]")
        .filter(r => now - new Date(r.soak_start_time).getTime() < 24 * 60 * 60 * 1000)
    );
  }, []);

  useEffect(() => localStorage.setItem("wb_rows", JSON.stringify(rows)), [rows]);
  useEffect(() => localStorage.setItem("wb_soak", JSON.stringify(soakRows)), [soakRows]);
  useEffect(() => localStorage.setItem("wb_cancel", JSON.stringify(cancelRows)), [cancelRows]);

  const addRow = () => setRows([...rows, { ...emptyRow }]);

  /* ---------------- AUTOFILL LOGIC ---------------- */
  const extractPrefix = (val) => {
    const m = val.match(/\d{3,}/);
    return m ? parseInt(m[0].substring(0, 3), 10) : null;
  };

  const update = (i, field, value) => {
    const updated = [...rows];
    let row = { ...updated[i], [field]: value };

    if (field === "site_id") {
      const prefix = extractPrefix(value);
      if (prefix !== null) {
        const match = MARKET_RANGES.find(r => prefix >= r.from && prefix <= r.to);
        if (match) {
          row.market = match.market;
          row.rsm = match.rsm;
          row.rsm_email = match.email;
        }
      }
    }

    updated[i] = row;
    setRows(updated);
  };

  const moveToSoak = async (i) => {
    const row = { ...rows[i], soak_start_time: new Date().toISOString() };

    try {
      await emailjs.send(
        EMAIL_SERVICE_ID,
        EMAIL_TEMPLATE_ID,
        {
          to_email: `${row.rsm_email}${row.asp_email_id ? "," + row.asp_email_id : ""}`,
          ...row
        },
        EMAIL_PUBLIC_KEY
      );
    } catch (e) {
      console.error("Email failed", e);
    }

    setSoakRows([...soakRows, row]);
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const cancelSite = (i) => {
    setCancelRows([...cancelRows, rows[i]]);
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const renderHeaders = (extra = []) => (
    <thead>
      <tr>
        {Object.keys(emptyRow).map(h => <th key={h}>{h.replace("_", " ").toUpperCase()}</th>)}
        {extra.map(h => <th key={h}>{h}</th>)}
        <th>Actions</th>
      </tr>
    </thead>
  );

  const renderRow = (r, i, readOnly, extra = null) => (
    <tr key={i}>
      {Object.keys(emptyRow).map(k => (
        <td key={k}>
          <input
            value={r[k] || ""}
            readOnly={readOnly}
            onChange={e => !readOnly && update(i, k, e.target.value)}
          />
        </td>
      ))}
      {extra}
      <td>
        {!readOnly && (
          <>
            <button onClick={() => moveToSoak(i)}>➡ Soak</button>
            <button onClick={() => cancelSite(i)}>❌ Cancel</button>
          </>
        )}
      </td>
    </tr>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Whiteboard</h1>
      <button onClick={addRow}>➕ Add Row</button>

      <h2>Ongoing Sites</h2>
      <table border="1" width="100%">
        {renderHeaders()}
        <tbody>{rows.map((r, i) => renderRow(r, i, false))}</tbody>
      </table>

      <h2>Soak Completed</h2>
      <table border="1" width="100%">
        {renderHeaders(["24 Soak Start"])}
        <tbody>
          {soakRows.map((r, i) =>
            renderRow(r, i, true, <td>{new Date(r.soak_start_time).toLocaleString()}</td>)
          )}
        </tbody>
      </table>

      <h2 style={{ color: "red" }}>❌ Cancelled Sites</h2>
      <table border="1" width="100%">
        {renderHeaders()}
        <tbody>{cancelRows.map((r, i) => renderRow(r, i, true))}</tbody>
      </table>
    </div>
  );
}
