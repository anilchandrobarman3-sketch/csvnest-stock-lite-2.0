// State
let FILES = []; // { id, file, url, name, type, size, title, keywords, description, category, selected }
let idSeq = 1;

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Elements
const fileInput = $("#fileInput");
const dropzone = $("#dropzone");
const toolbar = $("#toolbar");
const fileCount = $("#fileCount");
const selectAllBtn = $("#selectAll");
const deselectAllBtn = $("#deselectAll");
const deleteSelectedBtn = $("#deleteSelected");
const tableWrap = $("#tableWrap");
const tableContainer = $("#tableContainer");

const platformSel = $("#platform");
const kwSepSel = $("#kwSep");
const bulkTitleFromNameBtn = $("#bulkTitleFromName");
const prefixInput = $("#prefixInput");
const suffixInput = $("#suffixInput");
const bulkPrefixBtn = $("#bulkPrefix");
const bulkSuffixBtn = $("#bulkSuffix");
const bulkKeywordsFromNameBtn = $("#bulkKeywordsFromName");
const bulkCategoryInput = $("#bulkCategory");
const exportCSVBtn = $("#exportCSV");
const btnClear = $("#btnClear");

// Upload handlers
fileInput.addEventListener("change", e=> handleFiles(e.target.files));
dropzone.addEventListener("click", ()=> fileInput.click());
dropzone.addEventListener("dragover", e=>{ e.preventDefault(); dropzone.classList.add("drag"); });
dropzone.addEventListener("dragleave", e=> dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", e=> {
  e.preventDefault(); dropzone.classList.remove("drag");
  handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList){
  const items = Array.from(fileList || []);
  if(!items.length) return;
  items.forEach(f=>{
    const id = idSeq++;
    const url = URL.createObjectURL(f);
    const name = f.name;
    const base = name.replace(/\.[^/.]+$/, "");
    const type = f.type || guessType(name);
    const sizeKB = (f.size/1024).toFixed(1) + " KB";
    FILES.push({
      id, file: f, url, name, type, size: sizeKB,
      title: toTitleCase(base.replace(/[-_]+/g, " ")),
      keywords: suggestKeywordsFromName(base).join(", "),
      description: "",
      category: "",
      selected: false
    });
  });
  refreshUI();
}

function guessType(name){
  const ext = name.split(".").pop().toLowerCase();
  if(["png","jpg","jpeg","webp"].includes(ext)) return "image/"+ext;
  if(ext==="svg") return "image/svg+xml";
  return "application/octet-stream";
}

// Rendering
function refreshUI(){
  const count = FILES.length;
  fileCount.textContent = `${count} file${count!==1?"s":""}`;
  toolbar.classList.toggle("hidden", count===0);
  tableWrap.classList.toggle("hidden", count===0);
  $("#dropzone").classList.toggle("hidden", count>0);
  renderTable();
}

function renderTable(){
  const header = `<thead><tr>
    <th><input type="checkbox" id="masterCheck"></th>
    <th>Preview</th>
    <th>Filename</th>
    <th>Type</th>
    <th>Size</th>
    <th>Title</th>
    <th>Keywords</th>
    <th>Description</th>
    <th>Category</th>
    <th>Actions</th>
  </tr></thead>`;

  const body = FILES.map(f=>{
    const thumb = f.type.includes("svg")
      ? `<div class="thumb" data-svg="${f.id}" title="SVG preview">SVG</div>`
      : `<img class="thumb" src="${f.url}" alt="">`;
    return `<tr data-id="${f.id}">
      <td><input class="checkbox row-check" type="checkbox" ${f.selected?"checked":""}></td>
      <td>${thumb}</td>
      <td>${escapeHtml(f.name)}</td>
      <td>${escapeHtml(f.type)}</td>
      <td>${escapeHtml(f.size)}</td>
      <td><input class="cell title" value="${escapeAttr(f.title)}"></td>
      <td><textarea class="cell keywords" rows="2">${escapeHtml(f.keywords)}</textarea></td>
      <td><textarea class="cell description" rows="2">${escapeHtml(f.description)}</textarea></td>
      <td><input class="cell category" value="${escapeAttr(f.category)}" placeholder=""></td>
      <td class="row-actions">
        <button class="btn small ghost act-dup">Duplicate</button>
        <button class="btn small danger act-del">Delete</button>
      </td>
    </tr>`;
  }).join("");

  tableContainer.innerHTML = `<table class="table">${header}<tbody>${body}</tbody></table>`;

  // Wire events
  const master = $("#masterCheck");
  if(master){
    master.addEventListener("change", e=> {
      FILES.forEach(f=> f.selected = e.target.checked);
      $$(".row-check").forEach(c=> c.checked = e.target.checked);
    });
  }
  $$(".row-check").forEach(chk => {
    chk.addEventListener("change", e=> {
      const id = getRowId(e.target);
      const row = FILES.find(x=>x.id===id);
      if(row) row.selected = e.target.checked;
    });
  });
  $$(".cell.title").forEach(inp => inp.addEventListener("input", e => updateCell(e, "title")));
  $$(".cell.keywords").forEach(inp => inp.addEventListener("input", e => updateCell(e, "keywords")));
  $$(".cell.description").forEach(inp => inp.addEventListener("input", e => updateCell(e, "description")));
  $$(".cell.category").forEach(inp => inp.addEventListener("input", e => updateCell(e, "category")));
  $$(".act-del").forEach(btn => btn.addEventListener("click", e => deleteRow(e)));
  $$(".act-dup").forEach(btn => btn.addEventListener("click", e => duplicateRow(e)));

  // Render inline SVG preview (optional)
  FILES.filter(f=>f.type.includes("svg")).forEach(f=>{
    const box = document.querySelector(`[data-svg="${f.id}"]`);
    if(!box) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const svg = new DOMParser().parseFromString(reader.result, "image/svg+xml").documentElement;
        svg.setAttribute("width","60"); svg.setAttribute("height","60");
        svg.setAttribute("preserveAspectRatio","xMidYMid meet");
        box.innerHTML = ""; box.appendChild(svg);
      }catch{ /* keep text */ }
    };
    reader.readAsText(f.file);
  });
}

