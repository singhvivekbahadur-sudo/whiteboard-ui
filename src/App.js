import React, { useState } from "react";
import emailjs from "@emailjs/browser";

/* ===== MARKET AUTO-FILL RULES ===== */
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

function resolveMarket(prefix) {
  return MARKET_RANGES.find(r => prefix >= r.from && prefix <= r.to);
}

function extractPrefix(siteId) {
  const match = siteId.match(/\d{3}/);
  return match ? parseInt(match[0], 10) : null;
}

export default function App() {
  const emptyRow = {
    date: new Date().toISOString().split("T")[0],
    project: "",
    sa: "",
    market: "",
    site_id: "",
    signum: "",
    asp_name_number: "",
    asp_email_id: "",
    comments: "",
    rsm: "",
    rsm_email: "",
    soakStart: ""
  };

  const [ongoing, setOngoing] = useState([{ ...emptyRow }]);
  const [soak, setSoak] = useState([]);
  const [cancelled, setCancelled] = useState([]);

  const update = (list, setList, index, field, value) => {
    const updated = [...list];
    const row = { ...updated[index], [field]: value };

    if (field === "site_id") {
      const prefix = extractPrefix(value);
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
    setList(updated);
  };

  const sendEmail = (templateId, site) => {
    return emailjs.send(
      "service_m1ki0js",
      templateId,
      {
        to_email: site.asp_email_id || site.rsm_email,
        ...site
      },
      "a1fQr9xeIiL4hJlH8"
    );
  };

  const moveToSoak = (i) => {
    const site = { ...ongoing[i], soakStart: new Date().toLocaleString() };
    sendEmail("z1ixnhv", site);
    setSoak([...soak, site]);
    setOngoing(ongoing.filter((_, idx) => idx !== i));
  };

  const cancelSite = (i) => {
    const site = ongoing[i];
    sendEmail("template_y3pl72a", site);
    setCancelled([...cancelled, site]);
    setOngoing(ongoing.filter((_, idx) => idx !== i));
  };

  const headers = [
    "Date","Project","SA","Market","Site ID","Signum",
    "ASP Name & Number","ASP Email","Comments","RSM","RSM Email"
  ];

  const renderTable = (rows, setRows, actions, extraHeader, readOnly=false) => (
    <table border="1" cellPadding="5" width="100%">
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
          {extraHeader && <th>{extraHeader}</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {headers.map(key => {
              const field = key.toLowerCase().replace(/ & /g,"_").replace(/ /g,"_");
              return (
                <td key={key}>
                  <input
                    value={row[field] || ""}
                    readOnly={readOnly}
                    onChange={e => update(rows, setRows, i, field, e.target.value)}
                  />
                </td>
              );
            })}
            {extraHeader && <td>{row.soakStart}</td>}
            <td>{actions && actions(i)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Whiteboard</h1>
      <button onClick={() => setOngoing([...ongoing, { ...emptyRow }])}>➕ Add Row</button>

      <h2>Ongoing Sites</h2>
      {renderTable(ongoing, setOngoing, i => (
        <>
          <button onClick={() => moveToSoak(i)}>Move to Soak</button>{" "}
          <button onClick={() => cancelSite(i)}>❌ Cancel</button>
        </>
      ))}

      <h2>Soak Completed</h2>
      {renderTable(soak, () => {}, null, "24 Soak Start", true)}

      <h2 style={{ color: "red" }}>❌ Cancelled Sites</h2>
      {renderTable(cancelled, () => {}, null, null, true)}
    </div>
  );
}
