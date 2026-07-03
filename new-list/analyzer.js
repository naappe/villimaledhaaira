const TABLE_NAME = 'full_import';

let dbRows = [];
let analysis = {
    all: [],
    review: [],
    new: [],
    matched: [],
    keepDb: [],
    missing: []
};
let currentView = 'new';

const resultsGrid = document.getElementById('resultsGrid');
const resultCount = document.getElementById('resultCount');
const resultsTitle = document.getElementById('resultsTitle');
const resultsSubtitle = document.getElementById('resultsSubtitle');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const toggleReviewedBtn = document.getElementById('toggleReviewedBtn');
const clearReviewedBtn = document.getElementById('clearReviewedBtn');
const statButtons = document.querySelectorAll('.stat');
const loadStatus = document.getElementById('loadStatus');
const REVIEWED_STORAGE_KEY = 'villimale-new-list-reviewed-v1';
let reviewedKeys = loadReviewedKeys();
let showReviewed = false;

function loadReviewedKeys() {
    try {
        return new Set(JSON.parse(localStorage.getItem(REVIEWED_STORAGE_KEY) || '[]'));
    } catch (error) {
        return new Set();
    }
}

function saveReviewedKeys() {
    localStorage.setItem(REVIEWED_STORAGE_KEY, JSON.stringify([...reviewedKeys]));
}

function getReviewKey(row) {
    if (row.status === 'new') return `election:${row.row}`;
    if (row.dbRow?.id) return `db:${row.dbRow.id}`;
    if (row.best?.row?.id) return `db:${row.best.row.id}`;
    return `${row.status}:${row.name}:${row.maskedId}:${row.address}`;
}

