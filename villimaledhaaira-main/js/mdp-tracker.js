// ============================================
// MDP TRACKER - SPECIFIC LOGIC
// ============================================

// ============================================
// CONFIG
// ============================================
const PARTY_NAME = 'MDP';
const PARTY_CONFIG = getPartyConfig(PARTY_NAME);
const PARTY_COLOR = PARTY_CONFIG ? PARTY_CONFIG.color : '#f5a623';

let allVoters = [];
let filteredVoters = [];
let selectedVoterId = null;
let target = parseInt(localStorage.getItem('mdpReachTarget')) || 100;
let currentPage = 1;
const pageSize = 10000;
let activeRole = null;
let activeTask = '';
let viewMode = 'gallery';

// ============================================
// DOM ELEMENTS
// ============================================
const voterGrid = document.getElementById('voterGrid');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const phoneStatusFilter = document.getElementById('phoneStatusFilter');
const houseFilter = document.getElementById('houseFilter');
const remarksFilter = document.getElementById('remarksFilter');
const galleryViewBtn = document.getElementById('galleryViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const taskButtons = document.querySelectorAll('.task-card');
const clearTaskBtn = document.getElementById('clearTaskBtn');
const taskCallFirst = document.getElementById('taskCallFirst');
const taskVisit = document.getElementById('taskVisit');
const taskFollowUp = document.getElementById('taskFollowUp');
const taskPending = document.getElementById('taskPending');
const taskConfirmed = document.getElementById('taskConfirmed');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const filterCount = document.getElementById('filterCount');
const exportBtn = document.getElementById('exportBtn');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

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

const targetBar = document.getElementById('targetBar');
const targetPercent = document.getElementById('targetPercent');
const targetInput = document.getElementById('targetInput');
const setTargetBtn = document.getElementById('setTargetBtn');
const targetNeed = document.getElementById('targetNeed');

const mainApp = document.getElementById('mainApp');

// Popup
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
const popupElectionBox = document.getElementById('popupElectionBox');
const popupPhoneInput = document.getElementById('popupPhoneInput');
const popupPhoneStatus = document.getElementById('popupPhoneStatus');
const popupReachStatus = document.getElementById('popupReachStatus');
const popupVoteStatus = document.getElementById('popupVoteStatus');
const popupSupportLevel = document.getElementById('popupSupportLevel');
const popupRemarks = document.getElementById('popupRemarks');
const popupForm = document.getElementById('popupForm');

// ============================================
// LOAD MDP DATA
// ============================================
async function loadMDPData() {
    voterGrid.innerHTML = '<div class="loading-state">Loading MDP voters...</div>';

    const voters = await fetchPartyVoters(PARTY_NAME);
    if (voters) {
        allVoters = voters;
        filteredVoters = [...allVoters];
        updateUI();
    }
}

async function initMDPData() {
    activeRole = await requireAccess({
        roles: ['admin'],
        parties: ['MDP'],
        loginPath: '../login.html'
    });
    if (!activeRole) return;
    mainApp.style.display = 'block';
    if (!activeRole.canExport && exportBtn) {
        exportBtn.style.display = 'none';
    }
    await loadMDPData();
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    populateHouseFilter(allVoters);
    updateTaskCounts(allVoters);
    renderTopHouses(allVoters);
    updateStats(allVoters);
    renderGrid(filteredVoters);
    updatePagination();
}

// ============================================
// RENDER TOP HOUSES
// ============================================
function renderTopHouses(voters) {
    const top = getTopHouses(voters);

    if (top.length === 0) {
        topHousesGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; padding:8px; font-size:12px;">No houses found</div>';
        topHousesCount.textContent = '';
        return;
    }

    topHousesCount.textContent = `(${top.length})`;

    let html = '';
    top.forEach(([house, count], index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = index < 3 ? medals[index] : `#${index + 1}`;
        html += `
            <div class="top-house-item" onclick="filterByHouse('${house.replace(/'/g, "\\'")}')">
                <span>${medal} ${house}</span>
                <span class="count">${count}</span>
            </div>
        `;
    });

    topHousesGrid.innerHTML = html;
}

// ============================================
// POPULATE HOUSE FILTER
// ============================================
function populateHouseFilter(voters) {
    const houses = getHouseOptions(voters);
    houseFilter.innerHTML = '<option value="">All Houses / Dhafthar Numbers</option>';
    houses.forEach(h => {
        const option = document.createElement('option');
        option.value = h;
        option.textContent = h;
        houseFilter.appendChild(option);
    });
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats(voters) {
    const stats = calculateStats(voters);

    if (miniTotal) miniTotal.textContent = stats.total;
    if (miniReached) miniReached.textContent = stats.reached;
    if (miniWillVote) miniWillVote.textContent = stats.willVote;
    if (miniPending) miniPending.textContent = stats.pending;
    if (miniNotDecided) miniNotDecided.textContent = stats.notDecided;
    if (miniNoVote) miniNoVote.textContent = stats.noVote;

    dashReached.textContent = stats.reached;
    const reachedPercent = target > 0 ? Math.round((stats.reached / target) * 100) : 0;
    dashReachedPercent.textContent = reachedPercent + '% reached';
    dashNotReached.textContent = stats.notReached;
    dashWillVote.textContent = stats.willVote;
    dashNoVote.textContent = stats.noVote;
    dashNotDecided.textContent = stats.notDecided;
    dashPending.textContent = stats.pending;

    updateTargetProgress(stats);
    createStatusChart(document.getElementById('statusChart').getContext('2d'), voters);
    renderTopHouses(voters);
}

// ============================================
// UPDATE TARGET PROGRESS
// ============================================
function updateTargetProgress(stats) {
    const guaranteed = allVoters.filter(v => (v.support_level || 'normal') === 'guaranteed').length;
    const progress = target > 0 ? Math.min((guaranteed / target) * 100, 100) : 0;

    targetBar.style.width = progress + '%';
    targetPercent.textContent = Math.round(progress) + '%';

    const need = Math.max(target - guaranteed, 0);
    targetNeed.textContent = need;

    if (progress >= 100) {
        targetBar.className = 'bar over';
    } else {
        targetBar.className = 'bar';
    }

    targetInput.value = target;
}

// ============================================
// RENDER GRID
// ============================================
function renderGrid(voters) {
    voterGrid.classList.toggle('list-view', viewMode === 'list');

    const totalPages = Math.max(1, Math.ceil(voters.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, voters.length);
    const pageVoters = voters.slice(start, end);

    if (pageVoters.length === 0) {
        voterGrid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i>No voters found</div>`;
        filterCount.innerHTML = 'Showing <strong>0</strong>';
        return;
    }

    let html = '';
    pageVoters.forEach(v => {
        const photoUrl = v.photo_url || '';
        const voteStatus = normalizeVoteStatus(v.vote_status);
        const statusLabel = getVoteStatusLabel(voteStatus);
        const address = getHouseDisplay(v);
        const addressLabel = getHouseLabel(v);
        const phoneWork = getPhoneStatusLabel(v.phone_status);
        const remarks = v.remarks || '';
        const sexDisplay = normalizeSex(v.sex) || 'N/A';
        const isGuaranteed = (v.support_level || 'normal') === 'guaranteed';
        const electionBox = v.election_box || 'Not matched';

        html += `
            <div class="voter-card ${isGuaranteed ? 'guaranteed-card' : ''}" onclick="openPopup(${v.id})">
                <div class="photo">
                    ${photoUrl ? 
                        `<img src="${photoUrl}" alt="${v.name}" loading="lazy" 
                              onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'no-photo\\'>📷</span>';" />` :
                        '<span class="no-photo">📷</span>'
                    }
                </div>
                <div class="status-bar ${voteStatus}">${statusLabel}</div>
                <div class="info">
                    <div class="name">${v.name || 'Unknown'} ${isGuaranteed ? '<span class="guarantee-inline">Guaranteed</span>' : ''}</div>
                    <div class="address"><span class="meta-label">${addressLabel}</span> ${address}</div>
                    <div class="id"><span class="meta-label">ID</span> ${v.national_id || 'N/A'}</div>
                    <div class="id box-line"><span class="meta-label">Box</span> ${electionBox}</div>
                    <div class="details">
                        <span><strong>Phone:</strong> ${v.phone || 'N/A'}</span>
                        <span><strong>Call:</strong> ${phoneWork}</span>
                        <span><strong>Age:</strong> ${v.age || 'N/A'}</span>
                        <span><strong>Sex:</strong> ${sexDisplay}</span>
                    </div>
                    ${remarks ? `<div class="remarks"><i class="fas fa-comment"></i> ${remarks}</div>` : ''}
                </div>
            </div>
        `;
    });

    voterGrid.innerHTML = html;
    filterCount.innerHTML = `Viewing <strong>${voters.length}</strong> of <strong>${allVoters.length}</strong>`;
    updatePagination();
}

// ============================================
// UPDATE PAGINATION
// ============================================
function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize));
    prevPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function hasPhone(voter) {
    return Boolean((voter.phone || '').trim());
}

function hasRemarks(voter) {
    return Boolean((voter.remarks || '').trim());
}

function voteStatus(voter) {
    return voter.vote_status || 'pending';
}

function reachStatus(voter) {
    return voter.reach_status || 'not-reached';
}

function phoneWorkStatus(voter) {
    return normalizePhoneStatus(voter.phone_status);
}

function matchesTask(voter, task) {
    if (!task) return true;
    if (task === 'call-first') return reachStatus(voter) === 'not-reached' && hasPhone(voter) && phoneWorkStatus(voter) === 'need-call';
    if (task === 'visit') return reachStatus(voter) === 'not-reached' && (!hasPhone(voter) || ['wrong-number', 'out-of-range', 'no-phone'].includes(phoneWorkStatus(voter)));
    if (task === 'follow-up') return voteStatus(voter) === 'not-decided' || hasRemarks(voter) || ['wrong-number', 'out-of-range'].includes(phoneWorkStatus(voter));
    if (task === 'pending') return voteStatus(voter) === 'pending' && !hasRemarks(voter) && !['wrong-number', 'out-of-range'].includes(phoneWorkStatus(voter));
    if (task === 'confirmed') return (voter.support_level || 'normal') === 'guaranteed';
    return true;
}

function updateTaskCounts(voters) {
    if (taskCallFirst) taskCallFirst.textContent = voters.filter(v => matchesTask(v, 'call-first')).length;
    if (taskVisit) taskVisit.textContent = voters.filter(v => matchesTask(v, 'visit')).length;
    if (taskFollowUp) taskFollowUp.textContent = voters.filter(v => matchesTask(v, 'follow-up')).length;
    if (taskPending) taskPending.textContent = voters.filter(v => matchesTask(v, 'pending')).length;
    if (taskConfirmed) taskConfirmed.textContent = voters.filter(v => matchesTask(v, 'confirmed')).length;
}

function setActiveTask(task) {
    activeTask = task || '';
    taskButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.task === activeTask);
    });
    if (activeTask) {
        searchInput.value = '';
        statusFilter.value = '';
        phoneStatusFilter.value = '';
        houseFilter.value = '';
        if (remarksFilter) remarksFilter.value = '';
    }
    filterVoters();
}

function setViewMode(mode) {
    viewMode = mode;
    if (galleryViewBtn) galleryViewBtn.classList.toggle('active', mode === 'gallery');
    if (listViewBtn) listViewBtn.classList.toggle('active', mode === 'list');
    renderGrid(filteredVoters);
}

// ============================================
// FILTER VOTERS
// ============================================
function filterVoters() {
    const search = searchInput.value.trim();
    const status = statusFilter.value;
    const phoneStatus = phoneStatusFilter.value;
    const house = houseFilter.value;
    const remarksMode = remarksFilter ? remarksFilter.value : '';

    filteredVoters = filterVotersList(allVoters, search, status, house).filter(v => {
        if (phoneStatus && normalizePhoneStatus(v.phone_status) !== phoneStatus) return false;
        if (remarksMode === 'with') return Boolean((v.remarks || '').trim());
        if (remarksMode === 'without') return !Boolean((v.remarks || '').trim());
        return true;
    }).filter(v => {
        return matchesTask(v, activeTask);
    });
    currentPage = 1;
    renderGrid(filteredVoters);
    updateStats(allVoters);
    updateActiveCard(status);
}

// ============================================
// UPDATE ACTIVE CARD
// ============================================
function updateActiveCard(status) {
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    if (status) {
        document.querySelector(`.stat-card[data-filter="${status}"]`)?.classList.add('active');
    }
}

// ============================================
// BACK TO ALL
// ============================================
function backToAll() {
    searchInput.value = '';
    statusFilter.value = '';
    phoneStatusFilter.value = '';
    houseFilter.value = '';
    if (remarksFilter) remarksFilter.value = '';
    activeTask = '';
    taskButtons.forEach(button => button.classList.remove('active'));
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
    filteredVoters = [...allVoters];
    currentPage = 1;
    renderGrid(filteredVoters);
    updateStats(allVoters);
}

// ============================================
// FILTER BY STATUS (Card Click)
// ============================================
window.filterByStatus = function(status) {
    activeTask = '';
    taskButtons.forEach(button => button.classList.remove('active'));
    statusFilter.value = status;
    filterVoters();
};

// ============================================
// FILTER BY HOUSE (Top Houses Click)
// ============================================
window.filterByHouse = function(house) {
    houseFilter.value = house;
    filterVoters();
};

// ============================================
// SET TARGET
// ============================================
function setTarget() {
    const val = parseInt(targetInput.value);
    if (val > 0 && val <= allVoters.length) {
        target = val;
        localStorage.setItem('mdpReachTarget', target);
        updateStats(allVoters);
    } else {
        alert(`Enter between 1 and ${allVoters.length}`);
    }
}

// ============================================
// OPEN POPUP
// ============================================
function openPopup(id) {
    const voter = allVoters.find(v => v.id === id);
    if (!voter) return;

    selectedVoterId = id;

    const photoUrl = voter.photo_url || '';
    if (photoUrl) {
        popupPhoto.innerHTML = `<img src="${photoUrl}" alt="${voter.name}" 
                                  onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'placeholder\\'>📷</span>';" />`;
    } else {
        popupPhoto.innerHTML = '<span class="placeholder">📷</span>';
    }

    popupName.textContent = voter.name || 'Unknown';
    popupId.textContent = '🆔 ' + (voter.national_id || 'N/A');
    document.getElementById('popupHouseLabel').textContent = getHouseLabel(voter);
    popupHouse.textContent = getHouseDisplay(voter);
    popupPhone.textContent = voter.phone || 'N/A';
    popupAge.textContent = voter.age || 'N/A';
    popupSex.textContent = voter.sex || 'N/A';
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

// ============================================
// CLOSE POPUP
// ============================================
function closePopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    selectedVoterId = null;
}

// ============================================
// SAVE POPUP
// ============================================
async function savePopup(e) {
    e.preventDefault();
    if (selectedVoterId === null) return;
    if (activeRole && !activeRole.canEdit) {
        alert('You do not have permission to edit voters.');
        return;
    }

    const phone = popupPhoneInput.value.trim();
    const phone_status = popupPhoneStatus.value;
    const vote_status = popupVoteStatus.value;
    const support_level = popupSupportLevel.value;
    const reach_status = getAutoReachStatus(phone_status, vote_status, support_level, popupReachStatus.value);
    const remarks = popupRemarks.value.trim();

    const updateData = {};
    if (phone) updateData.phone = phone;
    updateData.phone_status = phone_status;
    updateData.reach_status = reach_status;
    updateData.vote_status = vote_status;
    updateData.support_level = support_level;
    updateData.remarks = remarks;

    const result = await updateVoter(PARTY_NAME, selectedVoterId, updateData);

    if (result) {
        const voter = allVoters.find(v => v.id === selectedVoterId);
        if (voter) {
            if (phone) voter.phone = phone;
            voter.phone_status = phone_status;
            voter.reach_status = reach_status;
            voter.vote_status = vote_status;
            voter.support_level = support_level;
            voter.remarks = remarks;
        }

        filterVoters();
        closePopup();

        const msg = document.createElement('div');
        msg.style.cssText =
            'position:fixed;bottom:20px;right:20px;background:#2ecc71;color:white;padding:8px 20px;border-radius:10px;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(46,204,113,0.3);';
        msg.innerHTML = '✅ Updated!';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    } else {
        alert('❌ Failed to save');
    }
}

// ============================================
// EXPORT DATA
// ============================================
function exportData() {
    exportVotersToCSV(filteredVoters, 'MDP');
}

// ============================================
// EVENT LISTENERS
// ============================================
applyBtn.addEventListener('click', filterVoters);
resetBtn.addEventListener('click', backToAll);
if (exportBtn) exportBtn.addEventListener('click', exportData);

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterVoters();
    if (e.target.value.trim() === '') backToAll();
});
searchInput.addEventListener('input', filterVoters);

statusFilter.addEventListener('change', filterVoters);
phoneStatusFilter.addEventListener('change', filterVoters);
houseFilter.addEventListener('change', filterVoters);
if (remarksFilter) remarksFilter.addEventListener('change', filterVoters);
if (galleryViewBtn) galleryViewBtn.addEventListener('click', () => setViewMode('gallery'));
if (listViewBtn) listViewBtn.addEventListener('click', () => setViewMode('list'));
taskButtons.forEach(button => {
    button.addEventListener('click', () => setActiveTask(button.dataset.task));
});
if (clearTaskBtn) clearTaskBtn.addEventListener('click', backToAll);

prevPage.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderGrid(filteredVoters); }
});

nextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredVoters.length / pageSize);
    if (currentPage < totalPages) { currentPage++; renderGrid(filteredVoters); }
});

setTargetBtn.addEventListener('click', setTarget);
targetInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') setTarget();
});

popupClose.addEventListener('click', closePopup);
btnClosePopup.addEventListener('click', closePopup);
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) closePopup();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
});

popupForm.addEventListener('submit', savePopup);
setupPopupActionButtons();

// ============================================
// EXPOSE TO GLOBAL
// ============================================
window.openPopup = openPopup;
window.closePopup = closePopup;
window.filterByStatus = filterByStatus;
window.filterByHouse = filterByHouse;

// ============================================
// INIT
// ============================================
targetInput.value = target;
document.addEventListener('DOMContentLoaded', () => {
    initMDPData();
});
console.log('✅ MDP Tracker loaded');
