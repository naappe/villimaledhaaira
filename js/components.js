// ============================================
// SHARED COMPONENTS
// ============================================

// ============================================
// HELPER: Normalize Sex
// ============================================
function normalizeSex(value) {
    if (!value) return '';
    const upper = value.toUpperCase();
    if (upper === 'M' || upper === 'MALE') return 'Male';
    if (upper === 'F' || upper === 'FEMALE') return 'Female';
    if (upper === 'O' || upper === 'OTHER') return 'Other';
    return value;
}

function getVoteStatusLabel(value) {
    const status = normalizeVoteStatus(value);
    if (status === 'will-vote') return 'Will Vote';
    if (status === 'no-vote') return 'No Vote';
    if (status === 'not-decided') return 'Not Decided';
    return 'Pending';
}

function normalizeStatusValue(value, fallback) {
    return String(value || fallback)
        .trim()
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-');
}

function normalizeReachStatus(value) {
    const status = normalizeStatusValue(value, 'not-reached');
    return status === 'reached' ? 'reached' : 'not-reached';
}

function normalizeVoteStatus(value) {
    const status = normalizeStatusValue(value, 'pending');
    if (status === 'will-vote') return 'will-vote';
    if (status === 'no-vote' || status === 'not-vote') return 'no-vote';
    if (status === 'not-decided' || status === 'not-decide') return 'not-decided';
    return 'pending';
}

function normalizePhoneStatus(value) {
    const status = normalizeStatusValue(value, 'need-call');
    if (status === 'called') return 'called';
    if (status === 'wrong-number') return 'wrong-number';
    if (status === 'out-of-range') return 'out-of-range';
    if (status === 'no-phone') return 'no-phone';
    return 'need-call';
}

function getPhoneStatusLabel(value) {
    const status = normalizePhoneStatus(value);
    if (status === 'called') return 'Called';
    if (status === 'wrong-number') return 'Wrong Number';
    if (status === 'out-of-range') return 'Out of Range';
    if (status === 'no-phone') return 'No Phone';
    return 'Need Call';
}

function getAutoReachStatus(phoneStatus, voteStatus, supportLevel, reachStatus) {
    const phone = normalizePhoneStatus(phoneStatus);
    const vote = normalizeVoteStatus(voteStatus);
    if (phone === 'called' || vote !== 'pending' || supportLevel === 'guaranteed') {
        return 'reached';
    }
    if (['need-call', 'wrong-number', 'out-of-range', 'no-phone'].includes(phone)) {
        return 'not-reached';
    }
    return normalizeReachStatus(reachStatus);
}

function normalizeSearchText(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeHouseName(value) {
    const house = String(value || '').replace(/\s+/g, ' ').trim();
    if (!house) return '';
    if (isDhaftharNumber(house)) return 'Dhafthar Numbers';
    return house;
}

function isDhaftharNumber(value) {
    const house = String(value || '').replace(/\s+/g, ' ').trim();
    return /^no\s+([a-z]+\s*)*\d+$/i.test(house) ||
        /^house\s+no\s+[a-z\s]*\d+$/i.test(house);
}

function getHouseLabel(voter) {
    return isDhaftharNumber(voter?.house) ? 'Dhafthar No' : 'House';
}

function getHouseDisplay(voter) {
    const house = isDhaftharNumber(voter?.house)
        ? String(voter?.house || '').replace(/\s+/g, ' ').trim()
        : normalizeHouseName(voter?.house);
    const livesIn = String(voter?.lives_in || '').trim();
    return [house, livesIn].filter(Boolean).join(', ') || 'N/A';
}

function updatePopupActionButtons(root = document) {
    root.querySelectorAll('.action-buttons').forEach(group => {
        const target = document.getElementById(group.dataset.target);
        if (!target) return;
        group.querySelectorAll('button').forEach(button => {
            button.classList.toggle('active', button.dataset.value === target.value);
        });
    });
}

function updatePopupCallLink(phone) {
    const callBtn = document.getElementById('popupCallBtn');
    if (!callBtn) return;
    const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
    if (!cleanPhone) {
        callBtn.href = '#';
        callBtn.classList.add('disabled');
        return;
    }
    callBtn.href = `tel:${cleanPhone}`;
    callBtn.classList.remove('disabled');
}

function setupPopupActionButtons(root = document) {
    root.querySelectorAll('.action-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const group = button.closest('.action-buttons');
            const target = document.getElementById(group.dataset.target);
            if (!target) return;
            target.value = button.dataset.value;
            if (target.id === 'popupPhoneStatus' || target.id === 'popupVoteStatus' || target.id === 'popupSupportLevel') {
                const reachTarget = document.getElementById('popupReachStatus');
                const phoneTarget = document.getElementById('popupPhoneStatus');
                const voteTarget = document.getElementById('popupVoteStatus');
                const supportTarget = document.getElementById('popupSupportLevel');
                if (reachTarget && phoneTarget && voteTarget && supportTarget) {
                    reachTarget.value = getAutoReachStatus(phoneTarget.value, voteTarget.value, supportTarget.value, reachTarget.value);
                }
            }
            target.dispatchEvent(new Event('change', { bubbles: true }));
            updatePopupActionButtons(root);
        });
    });

    const phoneInput = document.getElementById('popupPhoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => updatePopupCallLink(phoneInput.value));
    }
}

