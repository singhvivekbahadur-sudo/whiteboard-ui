import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

/* ================= EMAILJS CONFIG ================= */
const EMAILJS_SERVICE_ID = "service_m1ki0js";
const EMAILJS_TEMPLATE_ID = "template_tkia51p";
const EMAILJS_PUBLIC_KEY = "a1fQr9xeIiL4hJlH8";
/* ================================================== */

emailjs.init(EMAILJS_PUBLIC_KEY);

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
  { from: 152, to: 164, market: "CAR/TN", rsm: "Vivek Singh", email: "vivek.bahadur.s.singh@ericsson.com" }
];

export default function App() {
  const [rows, setRows] = useState([]);
  const [soakRows, setSoakRows] = useState([]);
  const [cancelledRows, setCancelledRows] = useState([]);

  useEffect(() => {
    setRows(JSON.parse(localStorage.getItem("wb_rows") || "[]"));
    setSoakRows(JSON.parse(localStorage.getItem("wb_soak") || "[]"));
    setCancelledRows(JSON.parse(localStorage.getItem("wb_cancel") || "[]"));
  }, []);

  useEffect(() => localStorage.setItem("wb_rows", JSON.stringify(rows)), [rows]);
  useEffect(() => localStorage.setItem("wb_soak", JSON.stringify(soakRows)), [soakRows]);
  useEffect(() => localStorage.setItem("wb_cancel", JSON.stringify(cancelledRows)), [cancelledRows]);

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const deleteRow = index => setRows(rows.filter((_, i) => i !== index));

  const extractPrefix = value => {
    const m = value.match(/\d{3}/);
    return m ? parseInt(m[0], 10) : null;
  };

  const update = (index, field, value) => {
    const updated = [...rows];
    const row = { ...updated[index], [field]: value };

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

    updated[index] = row;
    setRows(updated);
  };

  /* 🔍 DEBUG EMAIL FUNCTION */
  const sendSoakEmail = row => {
    const to_email = [row.rsm_email, row.asp_email_id]
      .filter(Boolean)
      .join(",");

    console.log("👉 EMAIL TRYING TO SEND TO:", to_email);

    emailjs
      .send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { ...row, to_email }
      )
      .then(
        res => console.log("✅ EMAIL SENT SUCCESS", res),
        err => console.error("❌ EMAIL FAILED", err)
      );
  };

  const moveToSoak = index => {
    const row = rows[index];
    sendSoakEmail(row);
    setSoakRows([...soakRows, row]);
    deleteRow(index);
  };

  const cancelRow = index => {
    const row = rows[index];
    setCancelledRows([...cancelledRows, row]);
    deleteRow(index);
  };

  const renderRow = (row, i, actions) => (
    <tr key={i}>
      <td><input value={row.date} onChange={e => update(i,"date",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.project} onChange={e => update(i,"project",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.sa} onChange={e => update(i,"sa",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.market} readOnly /></td>
      <td><input value={row.site_id} onChange={e => update(i,"site_id",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.signum} onChange={e => update(i,"signum",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.asp_name_number} onChange={e => update(i,"asp_name_number",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.asp_email_id} onChange={e => update(i,"asp_email_id",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.comments} onChange={e => update(i,"comments",e.target.value)} readOnly={!actions} /></td>
      <td><input value={row.rsm} readOnly /></td>
      <td><input value={row.rsm_email} readOnly /></td>
      {actions && (
        <td>
          <button onClick={() => moveToSoak(i)}>➡ Move to Soak</button>
          <button onClick={() => cancelRow(i)}>❌ Cancel</button>
          <button onClick={() => deleteRow(i)}>🗑</button>
        </td>
      )}
    </tr>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Whiteboard</h1>
      <button onClick={addRow}>➕ Add Row</button>

      <h2>Ongoing Sites</h2>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Date</th><th>Project</th><th>SA</th><th>Market</th><th>Site ID</th>
            <th>Signum</th><th>ASP Name</th><th>ASP Email</th>
            <th>Comments</th><th>RSM</th><th>RSM Email</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows.map((r,i)=>renderRow(r,i,true))}</tbody>
      </table>

      <h2>Soak Completed</h2>
      <table border="1" width="100%">
        <tbody>{soakRows.map((r,i)=>renderRow(r,i,false))}</tbody>
      </table>

      <h2 style={{ color:"red" }}>❌ Cancelled Sites</h2>
      <table border="1" width="100%">
        <tbody>{cancelledRows.map((r,i)=>renderRow(r,i,false))}</tbody>
      </table>
    </div>
  );
}