function getRowId(el){
  const tr = el.closest("tr");
  return +tr.dataset.id;
}
function updateCell(e, key){
  const id = getRowId(e.target);
  const row = FILES.find(x=>x.id===id);
  if(!row) return;
  row[key] = e.target.value;
}
function deleteRow(e){
  const id = getRowId(e.target);
  FILES = FILES.filter(x=>x.id!==id);
  refreshUI();
}
function duplicateRow(e){
  const id = getRowId(e.target);
  const row = FILES.find(x=>x.id===id);
  if(!row) return;
  const copy = JSON.parse(JSON.stringify(row));
  copy.id = idSeq++;
  copy.selected = false;
  FILES.push(copy);
  refreshUI();
}

// Toolbar
selectAllBtn.addEventListener("click", ()=>{ FILES.forEach(f=>f.selected=true); refreshUI(); });
deselectAllBtn.addEventListener("click", ()=>{ FILES.forEach(f=>f.selected=false); refreshUI(); });
deleteSelectedBtn.addEventListener("click", ()=>{ FILES = FILES.filter(f=>!f.selected); refreshUI(); });
btnClear.addEventListener("click", ()=>{ FILES.forEach(f=>URL.revokeObjectURL(f.url)); FILES=[]; refreshUI(); });

// Bulk helpers
bulkTitleFromNameBtn.addEventListener("click", ()=>{
  eachSelectedOrAll(f => { f.title = toTitleCase(f.name.replace(/\.[^/.]+$/,"").replace(/[-_]+/g," ")); });
  refreshUI();
});
bulkPrefixBtn.addEventListener("click", ()=>{
  const p = prefixInput.value.trim();
  if(!p) return;
  eachSelectedOrAll(f => { f.title = `${p} ${f.title}`.trim(); });
  refreshUI();
});
bulkSuffixBtn.addEventListener("click", ()=>{
  const s = suffixInput.value.trim();
  if(!s) return;
  eachSelectedOrAll(f => { f.title = `${f.title} ${s}`.trim(); });
  refreshUI();
});
bulkKeywordsFromNameBtn.addEventListener("click", ()=>{
  eachSelectedOrAll(f => {
    const base = f.name.replace(/\.[^/.]+$/,"");
    const kws = suggestKeywordsFromName(base).join(", ");
    f.keywords = kws;
  });
  refreshUI();
});

function eachSelectedOrAll(fn){
  const items = FILES.some(f=>f.selected) ? FILES.filter(f=>f.selected) : FILES;
  items.forEach(fn);
}

// Export
exportCSVBtn.addEventListener("click", ()=>{
  const platform = platformSel.value;
  const sep = kwSepSel.value;
  const rows = [];
  if(platform==="adobe"){
    rows.push(["Filename","Title","Keywords","Category","Releases","Editorial","Illustration"]);
    FILES.forEach(f=>{
      const kws = normalizeKeywords(f.keywords, sep);
      const cat = (bulkCategoryInput.value || f.category || "").trim();
      rows.push([f.name, f.title, kws, cat, "", "FALSE", "FALSE"]);
    });
    const csv = CSV.toCSV(rows);
    downloadText(csv, "adobe_stock_metadata.csv", "text/csv");
  } else {
    rows.push(["Filename","Title","Keywords","Description","Category"]);
    FILES.forEach(f=>{
      const kws = normalizeKeywords(f.keywords, sep);
      const cat = (bulkCategoryInput.value || f.category || "").trim();
      rows.push([f.name, f.title, kws, f.description || "", cat]);
    });
    const csv = CSV.toCSV(rows);
    downloadText(csv, "generic_metadata.csv", "text/csv");
  }
});

// Helpers
function toTitleCase(s){
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).trim();
}
function suggestKeywordsFromName(name){
  const parts = name.split(/[-_ ]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  const uniq = Array.from(new Set(parts));
  return uniq.slice(0, 49); // Adobe Stock common keyword limit
}
function normalizeKeywords(kwStr, sep){
  const parts = String(kwStr||"").split(/[,\|;]+|\s{2,}/).map(x=>x.trim()).filter(Boolean);
  const uniq = Array.from(new Set(parts));
  return uniq.join(sep+" ");
}

function escapeHtml(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function escapeAttr(s){ return String(s==null?"":s).replace(/"/g,"&quot;"); }

function downloadText(text, filename, mime){
  const blob = new Blob([text], {type: mime || "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