// ============================================
// HELPER: Get Party Config
// ============================================
function getPartyConfig(partyName) {
    return window.PARTY_AUTH[partyName] || null;
}

// ============================================
// HELPER: Get Table Name
// ============================================
function getTableName(partyName) {
    const config = getPartyConfig(partyName);
    return config ? config.table : 'full_import';
}

// ============================================
// HELPER: Get Party Filter
// ============================================
function getPartyFilter(partyName) {
    const config = getPartyConfig(partyName);
    if (!config) return null;
    return {
        column: config.partyColumn || 'party',
        value: config.partyValue || partyName
    };
}

// ============================================
// HELPER: Get Party Color
// ============================================
function getPartyColor(partyName) {
    const config = getPartyConfig(partyName);
    return config ? config.color : '#4a90d9';
}

// ============================================
// SESSION MANAGEMENT
// ============================================
function savePartySession(party) {
    localStorage.setItem('partySession', JSON.stringify({
        party: party,
        timestamp: Date.now()
    }));
}

function clearPartySession() {
    localStorage.removeItem('partySession');
}

function checkPartySession() {
    const sessionData = localStorage.getItem('partySession');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            const sessionAge = Date.now() - session.timestamp;
            const maxAge = 24 * 60 * 60 * 1000;
            if (sessionAge < maxAge) {
                return session.party;
            } else {
                clearPartySession();
                return null;
            }
        } catch (e) {
            clearPartySession();
            return null;
        }
    }
    return null;
}

// ============================================
// SUPABASE CLIENT
// ============================================
function createSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    return supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.publishableKey
    );
}

// ============================================
// FETCH PARTY VOTERS - FIXED
// ============================================
async function fetchPartyVoters(party) {
    const supabaseClient = createSupabaseClient();
    if (!supabaseClient) return [];

    const tableName = getTableName(party);
    const filter = getPartyFilter(party);
    
    if (!filter) {
        console.error('Party filter not found for:', party);
        return [];
    }

    try {
        const pageSize = 1000;
        let from = 0;
        let rows = [];

        while (true) {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*')
                .eq(filter.column, filter.value)
                .order('image_number', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) throw error;
            rows = rows.concat(data || []);
            if (!data || data.length < pageSize) break;
            from += pageSize;
        }

        return rows;
    } catch (error) {
        console.error('Error fetching voters:', error);
        return [];
    }
}

// ============================================
// UPDATE VOTER
// ============================================
async function updateVoter(party, id, updateData) {
    const supabaseClient = createSupabaseClient();
    if (!supabaseClient) return null;

    const tableName = getTableName(party);
    if (!tableName) return null;

    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating voter:', error);
        return null;
    }
}

