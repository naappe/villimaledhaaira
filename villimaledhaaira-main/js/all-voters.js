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

const miniTotal = document.getElementById('miniTotal');
const miniReached = document.getElementById('miniReached');
const miniWillVote = document.getElementById('miniWillVote');
const miniPending = document.getElementById('miniPending');
const miniNotDecided = document.getElementById('miniNotDecided');
const miniNoVote = document.getElementById('miniNoVote');
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
const popupPhoneInput = document.getElementById('popupPhoneInput');
const popupPhoneStatus = document.getElementById('popupPhoneStatus');
const popupReachStatus = document.getElementById('popupReachStatus');
const popupVoteStatus = document.getElementById('popupVoteStatus');
const popupSupportLevel = document.getElementById('popupSupportLevel');
const popupRemarks = document.getElementById('popupRemarks');
const popupForm = document.getElementById('popupForm');

async function fetchAllRows(client) {
    const pageSize = 1000;
    let from = 0;
    let rows = [];

    while (true) {
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('*')
            .order('image_number', { ascending: true })
            .range(from, from + pageSize - 1);

        if (error) throw error;
        rows = rows.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
    }

    return rows;
}

async function loadAllVoters() {
    voterGrid.innerHTML = '<div class="loading-state">Loading all voters...</div>';

    const supabaseClient = createSupabaseClient();
    if (!supabaseClient) {
        voterGrid.innerHTML = '<div class="no-results">Supabase connection failed</div>';
        return;
    }

    try {
        allVoters = await fetchAllRows(supabaseClient);
        filteredVoters = [...allVoters];
        updateUI();
    } catch (error) {
        console.error('Error loading all voters:', error);
        voterGrid.innerHTML = '<div class="no-results">Error loading voters</div>';
    }
}

async function initAllVoters() {
    activeRole = await requireAccess({
        roles: ['admin'],
        loginPath: 'login.html'
    });
    if (!activeRole) return;
    await loadAllVoters();
}

function updateUI() {
    populateHouseFilter(allVoters);
    renderTopHouses(allVoters);
    updateStats(filteredVoters);
    renderGrid(filteredVoters);
}

function populateHouseFilter(voters) {
    const selectedHouse = houseFilter.value;
    houseFilter.innerHTML = '<option value="">All Houses / Dhafthar Numbers</option>';
    getHouseOptions(voters).forEach(house => {
        const option = document.createElement('option');
        option.value = house;
        option.textContent = house;
        houseFilter.appendChild(option);
    });
    houseFilter.value = selectedHouse;
}

function renderTopHouses(voters) {
    const top = getTopHouses(voters);

    if (top.length === 0) {
        topHousesGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; padding:8px; font-size:12px;">No houses found</div>';
        topHousesCount.textContent = '';
        return;
    }

    topHousesCount.textContent = `(${top.length})`;
    topHousesGrid.innerHTML = top.map(([house, count], index) => {
        const rank = index < 3 ? ['#1', '#2', '#3'][index] : `#${index + 1}`;
        return `
            <div class="top-house-item" onclick="filterByHouse('${String(house).replace(/'/g, "\\'")}')">
                <span>${rank} ${house}</span>
                <span class="count">${count}</span>
            </div>
        `;
    }).join('');
}

function updateStats(voters) {
    const stats = calculateStats(voters);
    const reachedPercent = stats.total > 0 ? Math.round((stats.reached / stats.total) * 100) : 0;

    if (miniTotal) miniTotal.textContent = stats.total;
    if (miniReached) miniReached.textContent = stats.reached;
    if (miniWillVote) miniWillVote.textContent = stats.willVote;
    if (miniPending) miniPending.textContent = stats.pending;
    if (miniNotDecided) miniNotDecided.textContent = stats.notDecided;
    if (miniNoVote) miniNoVote.textContent = stats.noVote;

    dashReached.textContent = stats.reached;
    dashReachedPercent.textContent = reachedPercent + '% reached';
    dashNotReached.textContent = stats.notReached;
    dashWillVote.textContent = stats.willVote;
    dashNoVote.textContent = stats.noVote;
    dashNotDecided.textContent = stats.notDecided;
    dashPending.textContent = stats.pending;

    createStatusChart(document.getElementById('statusChart').getContext('2d'), voters);
    renderTopHouses(voters);
}

