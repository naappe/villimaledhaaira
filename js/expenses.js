const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'MVR'});
const seed=[
{id:142,date:'2026-07-24',category:'Marketing',reference:'EXP-00142',note:'Facebook Ad Campaign',amount:450,status:'Paid'},
{id:141,date:'2026-07-22',category:'Office Supplies',reference:'EXP-00141',note:'Printer Ink and Paper',amount:125.5,status:'Paid'},
{id:140,date:'2026-07-20',category:'Utilities',reference:'EXP-00140',note:'Monthly Internet Bill',amount:89.99,status:'Pending'},
{id:139,date:'2026-07-18',category:'Travel',reference:'EXP-00139',note:'Client Meeting Transportation',amount:45,status:'Paid'},
{id:138,date:'2026-07-15',category:'Marketing',reference:'EXP-00138',note:'Flyer Printing',amount:210,status:'Paid'},
{id:137,date:'2026-07-12',category:'Operations',reference:'EXP-00137',note:'Equipment servicing',amount:780,status:'Pending'},
{id:136,date:'2026-07-09',category:'Office Supplies',reference:'EXP-00136',note:'Receipt paper rolls',amount:320,status:'Paid'},
{id:135,date:'2026-07-05',category:'Utilities',reference:'EXP-00135',note:'Electricity bill',amount:1250,status:'Pending'},
{id:134,date:'2026-06-29',category:'Travel',reference:'EXP-00134',note:'Supplier visit ferry tickets',amount:96,status:'Paid'},
{id:133,date:'2026-06-25',category:'Operations',reference:'EXP-00133',note:'Store maintenance',amount:640,status:'Pending'}
];
let rows=[...seed],page=1,editingId=null;const perPage=5;
const categoryClass=value=>value.toLowerCase().replace(/\s+/g,'-');
const dateLabel=value=>new Date(value+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});
export function initExpenses(){
 const search=document.querySelector('#expense-search'),status=document.querySelector('#expense-status'),body=document.querySelector('#expense-rows'),pages=document.querySelector('#expense-pages'),modal=document.querySelector('#expense-modal'),form=document.querySelector('#expense-form');
 if(!body)return;
 function filtered(){const q=search.value.trim().toLowerCase();return rows.filter(x=>(status.value==='all'||x.status===status.value)&&(!q||[x.category,x.reference,x.note,x.status].some(v=>v.toLowerCase().includes(q))))}
 function totals(){document.querySelector('#expense-total').textContent=money.format(rows.reduce((s,x)=>s+x.amount,0));const month='2026-07';document.querySelector('#expense-month').textContent=money.format(rows.filter(x=>x.date.startsWith(month)).reduce((s,x)=>s+x.amount,0));document.querySelector('#expense-pending').textContent=rows.filter(x=>x.status==='Pending').length}
 function render(){const list=filtered(),count=list.length,max=Math.max(1,Math.ceil(count/perPage));page=Math.min(page,max);const start=(page-1)*perPage;body.innerHTML=list.slice(start,start+perPage).map(x=>`<tr><td>${dateLabel(x.date)}</td><td><span class="category-tag ${categoryClass(x.category)}">${x.category}</span></td><td class="muted">${x.reference}</td><td>${x.note}</td><td>${money.format(x.amount)}</td><td><span class="status-tag ${x.status.toLowerCase()}">${x.status}</span></td><td class="row-actions"><button data-edit="${x.id}" aria-label="Edit">✎</button><button data-delete="${x.id}" aria-label="Delete">♲</button></td></tr>`).join('')||'<tr><td class="empty-row" colspan="7">No expenses found.</td></tr>';document.querySelector('#expense-count').textContent=count?`Showing ${start+1} to ${Math.min(start+perPage,count)} of ${count} entries`:'Showing 0 entries';pages.innerHTML=`<button data-page="${page-1}" ${page===1?'disabled':''}>Prev</button>${Array.from({length:max},(_,i)=>`<button data-page="${i+1}" class="${page===i+1?'active':''}">${i+1}</button>`).join('')}<button data-page="${page+1}" ${page===max?'disabled':''}>Next</button>`;totals()}
 function open(item=null){editingId=item?.id||null;document.querySelector('#expense-modal-title').textContent=item?'Edit Expense':'New Expense';form.reset();form.date.value=item?.date||new Date().toISOString().slice(0,10);if(item)Object.entries(item).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v});modal.hidden=false}
 const close=()=>{modal.hidden=true;editingId=null};
 search.oninput=()=>{page=1;render()};status.onchange=()=>{page=1;render()};document.querySelector('#expense-filter').onclick=()=>{status.hidden=!status.hidden};document.querySelector('#new-expense').onclick=()=>open();document.querySelectorAll('[data-expense-close]').forEach(x=>x.onclick=close);
 pages.onclick=e=>{const button=e.target.closest('[data-page]');if(button&&!button.disabled){page=Number(button.dataset.page);render()}};
 body.onclick=e=>{const edit=e.target.closest('[data-edit]'),remove=e.target.closest('[data-delete]');if(edit)open(rows.find(x=>x.id===Number(edit.dataset.edit)));if(remove&&confirm('Delete this expense?')){rows=rows.filter(x=>x.id!==Number(remove.dataset.delete));render()}};
 form.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));const item={id:editingId||Math.max(...rows.map(x=>x.id))+1,...data,amount:Number(data.amount)};rows=editingId?rows.map(x=>x.id===editingId?item:x):[item,...rows];close();page=1;render()};render();
}
