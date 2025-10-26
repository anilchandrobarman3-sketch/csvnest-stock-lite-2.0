/* Simple CSV helper */
const CSV = (()=>{
  function toCSV(rows, delimiter=","){
    const esc = (v)=>{
      const s = v==null ? "" : String(v);
      const needs = s.includes(delimiter) || s.includes('"') || s.includes("\n");
      const v2 = s.replace(/"/g,'""');
      return needs ? `"${v2}"` : v2;
    };
    return rows.map(r=>r.map(c=>esc(c)).join(delimiter)).join("\n");
  }
  return { toCSV };
})();