// ============================================
// EXPORT DATA
// ============================================
function exportVotersToCSV(voters, party) {
    if (!voters || voters.length === 0) {
        alert('No data to export!');
        return;
    }

    const partyName = party || 'voters';
    let csv = 'Name,National ID,Address,Phone,Phone Status,Age,Sex,Reach Status,Vote Status,Remarks\n';

    voters.forEach(v => {
        const name = (v.name || '').replace(/,/g, '');
        const national_id = (v.national_id || '').replace(/,/g, '');
        const address = getHouseDisplay(v).replace(/,/g, ';');
        const phone = (v.phone || '').replace(/,/g, '');
        const phoneStatus = getPhoneStatusLabel(v.phone_status);
        const age = v.age || '';
        const sex = v.sex || '';
        const reach = v.reach_status || 'not-reached';
        const vote = v.vote_status || 'pending';
        const remarks = (v.remarks || '').replace(/,/g, '');

        csv += `${name},${national_id},${address},${phone},${phoneStatus},${age},${sex},${reach},${vote},${remarks}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${partyName}_voters_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ============================================
// FILTER VOTERS
// ============================================
function filterVotersList(voters, search, status, house) {
    const s = normalizeSearchText(search);

    return voters.filter(v => {
        let matchSearch = true;
        if (s) {
            const searchable = normalizeSearchText([
                v.name,
                v.national_id,
                v.house,
                normalizeHouseName(v.house),
                v.lives_in,
                v.phone,
                v.age,
                normalizeSex(v.sex),
                v.party,
                v.support_level,
                v.election_box,
                v.election_list_match,
                getPhoneStatusLabel(v.phone_status),
                normalizeReachStatus(v.reach_status),
                getVoteStatusLabel(normalizeVoteStatus(v.vote_status)),
                v.remarks
            ].filter(Boolean).join(' '));
            matchSearch = searchable.includes(s);
        }

        let matchStatus = true;
        if (status) {
            matchStatus = normalizeReachStatus(v.reach_status) === status ||
                normalizeVoteStatus(v.vote_status) === status;
        }

        let matchHouse = true;
        if (house) matchHouse = normalizeHouseName(v.house) === house;

        return matchSearch && matchStatus && matchHouse;
    });
}

// ============================================
// CALCULATE STATS
// ============================================
function calculateStats(voters) {
    const total = voters.length;
    const reached = voters.filter(v => normalizeReachStatus(v.reach_status) === 'reached').length;
    const notReached = voters.filter(v => normalizeReachStatus(v.reach_status) === 'not-reached').length;
    const willVote = voters.filter(v => normalizeVoteStatus(v.vote_status) === 'will-vote').length;
    const noVote = voters.filter(v => normalizeVoteStatus(v.vote_status) === 'no-vote').length;
    const notDecided = voters.filter(v => normalizeVoteStatus(v.vote_status) === 'not-decided').length;
    const pending = voters.filter(v => normalizeVoteStatus(v.vote_status) === 'pending').length;

    return { total, reached, notReached, willVote, noVote, notDecided, pending };
}

// ============================================
// GET TOP HOUSES
// ============================================
function getTopHouses(voters, limit = 10) {
    const houseCounts = {};
    voters.forEach(v => {
        const house = normalizeHouseName(v.house);
        if (house) {
            houseCounts[house] = (houseCounts[house] || 0) + 1;
        }
    });

    return Object.entries(houseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

// ============================================
// GET HOUSE OPTIONS
// ============================================
function getHouseOptions(voters) {
    return [...new Set(voters.map(v => normalizeHouseName(v.house)).filter(Boolean))].sort();
}

// ============================================
// GET AGE DISTRIBUTION
// ============================================
function getAgeDistribution(voters) {
    const ageGroups = {
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55-64': 0,
        '65+': 0
    };

    voters.forEach(v => {
        const age = parseInt(v.age);
        if (isNaN(age) || age < 18) return;
        if (age >= 18 && age <= 24) ageGroups['18-24']++;
        else if (age >= 25 && age <= 34) ageGroups['25-34']++;
        else if (age >= 35 && age <= 44) ageGroups['35-44']++;
        else if (age >= 45 && age <= 54) ageGroups['45-54']++;
        else if (age >= 55 && age <= 64) ageGroups['55-64']++;
        else if (age >= 65) ageGroups['65+']++;
    });

    return ageGroups;
}

// ============================================
// CREATE STATUS CHART
// ============================================
function createStatusChart(ctx, voters) {
    const stats = calculateStats(voters);
    const total = voters.length;

    if (window.statusChartInstance) {
        window.statusChartInstance.destroy();
    }

    window.statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Reached', 'Not Reached', 'Will Vote', 'Pending', 'Not Decided', 'No Vote'],
            datasets: [{
                data: [stats.reached, stats.notReached, stats.willVote, stats.pending, stats.notDecided, stats.noVote],
                backgroundColor: ['#2ecc71', '#95a5a6', '#27ae60', '#f39c12', '#8e44ad', '#e74c3c'],
                borderWidth: 2,
                borderColor: 'white',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.parsed} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ============================================
// EXPOSE TO GLOBAL
// ============================================
window.normalizeSex = normalizeSex;
window.getVoteStatusLabel = getVoteStatusLabel;
window.normalizePhoneStatus = normalizePhoneStatus;
window.getPhoneStatusLabel = getPhoneStatusLabel;
window.getAutoReachStatus = getAutoReachStatus;
window.normalizeSearchText = normalizeSearchText;
window.normalizeHouseName = normalizeHouseName;
window.isDhaftharNumber = isDhaftharNumber;
window.getHouseLabel = getHouseLabel;
window.getHouseDisplay = getHouseDisplay;
window.setupPopupActionButtons = setupPopupActionButtons;
window.updatePopupActionButtons = updatePopupActionButtons;
window.updatePopupCallLink = updatePopupCallLink;
window.getPartyConfig = getPartyConfig;
window.getTableName = getTableName;
window.getPartyFilter = getPartyFilter;
window.getPartyColor = getPartyColor;
window.savePartySession = savePartySession;
window.clearPartySession = clearPartySession;
window.checkPartySession = checkPartySession;
window.createSupabaseClient = createSupabaseClient;
window.fetchPartyVoters = fetchPartyVoters;
window.updateVoter = updateVoter;
window.exportVotersToCSV = exportVotersToCSV;
window.filterVotersList = filterVotersList;
window.calculateStats = calculateStats;
window.getTopHouses = getTopHouses;
window.getHouseOptions = getHouseOptions;
window.getAgeDistribution = getAgeDistribution;
window.createStatusChart = createStatusChart;

console.log('✅ Components loaded (using full_import table)');
