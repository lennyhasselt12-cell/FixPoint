const DB_NAME = "fixpoint-db";
const DB_VERSION = 1;
let db;
let currentPhotos = [];
const $ = id => document.getElementById(id);
const statuses = ["Eingegangen","Unterwegs","In Reparatur","Wartet auf Ersatzteil","Abgeschlossen","Rückversand","Übergeben","Abgebrochen"];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains("orders")) req.result.createObjectStore("orders",{keyPath:"id"}); };
    req.onsuccess=()=>{db=req.result;resolve(db)};
    req.onerror=()=>reject(req.error);
  });
}
function allOrders(){
  return new Promise((resolve,reject)=>{
    const req=db.transaction("orders","readonly").objectStore("orders").getAll();
    req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.createdAt-a.createdAt));
    req.onerror=()=>reject(req.error);
  });
}
function saveOrder(order){
  return new Promise((resolve,reject)=>{
    const req=db.transaction("orders","readwrite").objectStore("orders").put(order);
    req.onsuccess=resolve;req.onerror=()=>reject(req.error);
  });
}
function deleteOrder(id){
  return new Promise((resolve,reject)=>{
    const req=db.transaction("orders","readwrite").objectStore("orders").delete(id);
    req.onsuccess=resolve;req.onerror=()=>reject(req.error);
  });
}
function money(v){return (Number(v)||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"})}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function nextNumber(orders){
  const nums=orders.map(o=>Number((o.number||"").replace("FP-",""))||0);
  return "FP-"+String(Math.max(0,...nums)+1).padStart(3,"0");
}
function statusClass(s){if(["Abgeschlossen","Übergeben"].includes(s))return "done";if(s==="Wartet auf Ersatzteil")return "wait";if(s==="Abgebrochen")return "cancel";return ""}
async function render(){
  const orders=await allOrders();
  $("openCount").textContent=orders.filter(o=>!["Abgeschlossen","Übergeben","Abgebrochen"].includes(o.status)).length;
  $("workCount").textContent=orders.filter(o=>["In Reparatur","Wartet auf Ersatzteil"].includes(o.status)).length;
  $("doneCount").textContent=orders.filter(o=>["Abgeschlossen","Übergeben"].includes(o.status)).length;
  $("totalCount").textContent=orders.length+" gesamt";
  const query=$("searchInput").value.toLowerCase().trim(),filter=$("filterStatus").value;
  const filtered=orders.filter(o=>(!filter||o.status===filter)&&(!query||[o.number,o.customer,o.device,o.issue].join(" ").toLowerCase().includes(query)));
  $("orderList").innerHTML="";
  $("emptyState").classList.toggle("hidden",filtered.length!==0);
  if(orders.length===0)$("emptyState").classList.remove("hidden");
  for(const o of filtered){
    const card=document.createElement("article");card.className="order-card";
    const top=document.createElement("div");top.className="order-top";
    const left=document.createElement("div");
    const num=document.createElement("div");num.className="order-number";num.textContent=o.number;
    const dev=document.createElement("div");dev.className="order-device";dev.textContent=o.device;
    const cust=document.createElement("div");cust.className="order-customer";cust.textContent=o.customer||"Kein Kundenname";
    left.append(num,dev,cust);
    const badge=document.createElement("span");badge.className="status "+statusClass(o.status);badge.textContent=o.status;
    top.append(left,badge);
    const bottom=document.createElement("div");bottom.className="order-bottom";
    const date=document.createElement("span");date.textContent=new Date(o.createdAt).toLocaleDateString("de-DE");
    const price=document.createElement("strong");price.textContent=money(o.price);
    bottom.append(date,price);
    const actions=document.createElement("div");actions.className="card-actions";
    const edit=document.createElement("button");edit.className="small-btn";edit.textContent="Bearbeiten";edit.addEventListener("click",()=>openEdit(o));
    const advance=document.createElement("button");advance.className="small-btn";advance.textContent="Status ändern";advance.addEventListener("click",()=>quickStatus(o));
    actions.append(edit,advance);card.append(top,bottom,actions);$("orderList").append(card);
  }
}
async function quickStatus(order){
  const idx=statuses.indexOf(order.status);
  order.status=statuses[(idx+1)%statuses.length];
  order.updatedAt=Date.now();await saveOrder(order);await render();toast("Status: "+order.status);
}
function clearForm(){
  $("orderForm").reset();$("orderId").value="";currentPhotos=[];
  $("photoPreview").innerHTML="";$("deleteBtn").classList.add("hidden");
}
async function openNew(){
  clearForm();const orders=await allOrders();$("dialogTitle").textContent="Neuer Auftrag";
  $("orderNumber").value=nextNumber(orders);$("status").value="Eingegangen";
  $("orderDialog").showModal();
}
function openEdit(o){
  clearForm();$("dialogTitle").textContent=o.number+" bearbeiten";$("orderId").value=o.id;
  $("orderNumber").value=o.number;$("status").value=o.status;$("customer").value=o.customer||"";
  $("contact").value=o.contact||"";$("device").value=o.device;$("category").value=o.category||"Elektronik";
  $("issue").value=o.issue||"";$("notes").value=o.notes||"";$("price").value=o.price||"";
  $("partsCost").value=o.partsCost||"";$("parts").value=o.parts||"";
  currentPhotos=o.photos||[];drawPhotos();$("deleteBtn").classList.remove("hidden");$("orderDialog").showModal();
}
function drawPhotos(){
  $("photoPreview").innerHTML="";
  currentPhotos.forEach(src=>{const img=document.createElement("img");img.src=src;$("photoPreview").append(img)});
}
function compressImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=reject;
    reader.onload=()=>{
      const img=new Image();img.onerror=reject;
      img.onload=()=>{
        const scale=Math.min(1,1000/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",.72));
      };img.src=reader.result;
    };reader.readAsDataURL(file);
  });
}
$("photos").addEventListener("change",async e=>{
  const files=[...e.target.files].slice(0,4-currentPhotos.length);
  for(const f of files){if(f.size>12*1024*1024){toast("Ein Foto ist zu groß (max. 12 MB).");continue}try{currentPhotos.push(await compressImage(f))}catch{toast("Foto konnte nicht geladen werden.")}}
  drawPhotos();e.target.value="";
});
$("orderForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const existingId=$("orderId").value;
  const orders=await allOrders();
  const old=orders.find(o=>o.id===existingId);
  const order={
    id:existingId||crypto.randomUUID(),number:old?.number||$("orderNumber").value,
    createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),
    customer:$("customer").value.trim(),contact:$("contact").value.trim(),
    device:$("device").value.trim(),category:$("category").value,issue:$("issue").value.trim(),
    notes:$("notes").value.trim(),status:$("status").value,
    price:Number($("price").value)||0,partsCost:Number($("partsCost").value)||0,
    parts:$("parts").value.trim(),photos:currentPhotos
  };
  await saveOrder(order);$("orderDialog").close();await render();toast("Auftrag gespeichert.");
});
$("deleteBtn").addEventListener("click",async()=>{
  const id=$("orderId").value;if(!id)return;
  if(confirm("Diesen Auftrag wirklich löschen?")){await deleteOrder(id);$("orderDialog").close();await render();toast("Auftrag gelöscht.")}
});
function openBackup(){$("backupDialog").showModal()}
async function exportData(){
  const data={app:"FixPoint",version:1,exportedAt:new Date().toISOString(),orders:await allOrders()};
  const blob=new Blob([JSON.stringify(data)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="FixPoint-Backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);toast("Backup erstellt.");
}
async function importData(file){
  try{
    const data=JSON.parse(await file.text());
    if(data.app!=="FixPoint"||!Array.isArray(data.orders))throw new Error("Ungültige Sicherungsdatei");
    if(!confirm(`${data.orders.length} Aufträge importieren? Die bisherigen Aufträge werden ersetzt.`))return;
    const tx=db.transaction("orders","readwrite"),store=tx.objectStore("orders");store.clear();
    data.orders.forEach(o=>store.put(o));
    tx.oncomplete=async()=>{await render();$("backupDialog").close();toast("Backup importiert.")};
    tx.onerror=()=>toast("Import fehlgeschlagen.");
  }catch(err){toast(err.message||"Datei konnte nicht importiert werden.")}
}
$("newOrderBtn").addEventListener("click",openNew);$("emptyAddBtn").addEventListener("click",openNew);$("navNew").addEventListener("click",openNew);
$("backupBtn").addEventListener("click",openBackup);$("navBackup").addEventListener("click",openBackup);
$("exportBtn").addEventListener("click",exportData);
$("importFile").addEventListener("change",e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value=""});
$("closeDialog").addEventListener("click",()=>$("orderDialog").close());$("cancelBtn").addEventListener("click",()=>$("orderDialog").close());
$("closeBackup").addEventListener("click",()=>$("backupDialog").close());
$("searchInput").addEventListener("input",render);$("filterStatus").addEventListener("change",render);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
openDB().then(render).catch(()=>toast("Speicher konnte nicht geöffnet werden."));
