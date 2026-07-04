let rows=[], filtered=[], selected=null;
const params=new URLSearchParams(location.search);
const forcedParty=(params.get('party')||'').toUpperCase();
const norm=v=>String(v||'').trim().toLowerCase().replaceAll('_','-').replace(/\s+/g,'-');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function canSeeParty(){return true}
async function init(){
  if(forcedParty){party.value=forcedParty;title.textContent=forcedParty+' Campaign Dashboard';totalLabel.textContent=forcedParty+' Voters'}
  const sb=createSupabaseClient();
  let q=sb.from('full_import').select('*').order('image_number',{ascending:true});
  const {data,error}=await q; rows=error?[]:data; applyFilters();
}
function applyFilters(){
  const s=search.value.toLowerCase().trim(), p=party.value, r=reach.value, v=vote.value;
  filtered=rows.filter(x=>canSeeParty(x.party)).filter(x=>!p||String(x.party||'').toUpperCase()===p).filter(x=>!r||norm(x.reach_status||'not-reached')===r).filter(x=>!v||norm(x.vote_status||'pending')===v).filter(x=>!s||[x.name,x.national_id,x.house,x.lives_in,x.phone,x.remarks].join(' ').toLowerCase().includes(s));
  render();
}
function render(){
  total.textContent=filtered.length;
  reached.textContent=filtered.filter(x=>norm(x.reach_status)==='reached').length;
  will.textContent=filtered.filter(x=>norm(x.vote_status)==='will-vote').length;
  pending.textContent=filtered.filter(x=>!x.vote_status||norm(x.vote_status)==='pending').length;
  cards.innerHTML=filtered.map(x=>`<article class="voter" onclick="openModal(${x.id})"><div class="party-strip">${esc(x.party||'N/A')}</div><div class="body"><div class="name">${esc(x.name||'Unknown')}</div><div class="row"><span>House</span><b>${esc([x.house,x.lives_in].filter(Boolean).join(', ')||'N/A')}</b></div><div class="row"><span>ID</span><b>${esc(x.national_id||'N/A')}</b></div><div class="row"><span>Phone</span><b>${esc(x.phone||'N/A')}</b></div><div class="row"><span>Reach</span><b>${esc(norm(x.reach_status||'not-reached'))}</b></div><div class="row"><span>Vote</span><b>${esc(norm(x.vote_status||'pending'))}</b></div>${x.remarks?`<p>${esc(x.remarks)}</p>`:''}</div></article>`).join('')||'<div class="card">No voters found</div>';
}
function resetFilters(){search.value='';reach.value='';vote.value='';party.value=forcedParty||'';applyFilters()}
function openModal(id){selected=rows.find(x=>x.id===id); if(!selected)return; mn.textContent=selected.name||'Unknown';mid.textContent=selected.national_id||'';mphone.value=selected.phone||'';mreach.value=norm(selected.reach_status||'not-reached');mvote.value=norm(selected.vote_status||'pending');mremarks.value=selected.remarks||'';modal.classList.add('active')}
function closeModal(){modal.classList.remove('active');selected=null}
editForm.onsubmit=async e=>{e.preventDefault();if(!selected)return;const update={phone:mphone.value.trim(),reach_status:mreach.value,vote_status:mvote.value,remarks:mremarks.value.trim(),vote_assigned_at:new Date().toISOString()};const {error}=await createSupabaseClient().from('full_import').update(update).eq('id',selected.id);if(error){alert('Save failed');return}Object.assign(selected,update);closeModal();applyFilters()}
[search,party,reach,vote].forEach(x=>x.addEventListener('input',applyFilters));
init();