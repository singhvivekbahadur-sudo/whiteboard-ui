import React, { useEffect, useState } from "react";

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

export default function App() {
  const [rows, setRows] = useState([]);
  const [soakRows, setSoakRows] = useState([]);

  useEffect(() => {
    const r = localStorage.getItem("wb_rows");
    const s = localStorage.getItem("wb_soak");
    if (r) setRows(JSON.parse(r));
    if (s) setSoakRows(JSON.parse(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("wb_rows", JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem("wb_soak", JSON.stringify(soakRows));
  }, [soakRows]);

  function addRow() {
    setRows([...rows, { ...emptyRow }]);
  }

  function deleteRow(index) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function moveToSoak(index) {
    const row = rows[index];
    setSoakRows([...soakRows, row]);
    deleteRow(index);
  }

  function extractFirst3Digits(value) {
    if (!value) return null;
    const match = value.match(/\d{3,}/);
    if (!match) return null;
    return parseInt(match[0].substring(0, 3), 10);
  }

  function resolveMarket(prefix) {
    return MARKET_RANGES.find(r => prefix >= r.from && prefix <= r.to);
  }

  function update(index, field, value) {
    const updated = [...rows];
    let row = { ...updated[index], [field]: value };

    if (field === "site_id") {
      const prefix = extractFirst3Digits(value);
      if (prefix !== null) {
        const match = resolveMarket(prefix);
        if (match) {
          row.market = match.market;
          row.rsm = match.rsm;
          row.rsm_email = match.email;
        }
      }
    }

    updated[index] = row;
    setRows(updated);
  }

  function renderRow(row, i, isSoak = false) {
    const ro = isSoak;

    return (
      <tr key={i} style={isSoak ? { backgroundColor: "#d4f8d4" } : {}}>
        <td><input value={row.date} readOnly={ro} onChange={e => update(i, "date", e.target.value)} /></td>
        <td><input value={row.project} readOnly={ro} onChange={e => update(i, "project", e.target.value)} /></td>
        <td><input value={row.sa} readOnly={ro} onChange={e => update(i, "sa", e.target.value)} /></td>
        <td><input value={row.market} readOnly /></td>
        <td><input value={row.site_id} readOnly={ro} onChange={e => update(i, "site_id", e.target.value)} /></td>
        <td><input value={row.signum} readOnly={ro} onChange={e => update(i, "signum", e.target.value)} /></td>
        <td><input value={row.asp_name_number} readOnly={ro} onChange={e => update(i, "asp_name_number", e.target.value)} /></td>
        <td><input value={row.asp_email_id} readOnly={ro} onChange={e => update(i, "asp_email_id", e.target.value)} /></td>
        <td><input value={row.comments} readOnly={ro} onChange={e => update(i, "comments", e.target.value)} /></td>
        <td><input value={row.rsm} readOnly /></td>
        <td><input value={row.rsm_email} readOnly /></td>
        <td>
          {!isSoak && (
            <>
              <button onClick={() => moveToSoak(i)}>➡ Move to Soak</button>
              <button onClick={() => deleteRow(i)}>🗑</button>
            </>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Whiteboard</h1>
      <button onClick={addRow}>➕ Add Row</button>

      <h2>Ongoing Sites</h2>
      <table border="1" cellPadding="5" width="100%">
        <thead>
          <tr>
            <th>Date</th><th>Project</th><th>SA</th><th>Market</th><th>Site ID</th>
            <th>Signum</th><th>ASP Name & Number</th><th>ASP Email ID</th>
            <th>Comments</th><th>RSM</th><th>RSM Email</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => renderRow(r, i, false))}
        </tbody>
      </table>

      <h2>Soak Completed (30 mins)</h2>
      <table border="1" cellPadding="5" width="100%">
        <tbody>
          {soakRows.map((r, i) => renderRow(r, i, true))}
        </tbody>
      </table>
    </div>
  );
}