function renderGrid(voters) {
    voterGrid.classList.toggle('list-view', viewMode === 'list');

    if (voters.length === 0) {
        voterGrid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i>No voters found</div>';
        filterCount.innerHTML = 'Showing <strong>0</strong>';
        return;
    }

    voterGrid.innerHTML = voters.map(v => {
        const photoUrl = v.photo_url || '';
        const voteStatus = normalizeVoteStatus(v.vote_status);
        const party = v.party || 'N/A';
        const partyKey = String(party || '').trim().toLowerCase();
        const partyClass = partyKey === 'mdp' ? 'party-mdp' : partyKey === 'pnc' ? 'party-pnc' : 'party-none';
        const supportLevel = v.support_level || 'normal';
        const guaranteeClass = supportLevel === 'guaranteed' ? 'guaranteed-card' : '';
        const guaranteeBadge = supportLevel === 'guaranteed' ? '<span class="guarantee-badge">Guaranteed</span>' : '';
        const address = getHouseDisplay(v);
        const addressLabel = getHouseLabel(v);
        const phoneWork = getPhoneStatusLabel(v.phone_status);
        const sexDisplay = normalizeSex(v.sex) || 'N/A';
        const reach = normalizeReachStatus(v.reach_status) === 'reached' ? 'Reached' : 'Not Reached';
        const electionBox = v.election_box || 'Not matched';

        return `
            <div class="voter-card voter-card-clean ${partyClass} ${guaranteeClass}" onclick="openPopup(${v.id})">
                <div class="party-strip">
                    <span>${party}</span>
                    ${guaranteeBadge}
                </div>
                <div class="photo">
                    ${photoUrl ?
                        `<img src="${photoUrl}" alt="${v.name || 'Voter'}" loading="lazy"
                              onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'no-photo\\'>Photo</span>';" />` :
                        '<span class="no-photo">Photo</span>'
                    }
                </div>
                <div class="status-bar ${voteStatus}">${getVoteStatusLabel(voteStatus)}</div>
                <div class="info">
                    <div class="card-head">
                        <div class="name">${v.name || 'Unknown'}</div>
                        <span class="reach-chip">${reach}</span>
                    </div>
                    <div class="clean-row"><span>${addressLabel}</span><strong>${address}</strong></div>
                    <div class="clean-row"><span>ID</span><strong>${v.national_id || 'N/A'}</strong></div>
                    <div class="clean-row box-row"><span>Box</span><strong>${electionBox}</strong></div>
                    <div class="clean-meta">
                        <span>Phone: <strong>${v.phone || 'N/A'}</strong></span>
                        <span>Call: <strong>${phoneWork}</strong></span>
                        <span>Age: <strong>${v.age || 'N/A'}</strong></span>
                        <span>Sex: <strong>${sexDisplay}</strong></span>
                    </div>
                    ${v.remarks ? `<div class="remarks"><i class="fas fa-comment"></i> ${v.remarks}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    filterCount.innerHTML = `Viewing <strong>${voters.length}</strong> of <strong>${allVoters.length}</strong>`;
}

function filterVoters() {
    const search = searchInput.value.trim();
    const party = partyFilter.value;
    const status = statusFilter.value;
    const phoneStatus = phoneStatusFilter.value;
    const house = houseFilter.value;

    filteredVoters = filterVotersList(allVoters, search, status, house).filter(v => {
        return !party || String(v.party || '').toUpperCase() === party;
    }).filter(v => {
        return !phoneStatus || normalizePhoneStatus(v.phone_status) === phoneStatus;
    });

    renderGrid(filteredVoters);
    updateStats(allVoters);
    updateActiveCard(status);
}

function updateActiveCard(status) {
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    if (status) {
        document.querySelector(`.stat-card[data-filter="${status}"]`)?.classList.add('active');
    }
}

function backToAll() {
    searchInput.value = '';
    partyFilter.value = '';
    statusFilter.value = '';
    phoneStatusFilter.value = '';
    houseFilter.value = '';
    quickActionButtons.forEach(button => button.classList.remove('active'));
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    filteredVoters = [...allVoters];
    renderGrid(filteredVoters);
    updateStats(allVoters);
}

function filterByStatus(status) {
    statusFilter.value = status;
    filterVoters();
}

function filterByHouse(house) {
    houseFilter.value = house;
    filterVoters();
}

function runQuickAction(action) {
    quickActionButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.quick === action);
    });

    if (action === 'all') {
        backToAll();
        quickActionButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.quick === 'all');
        });
        return;
    }

    searchInput.value = '';
    houseFilter.value = '';
    partyFilter.value = '';
    statusFilter.value = '';
    phoneStatusFilter.value = '';

    if (action === 'guaranteed') {
        filteredVoters = allVoters.filter(v => (v.support_level || 'normal') === 'guaranteed');
        renderGrid(filteredVoters);
        updateStats(allVoters);
        updateActiveCard('');
        return;
    } else if (action === 'need-call') {
        phoneStatusFilter.value = 'need-call';
    } else if (action === 'remarks') {
        filteredVoters = allVoters.filter(v => Boolean((v.remarks || '').trim()));
        renderGrid(filteredVoters);
        updateStats(allVoters);
        updateActiveCard('');
        return;
    } else if (action === 'mdp') {
        partyFilter.value = 'MDP';
    } else if (action === 'pnc') {
        partyFilter.value = 'PNC';
    } else if (action === 'follow-up') {
        statusFilter.value = 'not-decided';
    }

    filterVoters();
}

function setViewMode(mode) {
    viewMode = mode;
    galleryViewBtn.classList.toggle('active', mode === 'gallery');
    listViewBtn.classList.toggle('active', mode === 'list');
    renderGrid(filteredVoters);
}

function openPopup(id) {
    const voter = allVoters.find(v => v.id === id);
    if (!voter) return;

    selectedVoterId = id;
    const photoUrl = voter.photo_url || '';
    popupPhoto.innerHTML = photoUrl
        ? `<img src="${photoUrl}" alt="${voter.name || 'Voter'}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'placeholder\\'>Photo</span>';" />`
        : '<span class="placeholder">Photo</span>';

    popupName.textContent = voter.name || 'Unknown';
    popupId.textContent = voter.national_id || 'N/A';
    document.getElementById('popupHouseLabel').textContent = getHouseLabel(voter);
    popupHouse.textContent = getHouseDisplay(voter);
    popupPhone.textContent = voter.phone || 'N/A';
    popupAge.textContent = voter.age || 'N/A';
    popupSex.textContent = normalizeSex(voter.sex) || 'N/A';
    popupParty.textContent = voter.party || 'N/A';
    popupElectionBox.textContent = voter.election_box || 'Not matched';

    popupPhoneInput.value = '';
    popupPhoneStatus.value = normalizePhoneStatus(voter.phone_status);
    popupReachStatus.value = voter.reach_status || 'not-reached';
    popupVoteStatus.value = voter.vote_status || 'pending';
    popupSupportLevel.value = voter.support_level || 'normal';
    popupRemarks.value = voter.remarks || '';
    updatePopupCallLink(voter.phone);
    updatePopupActionButtons();

    popupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    selectedVoterId = null;
}

async function savePopup(e) {
    e.preventDefault();
    if (selectedVoterId === null) return;
    if (activeRole && !activeRole.canEdit) {
        alert('You do not have permission to edit voters.');
        return;
    }

    const supabaseClient = createSupabaseClient();
    if (!supabaseClient) {
        alert('Failed to connect');
        return;
    }

    const phone = popupPhoneInput.value.trim();
    const phone_status = popupPhoneStatus.value;
    const vote_status = popupVoteStatus.value;
    const support_level = popupSupportLevel.value;
    const reach_status = getAutoReachStatus(phone_status, vote_status, support_level, popupReachStatus.value);
    const remarks = popupRemarks.value.trim();
    const updateData = { phone, phone_status, reach_status, vote_status, support_level, remarks };

    const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', selectedVoterId)
        .select();

    if (error) {
        console.error('Failed to update voter:', error);
        alert('Failed to save');
        return;
    }

    const voter = allVoters.find(v => v.id === selectedVoterId);
    if (voter) Object.assign(voter, data?.[0] || updateData);

    filterVoters();
    closePopup();
}

applyBtn.addEventListener('click', filterVoters);
resetBtn.addEventListener('click', backToAll);
searchInput.addEventListener('input', filterVoters);
partyFilter.addEventListener('change', filterVoters);
statusFilter.addEventListener('change', filterVoters);
phoneStatusFilter.addEventListener('change', filterVoters);
houseFilter.addEventListener('change', filterVoters);
galleryViewBtn.addEventListener('click', () => setViewMode('gallery'));
listViewBtn.addEventListener('click', () => setViewMode('list'));
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => runQuickAction(button.dataset.quick));
});

popupClose.addEventListener('click', closePopup);
btnClosePopup.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', e => {
    if (e.target === popupOverlay) closePopup();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopup();
});
popupForm.addEventListener('submit', savePopup);
setupPopupActionButtons();

window.openPopup = openPopup;
window.closePopup = closePopup;
window.filterByStatus = filterByStatus;
window.filterByHouse = filterByHouse;
window.backToAll = backToAll;

initAllVoters();