function isReviewed(row) {
    return reviewedKeys.has(getReviewKey(row));
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/dhaftharu\.?/g, '')
        .replace(/\b(male|female)\b/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function compactName(value) {
    return normalizeText(value);
}

function addressKey(value) {
    return normalizeText(value)
        .replace(/\b(dhaftharu|house|flat|male|dh|no|rs|m|h|d)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function exactKey(name, address, digits) {
    return [compactName(name), addressKey(address), String(digits || '').trim()].join('|');
}

function lastDigits(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.slice(-4);
}

function visibleDigitKeys(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return [...new Set([digits.slice(-4), digits.slice(-3)].filter(Boolean))];
}

function electionDigitKeys(row) {
    const digits = String(row?.maskedId || row?.visibleDigits || '').replace(/\D/g, '');
    return [...new Set([digits.slice(-4), digits.slice(-3), String(row?.visibleDigits || '').trim()].filter(Boolean))];
}

function maskFullId(value) {
    const text = String(value || '').trim();
    const digits = text.replace(/\D/g, '');
    const tail = digits.slice(-4);
    return tail ? `AXX${tail}` : 'Hidden';
}

function createSupabaseClient() {
    return supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.publishableKey
    );
}

async function fetchAllRows() {
    const client = createSupabaseClient();
    const pageSize = 1000;
    let from = 0;
    let rows = [];

    while (true) {
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('id,name,national_id,house,lives_in,phone,party,sex,age,photo_url,election_box,election_list_match,election_source_row')
            .order('image_number', { ascending: true })
            .range(from, from + pageSize - 1);

        if (error) throw error;
        rows = rows.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
    }

    return rows;
}

function rowAddress(row) {
    return [row.house, row.lives_in].filter(Boolean).join(' ');
}

function pushIndex(map, key, row) {
    if (!key || key.includes('||')) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
}

function buildIndexes(rows) {
    const exact = new Map();

    rows.forEach(row => {
        const address = rowAddress(row);
        const digitKeys = visibleDigitKeys(row.national_id);
        digitKeys.forEach(digits => {
            pushIndex(exact, exactKey(row.name, address, digits), row);
        });
    });

    return { exact };
}

function candidateSuggestions(pdfRow, matchedDbIds) {
    const pdfName = compactName(pdfRow.name);
    const pdfAddress = addressKey(pdfRow.address);
    const pdfDigits = electionDigitKeys(pdfRow);
    const candidates = [];

    dbRows.forEach(row => {
        if (matchedDbIds.has(row.id)) return;
        const dbName = compactName(row.name);
        const dbAddress = addressKey(rowAddress(row));
        const dbDigits = visibleDigitKeys(row.national_id);
        const reasons = [];
        let score = 0;

        if (pdfName && dbName && pdfName === dbName) {
            score += 40;
            reasons.push('same name');
        }
        if (pdfAddress && dbAddress && pdfAddress === dbAddress) {
            score += 35;
            reasons.push('same address');
        }
        if (pdfDigits.some(digits => dbDigits.includes(digits))) {
            score += 35;
            reasons.push('same ID ending');
        }

        if (reasons.length >= 2 && score >= 70) {
            candidates.push({ row, score, reasons });
        }
    });

    return candidates
        .sort((a, b) => b.score - a.score || String(a.row.name || '').localeCompare(String(b.row.name || '')))
        .slice(0, 3);
}

function electionSuggestions(dbRow, matchedElectionRows) {
    const dbName = compactName(dbRow.name);
    const dbAddress = addressKey(rowAddress(dbRow));
    const dbDigits = visibleDigitKeys(dbRow.national_id);
    const candidates = [];

    window.ELECTION_NEW_LIST.forEach(pdfRow => {
        if (matchedElectionRows.has(pdfRow.row)) return;
        const pdfName = compactName(pdfRow.name);
        const pdfAddress = addressKey(pdfRow.address);
        const pdfDigits = electionDigitKeys(pdfRow);
        const reasons = [];
        let score = 0;

        if (dbName && pdfName && dbName === pdfName) {
            score += 40;
            reasons.push('same name');
        }
        if (dbAddress && pdfAddress && dbAddress === pdfAddress) {
            score += 35;
            reasons.push('same address');
        }
        if (pdfDigits.some(digits => dbDigits.includes(digits))) {
            score += 35;
            reasons.push('same ID ending');
        }

        if (reasons.length >= 2 && score >= 70) {
            candidates.push({ row: pdfRow, score, reasons });
        }
    });

    return candidates
        .sort((a, b) => b.score - a.score || String(a.row.name || '').localeCompare(String(b.row.name || '')))
        .slice(0, 3);
}

function bestIndexedMatch(pdfRow, indexes) {
    const exactMatches = indexes.exact.get(exactKey(pdfRow.name, pdfRow.address, pdfRow.visibleDigits)) || [];
    if (exactMatches.length) {
        return {
            score: 100,
            reasons: ['exact name + address + ID ending'],
            row: exactMatches[0],
            matchCount: exactMatches.length
        };
    }

    return null;
}

function analyzeRows() {
    const dbMatchedIds = new Set();
    const electionMatchedRows = new Set();
    const indexes = buildIndexes(dbRows);

    dbRows.forEach(row => {
        if (row.election_source_row && String(row.election_list_match || '').startsWith('confirmed:')) {
            dbMatchedIds.add(row.id);
            electionMatchedRows.add(row.election_source_row);
        }
    });

    const all = window.ELECTION_NEW_LIST.map(pdfRow => {
        if (electionMatchedRows.has(pdfRow.row)) {
            return {
                ...pdfRow,
                status: 'matched',
                best: {
                    score: 100,
                    reasons: ['confirmed reviewed match'],
                    row: dbRows.find(row => row.election_source_row === pdfRow.row),
                    matchCount: 1
                }
            };
        }
        const best = bestIndexedMatch(pdfRow, indexes);
        const status = best && best.score >= 90 ? 'matched' : 'new';
        if (status === 'matched') {
            dbMatchedIds.add(best.row.id);
            electionMatchedRows.add(pdfRow.row);
        }
        return { ...pdfRow, status, best };
    });

    all.forEach(row => {
        if (row.status === 'new') {
            row.suggestions = candidateSuggestions(row, dbMatchedIds);
        }
    });

    const dbReviewRows = dbRows
        .filter(row => !dbMatchedIds.has(row.id))
        .map(row => {
            const suggestions = electionSuggestions(row, electionMatchedRows);
            return {
                status: suggestions.length ? 'keep-db' : 'missing',
                name: row.name || 'Unknown',
                maskedId: maskFullId(row.national_id),
                visibleDigits: lastDigits(row.national_id),
                address: rowAddress(row) || 'N/A',
                island: '',
                sex: row.sex || '',
                box: row.party || 'No party',
                dbRow: row,
                electionSuggestions: suggestions
            };
        });

    analysis = {
        all,
        review: [],
        new: all.filter(row => row.status === 'new'),
        matched: all.filter(row => row.status === 'matched'),
        keepDb: dbReviewRows.filter(row => row.status === 'keep-db'),
        missing: dbReviewRows.filter(row => row.status === 'missing')
    };
    analysis.review = [...analysis.new, ...analysis.keepDb, ...analysis.missing];

    updateStats();
}

function updateStats() {
    const visibleReview = showReviewed ? analysis.review : analysis.review.filter(row => !isReviewed(row));
    const visibleNew = showReviewed ? analysis.new : analysis.new.filter(row => !isReviewed(row));
    const visibleKeepDb = showReviewed ? analysis.keepDb : analysis.keepDb.filter(row => !isReviewed(row));
    const visibleMissing = showReviewed ? analysis.missing : analysis.missing.filter(row => !isReviewed(row));
    document.getElementById('statTotal').textContent = visibleReview.length;
    document.getElementById('statNew').textContent = visibleNew.length;
    document.getElementById('statKeepDb').textContent = visibleKeepDb.length;
    document.getElementById('statMissing').textContent = visibleMissing.length;
}

function setView(view) {
    currentView = view;
    statusFilter.value = view;
    statButtons.forEach(button => button.classList.toggle('active', button.dataset.view === view));
    render();
}

function getVisibleRows() {
    const query = normalizeText(searchInput.value);
    let rows = analysis[currentView] || analysis.new;
    if (!showReviewed) rows = rows.filter(row => !isReviewed(row));
    if (!query) return rows;
    return rows.filter(row => normalizeText([
        row.name,
        row.maskedId,
        row.visibleDigits,
        row.address,
        row.island,
        row.box,
        row.best?.row?.name,
        row.best?.row?.house,
        ...(row.suggestions || []).flatMap(item => [
            item.row?.name,
            item.row?.house,
            item.row?.national_id,
            item.reasons?.join(' ')
        ]),
        ...(row.electionSuggestions || []).flatMap(item => [
            item.row?.name,
            item.row?.address,
            item.row?.maskedId,
            item.row?.box,
            item.reasons?.join(' ')
        ])
    ].filter(Boolean).join(' ')).includes(query));
}

function render() {
    const rows = getVisibleRows();
    const titles = {
        new: ['Need identify', 'These voters are in the new election list, but no exact database ID card/photo was found. Treat as new unless a review suggestion is confirmed.'],
        keepDb: ['Keep DB / verify', 'These database voters were not exact matches, but they have election-list suggestions. Keep them in the database and verify the suggested election row.'],
        missing: ['Not in election list', 'These database voters have no exact match and no useful election-list suggestion. Review before deciding removed, deceased, moved, or changed.'],
        review: ['Needs review', 'Exact matches are hidden. This shows Need Identify, Keep DB / Verify, and Not in Election List.']
    };

    resultsTitle.textContent = titles[currentView][0];
    resultsSubtitle.textContent = titles[currentView][1];
    resultCount.textContent = rows.length;
    const reviewedCount = analysis.review.filter(row => isReviewed(row)).length;
    toggleReviewedBtn.innerHTML = showReviewed
        ? '<i class="fas fa-eye-slash"></i> Hide reviewed'
        : '<i class="fas fa-eye"></i> Show reviewed';

    if (rows.length === 0) {
        resultsGrid.innerHTML = `<div class="empty">No rows found. ${reviewedCount ? `${reviewedCount} reviewed item(s) are hidden.` : ''}</div>`;
        return;
    }

    resultsGrid.innerHTML = rows.slice(0, 600).map(row => renderCard(row)).join('');
}

function renderCard(row) {
    const match = row.best?.row;
    const reason = row.best?.reasons?.join(', ') || 'No strong match';
    const suggestions = row.suggestions || [];
    const electionReviewSuggestions = row.electionSuggestions || [];
    const photoUrl = match?.photo_url || '';
    const dbBox = match?.election_box || row.box || 'N/A';
    const matchType = match?.election_list_match || row.status;
    const isDbReview = row.status === 'missing' || row.status === 'keep-db';
    const idLabel = isDbReview ? 'Database ID' : 'Election ID';
    const addressLabel = isDbReview ? 'Database house' : 'Election address';
    const boxLabel = isDbReview ? 'Party' : 'Election box';
    const reviewed = isReviewed(row);
    return `
        <article class="card ${row.status} ${reviewed ? 'reviewed' : ''}">
            <div class="card-actions">
                <button type="button" onclick="toggleReviewed('${getReviewKey(row)}')">
                    <i class="fas ${reviewed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    ${reviewed ? 'Undo reviewed' : 'Mark reviewed'}
                </button>
            </div>
            ${!match && row.status === 'new' ? '<div class="identity-alert"><i class="fas fa-id-card"></i> No database ID card/photo found</div>' : ''}
            <div class="name">${row.name || 'Unknown'}</div>
            <div class="row"><span>${idLabel}</span><strong>${row.maskedId || row.visibleDigits || 'Hidden'}</strong></div>
            <div class="row"><span>${addressLabel}</span><strong>${row.address || 'N/A'}</strong></div>
            <div class="row"><span>${boxLabel}</span><strong>${row.box || 'N/A'}</strong></div>
            <div class="row"><span>Sex</span><strong>${row.sex || 'N/A'}</strong></div>
            ${!match && suggestions.length ? `
                <div class="suggestions">
                    <div class="suggestions-title">Review database suggestions</div>
                    ${suggestions.map(item => renderSuggestion(item)).join('')}
                </div>
            ` : ''}
            ${row.status === 'keep-db' && electionReviewSuggestions.length ? `
                <div class="suggestions">
                    <div class="suggestions-title">Review election-list suggestions</div>
                    ${electionReviewSuggestions.map(item => renderElectionSuggestion(item)).join('')}
                </div>
            ` : ''}
            ${match ? `
                <div class="match-card">
                    <div class="match-photo">
                        ${photoUrl ?
                            `<img src="${photoUrl}" alt="${match.name || 'Database voter'}" loading="lazy" onerror="this.parentElement.innerHTML='<span>No photo</span>';">` :
                            '<span>No photo</span>'
                        }
                    </div>
                    <div class="match-info">
                        <div class="match-title">Database voter</div>
                        <strong>${match.name || 'Unknown'}</strong>
                        <div class="match-row"><span>ID</span><b>${maskFullId(match.national_id)}</b></div>
                        <div class="match-row"><span>House</span><b>${rowAddress(match) || 'N/A'}</b></div>
                        <div class="match-row"><span>Box</span><b>${dbBox}</b></div>
                        <div class="match-row"><span>Match</span><b>${matchType}</b></div>
                        <div class="reason">${reason}</div>
                    </div>
                </div>
            ` : ''}
        </article>
    `;
}

window.toggleReviewed = function(key) {
    if (reviewedKeys.has(key)) {
        reviewedKeys.delete(key);
    } else {
        reviewedKeys.add(key);
    }
    saveReviewedKeys();
    updateStats();
    render();
};

function renderSuggestion(item) {
    const row = item.row || {};
    const photoUrl = row.photo_url || '';
    return `
        <div class="suggestion-card">
            <div class="match-photo suggestion-photo">
                ${photoUrl ?
                    `<img src="${photoUrl}" alt="${row.name || 'Database voter'}" loading="lazy" onerror="this.parentElement.innerHTML='<span>No photo</span>';">` :
                    '<span>No photo</span>'
                }
            </div>
            <div class="match-info">
                <div class="match-title">Strong review suggestion</div>
                <strong>${row.name || 'Unknown'}</strong>
                <div class="match-row"><span>ID</span><b>${maskFullId(row.national_id)}</b></div>
                <div class="match-row"><span>House</span><b>${rowAddress(row) || 'N/A'}</b></div>
                <div class="match-row"><span>Score</span><b>${item.score}</b></div>
                <div class="reason">${item.reasons.join(', ')}</div>
            </div>
        </div>
    `;
}

function renderElectionSuggestion(item) {
    const row = item.row || {};
    return `
        <div class="election-suggestion-card">
            <div class="match-info">
                <div class="match-title">Strong election suggestion</div>
                <strong>${row.name || 'Unknown'}</strong>
                <div class="match-row"><span>Election ID</span><b>${row.maskedId || row.visibleDigits || 'Hidden'}</b></div>
                <div class="match-row"><span>Address</span><b>${row.address || 'N/A'}</b></div>
                <div class="match-row"><span>Box</span><b>${row.box || 'N/A'}</b></div>
                <div class="match-row"><span>Score</span><b>${item.score}</b></div>
                <div class="reason">${item.reasons.join(', ')}</div>
            </div>
        </div>
    `;
}

async function init() {
    const listCount = Array.isArray(window.ELECTION_NEW_LIST) ? window.ELECTION_NEW_LIST.length : 0;
    loadStatus.textContent = `Excel rows loaded: ${listCount}. Loading Supabase database...`;
    resultsGrid.innerHTML = '<div class="loading">Loading Supabase and comparing list...</div>';
    try {
        dbRows = await fetchAllRows();
        analyzeRows();
        const newWithSuggestions = analysis.new.filter(row => (row.suggestions || []).length).length;
        const reviewedCount = analysis.review.filter(row => isReviewed(row)).length;
        loadStatus.textContent = `Excel rows: ${listCount}. Supabase rows: ${dbRows.length}. Exact matched hidden: ${analysis.matched.length}. Need identify: ${analysis.new.length} (${newWithSuggestions} with DB suggestions). Keep DB / verify: ${analysis.keepDb.length}. Not in election: ${analysis.missing.length}. Reviewed hidden: ${reviewedCount}.`;
        render();
    } catch (error) {
        console.error(error);
        loadStatus.textContent = `Excel rows: ${listCount}. Supabase failed to load.`;
        resultsGrid.innerHTML = `<div class="empty">Could not load Supabase data. ${error.message || 'Check connection and permissions.'}</div>`;
    }
}

searchInput.addEventListener('input', render);
statusFilter.addEventListener('change', () => setView(statusFilter.value));
refreshBtn.addEventListener('click', init);
toggleReviewedBtn.addEventListener('click', () => {
    showReviewed = !showReviewed;
    updateStats();
    render();
});
clearReviewedBtn.addEventListener('click', () => {
    if (!confirm('Reset reviewed marks and show all review cards again?')) return;
    reviewedKeys.clear();
    saveReviewedKeys();
    updateStats();
    render();
});
statButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));

init();
