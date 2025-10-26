const fileInput=document.getElementById('fileInput');
const uploadBtn=document.getElementById('uploadBtn');
const dropzone=document.getElementById('dropzone');
const tableBody=document.querySelector('#fileTable tbody');
const output=document.getElementById('output');
const exportBtn=document.getElementById('exportBtn');
const titleLen=document.getElementById('titleLen');
const kwCount=document.getElementById('kwCount');
const titleLenLabel=document.getElementById('titleLenLabel');
const kwCountLabel=document.getElementById('kwCountLabel');
const bulkKeywordInput=document.getElementById('bulkKeywordInput');
const bulkKeywordBtn=document.getElementById('bulkKeywordBtn');

let filesData=[];

uploadBtn.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',e=>{
  filesData=Array.from(e.target.files).map(f=>({
    name:f.name,
    title:f.name.replace(/\.[^/.]+$/,''),
    keywords:'',
  }));
  renderTable();
});

titleLen.addEventListener('input',()=>{titleLenLabel.textContent=titleLen.value;enforceLimits();});
kwCount.addEventListener('input',()=>{kwCountLabel.textContent=kwCount.value;enforceLimits();});

bulkKeywordBtn.addEventListener('click',()=>{
  const newKw=bulkKeywordInput.value.trim();
  if(!newKw)return;
  const addList=newKw.split(/[,;|]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  filesData.forEach(f=>{
    const existing=f.keywords.split(/[,;|]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
    const merged=[...new Set([...existing,...addList])];
    f.keywords=merged.slice(0,kwCount.value).join(', ');
  });
  bulkKeywordInput.value='';
  renderTable();
});

function enforceLimits(){
  filesData.forEach(f=>{
    if(f.title.length>titleLen.value)f.title=f.title.slice(0,titleLen.value);
    const kws=f.keywords.split(/[,;|]/).filter(Boolean);
    if(kws.length>kwCount.value)f.keywords=kws.slice(0,kwCount.value).join(', ');
  });
  renderTable();
}

function renderTable(){
  tableBody.innerHTML='';
  filesData.forEach((f,i)=>{
    const row=document.createElement('tr');
    row.innerHTML=`<td>${f.name}</td>
      <td><input type='text' value='${f.title}' maxlength='${titleLen.value}' data-idx='${i}' data-type='title'></td>
      <td><textarea data-idx='${i}' data-type='keywords'>${f.keywords}</textarea></td>`;
    tableBody.appendChild(row);
  });
  output.classList.toggle('hidden',!filesData.length);
  document.querySelectorAll('input,textarea').forEach(el=>{
    el.addEventListener('input',e=>{
      const idx=e.target.dataset.idx;
      const type=e.target.dataset.type;
      filesData[idx][type]=e.target.value;
      enforceLimits();
    });
  });
}

exportBtn.addEventListener('click',()=>{
  const rows=[['Filename','Title','Keywords']];
  filesData.forEach(f=>rows.push([f.name,f.title,f.keywords]));
  const csv=CSV.toCSV(rows);
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='metadata.csv';a.click();
  URL.revokeObjectURL(url);
});
