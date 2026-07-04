const TABLE_NAME = 'full_import';

let allVoters = [];
let filteredVoters = [];
let selectedVoterId = null;
let viewMode = 'gallery';
let activeRole = null;

const voterGrid = document.getElementById('voterGrid');
const searchInput = document.getElementById('searchInput');
const partyFilter = document.getElementById('partyFilter');
const statusFilter = document.getElementById('statusFilter');
const phoneStatusFilter = document.getElementById('phoneStatusFilter');
const houseFilter = document.getElementById('houseFilter');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const filterCount = document.getElementById('filterCount');
const galleryViewBtn = document.getElementById('galleryViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const quickActionButtons = document.querySelectorAll('.quick-actions button');
const topHousesGrid = document.getElementById('topHousesGrid');
const topHousesCount = document.getElementById('topHousesCount');
const dashReached = document.getElementById('dashReached');
const dashReachedPercent = document.getElementById('dashReachedPercent');
const dashNotReached = document.getElementById('dashNotReached');
const dashWillVote = document.getElementById('dashWillVote');
const dashNoVote = document.getElementById('dashNoVote');
const dashNotDecided = document.getElementById('dashNotDecided');
const dashPending = document.getElementById('dashPending');
const popupOverlay = document.getElementById('popupOverlay');
const popupClose = document.getElementById('popupClose');
const btnClosePopup = document.getElementById('btnClosePopup');
const popupPhoto = document.getElementById('popupPhoto');
const popupName = document.getElementById('popupName');
const popupId = document.getElementById('popupId');
const popupHouse = document.getElementById('popupHouse');
const popupPhone = document.getElementById('popupPhone');
const popupAge = document.getElementById('popupAge');
const popupSex = document.getElementById('popupSex');
const popupParty = document.getElementById('popupParty');
const popupElectionBox = document.getElementById('popupElectionBox');
const popupAssignedBy = document.getElementById('popupAssignedBy');
const popupPhoneInput = document.getElementById('popupPhoneInput');
const popupPhoneStatus = document.getElementById('popupPhoneStatus');
const popupReachStatus = document.getElementById('popupReachStatus');
const popupVoteStatus = document.getElementById('popupVoteStatus');
const popupSupportLevel = document.getElementById('popupSupportLevel');
const popupRemarks = document.getElementById('popupRemarks');
const popupForm = document.getElementById('popupForm');

function isPartyUser() { return activeRole && activeRole.role !== 'admin' && activeRole.party; }
function allowedParty() { return isPartyUser() ? String(activeRole.party).toUpperCase() : ''; }
function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function cleanRemark(value) { const r = String(value || '').trim(); return /^(MDP|PNC)\s+match\s+via\s+/i.test(r) ? '' : r; }
function formatAssignedBy(voter) { const email = String(voter?.vote_assigned_by || '').trim(); const at = voter?.vote_assigned_at ? new Date(voter.vote_assigned_at) : null; const dt = at && !Number.isNaN(at.getTime()) ? at.toLocaleString() : ''; return [email, dt].filter(Boolean).join(' • ') || 'Not saved yet'; }

function applyRoleUi() {
    if (!isPartyUser()) return;
    const party = allowedParty();
    document.title = `${party} Campaign Tracker`;
    if (partyFilter) {
        partyFilter.innerHTML = `<option value="${party}">${party}</option>`;
        partyFilter.value = party;
        partyFilter.disabled = true;
    }
    quickActionButtons.forEach(btn => {
        const q = btn.dataset.quick;
        if (q === 'all' || q === 'mdp' || q === 'pnc') btn.style.display = 'none';
    });
    document.querySelectorAll('.stat-card[data-filter]').forEach(card => card.title = `${party} only`);
}

async function fetchRows(client) {
    const pageSize = 1000;
    let from = 0;
    let rows = [];
    while (true) {
        let query = client.from(TABLE_NAME).select('*').order('image_number', { ascending: true }).range(from, from + pageSize - 1);
        if (isPartyUser()) query = query.eq('party', allowedParty());
        const { data, error } = await query;
        if (error) throw error;
        rows = rows.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
    }
    return rows;
}

async function loadAllVoters() {
    voterGrid.innerHTML = `<div class="loading-state">Loading ${allowedParty() || 'all'} voters...</div>`;
    const client = createSupabaseClient();
    if (!client) { voterGrid.innerHTML = '<div class="no-results">Supabase connection failed</div>'; return; }
    try {
        allVoters = await fetchRows(client);
        filteredVoters = [...allVoters];
        updateUI();
    } catch (error) {
        console.error('Error loading voters:', error);
        voterGrid.innerHTML = '<div class="no-results">Error loading voters</div>';
    }
}

async function initAllVoters() {
    activeRole = await requireAccess({ loginPath: 'login.html' });
    if (!activeRole) return;
    applyRoleUi();
    await loadAllVoters();
}

function updateUI() { populateHouseFilter(allVoters); renderTopHouses(filteredVoters); updateStats(filteredVoters); renderGrid(filteredVoters); }
function populateHouseFilter(voters) { const selected = houseFilter.value; houseFilter.innerHTML = '<option value="">All Houses / Dhafthar Numbers</option>'; getHouseOptions(voters).forEach(h => { const o = document.createElement('option'); o.value = h; o.textContent = h; houseFilter.appendChild(o); }); houseFilter.value = selected; }
function renderTopHouses(voters) { const top = getTopHouses(voters); topHousesCount.textContent = top.length ? `(${top.length})` : ''; topHousesGrid.innerHTML = top.length ? top.map(([h,c],i)=>`<div class="top-house-item" onclick="filterByHouse('${String(h).replace(/'/g,"\\'")}')"><span>#${i+1} ${escapeHtml(h)}</span><span class="count">${c}</span></div>`).join('') : '<div style="grid-column:1/-1; text-align:center; color:#888; padding:8px; font-size:12px;">No houses found</div>'; }
function updateStats(voters) { const s = calculateStats(voters); const pct = s.total ? Math.round((s.reached/s.total)*100) : 0; dashReached.textContent=s.reached; dashReachedPercent.textContent=pct+'% reached'; dashNotReached.textContent=s.notReached; dashWillVote.textContent=s.willVote; dashNoVote.textContent=s.noVote; dashNotDecided.textContent=s.notDecided; dashPending.textContent=s.pending; const canvas=document.getElementById('statusChart'); if(canvas&&window.Chart) createStatusChart(canvas.getContext('2d'), voters); }

function renderGrid(voters) {
    voterGrid.classList.toggle('list-view', viewMode === 'list');
    if (!voters.length) { voterGrid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i>No voters found</div>'; filterCount.innerHTML='Showing <strong>0</strong>'; return; }
    voterGrid.innerHTML = voters.map(v => {
        const voteStatus = normalizeVoteStatus(v.vote_status);
        const party = v.party || 'N/A';
        const partyClass = String(party).toLowerCase()==='mdp'?'party-mdp':String(party).toLowerCase()==='pnc'?'party-pnc':'party-none';
        const support = v.support_level || 'normal';
        const remark = cleanRemark(v.remarks);
        return `<div class="voter-card voter-card-clean ${partyClass} ${support==='guaranteed'?'guaranteed-card':''}" onclick="openPopup(${v.id})">
            <div class="party-strip"><span>${escapeHtml(party)}</span>${support==='guaranteed'?'<span class="guarantee-badge">Guaranteed</span>':''}</div>
            <div class="photo">${v.photo_url?`<img src="${escapeHtml(v.photo_url)}" alt="${escapeHtml(v.name||'Voter')}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'no-photo\\'>Photo</span>';" />`:'<span class="no-photo">Photo</span>'}</div>
            <div class="status-bar ${voteStatus}">${getVoteStatusLabel(voteStatus)}</div>
            <div class="info"><div class="card-head"><div class="name">${escapeHtml(v.name||'Unknown')}</div><span class="reach-chip">${normalizeReachStatus(v.reach_status)==='reached'?'Reached':'Not Reached'}</span></div>
            <div class="clean-row"><span>${getHouseLabel(v)}</span><strong>${escapeHtml(getHouseDisplay(v))}</strong></div><div class="clean-row"><span>ID</span><strong>${escapeHtml(v.national_id||'N/A')}</strong></div><div class="clean-row box-row"><span>Box</span><strong>${escapeHtml(v.election_box||'Not matched')}</strong></div>
            <div class="clean-meta"><span>Phone: <strong>${escapeHtml(v.phone||'N/A')}</strong></span><span>Call: <strong>${escapeHtml(getPhoneStatusLabel(v.phone_status))}</strong></span><span>Age: <strong>${escapeHtml(v.age||'N/A')}</strong></span><span>Sex: <strong>${escapeHtml(normalizeSex(v.sex)||'N/A')}</strong></span></div>
            <div class="assigned-line">Updated by: ${escapeHtml(formatAssignedBy(v))}</div>${remark?`<div class="remarks"><i class="fas fa-comment"></i> ${escapeHtml(remark)}</div>`:''}</div></div>`;
    }).join('');
    filterCount.innerHTML = `Viewing <strong>${voters.length}</strong> of <strong>${allVoters.length}</strong>${isPartyUser() ? ' PNC voters' : ''}`;
}

function filterVoters() {
    const search = searchInput.value.trim();
    const party = isPartyUser() ? allowedParty() : partyFilter.value;
    const status = statusFilter.value;
    const phoneStatus = phoneStatusFilter.value;
    const house = houseFilter.value;
    filteredVoters = filterVotersList(allVoters, search, status, house).filter(v => !party || String(v.party || '').toUpperCase() === party).filter(v => !phoneStatus || normalizePhoneStatus(v.phone_status) === phoneStatus);
    renderGrid(filteredVoters); updateStats(filteredVoters); updateActiveCard(status);
}
function updateActiveCard(status) { document.querySelectorAll('.stat-card').forEach(c=>c.classList.remove('active')); if(status) document.querySelector(`.stat-card[data-filter="${status}"]`)?.classList.add('active'); }
function backToAll() { searchInput.value=''; statusFilter.value=''; phoneStatusFilter.value=''; houseFilter.value=''; if(!isPartyUser()) partyFilter.value=''; quickActionButtons.forEach(b=>b.classList.remove('active')); filteredVoters=[...allVoters]; updateUI(); }
function filterByStatus(status) { statusFilter.value=status; filterVoters(); }
function filterByHouse(house) { houseFilter.value=house; filterVoters(); }
function runQuickAction(action) { if(isPartyUser() && ['all','mdp','pnc'].includes(action)) return; quickActionButtons.forEach(b=>b.classList.toggle('active', b.dataset.quick===action)); if(action==='all'){backToAll();return;} searchInput.value=''; houseFilter.value=''; statusFilter.value=''; phoneStatusFilter.value=''; if(!isPartyUser()) partyFilter.value=''; if(action==='guaranteed'){filteredVoters=allVoters.filter(v=>(v.support_level||'normal')==='guaranteed');renderGrid(filteredVoters);updateStats(filteredVoters);return;} if(action==='remarks'){filteredVoters=allVoters.filter(v=>Boolean(cleanRemark(v.remarks)));renderGrid(filteredVoters);updateStats(filteredVoters);return;} if(action==='need-call') phoneStatusFilter.value='need-call'; if(action==='mdp') partyFilter.value='MDP'; if(action==='pnc') partyFilter.value='PNC'; filterVoters(); }
function setViewMode(mode) { viewMode=mode; galleryViewBtn.classList.toggle('active',mode==='gallery'); listViewBtn.classList.toggle('active',mode==='list'); renderGrid(filteredVoters); }

function openPopup(id) { const v = allVoters.find(x=>x.id===id); if(!v) return; selectedVoterId=id; popupPhoto.innerHTML=v.photo_url?`<img src="${escapeHtml(v.photo_url)}" alt="${escapeHtml(v.name||'Voter')}" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'placeholder\\'>Photo</span>';" />`:'<span class="placeholder">Photo</span>'; popupName.textContent=v.name||'Unknown'; popupId.textContent=v.national_id||'N/A'; document.getElementById('popupHouseLabel').textContent=getHouseLabel(v); popupHouse.textContent=getHouseDisplay(v); popupPhone.textContent=v.phone||'N/A'; popupAge.textContent=v.age||'N/A'; popupSex.textContent=normalizeSex(v.sex)||'N/A'; popupParty.textContent=v.party||'N/A'; popupElectionBox.textContent=v.election_box||'Not matched'; if(popupAssignedBy) popupAssignedBy.textContent=formatAssignedBy(v); popupPhoneInput.value=v.phone||''; popupPhoneStatus.value=normalizePhoneStatus(v.phone_status); popupReachStatus.value=v.reach_status||'not-reached'; popupVoteStatus.value=v.vote_status||'pending'; popupSupportLevel.value=v.support_level||'normal'; popupRemarks.value=cleanRemark(v.remarks); updatePopupCallLink(v.phone); updatePopupActionButtons(); popupOverlay.classList.add('active'); document.body.style.overflow='hidden'; }
function closePopup() { popupOverlay.classList.remove('active'); document.body.style.overflow='auto'; selectedVoterId=null; }
async function savePopup(e) { e.preventDefault(); if(selectedVoterId===null) return; if(activeRole&&!activeRole.canEdit){alert('You do not have permission to edit voters.');return;} const client=createSupabaseClient(); const voter=allVoters.find(v=>v.id===selectedVoterId); if(isPartyUser() && String(voter?.party||'').toUpperCase()!==allowedParty()){alert('Access denied.');closePopup();return;} const updateData={ phone:popupPhoneInput.value.trim(), phone_status:popupPhoneStatus.value, reach_status:getAutoReachStatus(popupPhoneStatus.value,popupVoteStatus.value,popupSupportLevel.value,popupReachStatus.value), vote_status:popupVoteStatus.value, support_level:popupSupportLevel.value, remarks:popupRemarks.value.trim(), vote_assigned_by:activeRole?.user?.email||window.ADMIN_EMAIL||'admin', vote_assigned_at:new Date().toISOString() }; let q=client.from(TABLE_NAME).update(updateData).eq('id',selectedVoterId); if(isPartyUser()) q=q.eq('party',allowedParty()); const {data,error}=await q.select(); if(error){console.error(error);alert('Failed to save');return;} if(voter) Object.assign(voter,data?.[0]||updateData); filterVoters(); closePopup(); }

applyBtn.addEventListener('click', filterVoters); resetBtn.addEventListener('click', backToAll); searchInput.addEventListener('input', filterVoters); partyFilter.addEventListener('change', filterVoters); statusFilter.addEventListener('change', filterVoters); phoneStatusFilter.addEventListener('change', filterVoters); houseFilter.addEventListener('change', filterVoters); galleryViewBtn.addEventListener('click',()=>setViewMode('gallery')); listViewBtn.addEventListener('click',()=>setViewMode('list')); quickActionButtons.forEach(b=>b.addEventListener('click',()=>runQuickAction(b.dataset.quick))); popupClose.addEventListener('click',closePopup); btnClosePopup.addEventListener('click',closePopup); popupOverlay.addEventListener('click',e=>{if(e.target===popupOverlay)closePopup();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopup();}); popupForm.addEventListener('submit',savePopup); setupPopupActionButtons();
window.openPopup=openPopup; window.closePopup=closePopup; window.filterByStatus=filterByStatus; window.filterByHouse=filterByHouse; window.backToAll=backToAll;
initAllVoters();
