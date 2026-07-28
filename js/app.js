(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  // --- State ---
  let logoDataUrl = null;
  let photoDataUrl = null;
  let history = JSON.parse(localStorage.getItem('sigHistory') || '[]');
  let team = JSON.parse(localStorage.getItem('sigTeam') || '[]');

  // --- DOM refs ---
  const form = $('#signatureForm');
  const preview = $('#signaturePreview');
  const templateSel = $('#template');
  const colorInput = $('#color');
  const fontFamily = $('#fontFamily');

  // --- Helpers ---
  function getFormData() {
    return {
      firstName: $('#firstName').value.trim(),
      lastName: $('#lastName').value.trim(),
      title: $('#title').value.trim(),
      company: $('#company').value.trim(),
      email: $('#email').value.trim(),
      phone: $('#phone').value.trim(),
      phone2: $('#phone2').value.trim(),
      mobile: $('#mobile').value.trim(),
      website: $('#website').value.trim(),
      address: $('#address').value.trim(),
      logoUrl: logoDataUrl,
      photoUrl: photoDataUrl,
      department: $('#department').value,
      fontFamily: fontFamily.value,
      qrCode: $('#qrCode').value === '1',
      dynamicStatus: $('#dynamicStatus').value === '1',
      banner: $('#banner').value.trim(),
      bannerLink: $('#bannerLink').value.trim(),
      socialHtml: Templates.getSocialHtml({
        linkedin: $('#linkedin').value.trim(),
        facebook: $('#facebook').value.trim(),
        twitter: $('#twitter').value.trim(),
        instagram: $('#instagram').value.trim(),
      }),
    };
  }

  function renderPreview(data, template, color, font) {
    preview.innerHTML = Templates.render(data, template, color, font);
  }

  function generateFileName(ext) {
    return `${$('#firstName').value || 'signature'}_${$('#lastName').value || 'email'}.${ext}`;
  }

  // --- Google Fonts ---
  function loadGoogleFont(font) {
    const link = $('#googleFont');
    if (!font) { link.href = ''; return; }
    const name = font.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${name}:wght@400;600;700&display=swap`;
  }

  // --- Loading state ---
  function withLoading(btn, fn) {
    return async (...args) => {
      const orig = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;margin-right:4px"></span>...';
      try { await fn(...args); } catch (e) { console.error(e); showToast('Erreur: ' + e.message); }
      btn.disabled = false;
      btn.textContent = orig;
    };
  }

  // Add spinner keyframes once
  if (!document.getElementById('spinKeyframes')) {
    const s = document.createElement('style');
    s.id = 'spinKeyframes';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  // --- Export ---
  async function exportAs(type) {
    const el = preview;
    if (!el.innerHTML.trim()) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false });
    if (type === 'png') canvas.toBlob(b => downloadBlob(b, generateFileName('png')), 'image/png');
    else if (type === 'jpg') canvas.toBlob(b => downloadBlob(b, generateFileName('jpg')), 'image/jpeg', 0.92);
    else if (type === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2 + 20] });
      pdf.addImage(imgData, 'PNG', 0, 10, canvas.width / 2, canvas.height / 2);
      pdf.save(generateFileName('pdf'));
    }
    showToast(`Exporté en ${type.toUpperCase()} ✓`);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportAllFormats() {
    const el = preview;
    if (!el.innerHTML.trim()) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false });
    canvas.toBlob(b => downloadBlob(b, generateFileName('png')), 'image/png');
    canvas.toBlob(b => downloadBlob(b, generateFileName('jpg')), 'image/jpeg', 0.92);
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2 + 20] });
    pdf.addImage(imgData, 'PNG', 0, 10, canvas.width / 2, canvas.height / 2);
    pdf.save(generateFileName('pdf'));
    showToast('Tous les formats exportés ✓');
  }

  function copyHtmlToClipboard() {
    const html = preview.innerHTML;
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => showToast('HTML copié !')).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = html; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('HTML copié !');
    });
  }

  // --- Dark Mode ---
  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const btn = $('#darkModeToggle');
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('sigDarkMode', document.body.classList.contains('dark') ? '1' : '0');
  }

  // --- Team Management ---
  function saveTeam() {
    localStorage.setItem('sigTeam', JSON.stringify(team));
    renderTeam();
    renderDirectory();
  }

  function addToTeam(data) {
    const exists = team.findIndex(m => m.email === data.email);
    if (exists >= 0) { team[exists] = data; showToast('Membre mis à jour'); }
    else { team.push(data); showToast('Membre ajouté à l\'équipe'); }
    saveTeam();
  }

  function deleteFromTeam(idx) {
    team.splice(idx, 1);
    saveTeam();
  }

  function renderTeam() {
    const list = $('#teamList');
    const filter = $('#teamFilter').value;
    const filtered = filter ? team.filter(m => m.department === filter) : team;
    if (!filtered.length) {
      list.innerHTML = '<p class="text-muted">Aucun membre trouvé.</p>';
      return;
    }
    list.innerHTML = filtered.map((m, i) => {
      const origIdx = team.indexOf(m);
      const deptName = [...$('#teamFilter').options].find(o => o.value === m.department)?.textContent || m.department || '';
      return `
      <div class="team-item" data-idx="${origIdx}">
        <div class="team-item-info">
          <strong>${m.firstName} ${m.lastName}</strong>
          <span class="text-muted">${m.title || ''} ${deptName ? '· ' + deptName : ''}</span>
          <span class="text-muted">${m.email}</span>
        </div>
        <div class="team-item-actions">
          <button class="btn btn-xs btn-outline team-load">Charger</button>
          <button class="btn btn-xs btn-outline team-delete">Suppr.</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.team-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.closest('.team-item').dataset.idx);
        const m = team[idx];
        if (!m) return;
        ['firstName','lastName','title','company','email','phone','phone2','mobile','website','address','linkedin','facebook','twitter','instagram'].forEach(k => {
          const el = document.getElementById(k);
          if (el) el.value = m[k] || '';
        });
        if (m.department) $('#department').value = m.department;
        showToast('Chargé dans le formulaire');
        switchTab('single');
      });
    });
    list.querySelectorAll('.team-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.closest('.team-item').dataset.idx);
        deleteFromTeam(idx);
      });
    });
  }

  // --- Directory ---
  function renderDirectory() {
    const list = $('#directoryList');
    if (!team.length) {
      list.innerHTML = '<p class="text-muted">Ajoutez des membres dans l\'onglet Équipe.</p>';
      return;
    }
    list.innerHTML = team.map((m, i) => {
      const html = Templates.render(m, 'classic', '#1a73e8', m.fontFamily || '');
      const deptName = [...$('#teamFilter').options].find(o => o.value === m.department)?.textContent || '';
      return `
      <div class="directory-item">
        <div class="directory-meta">
          <strong>${m.firstName} ${m.lastName}</strong>
          <span class="text-muted">${deptName}</span>
        </div>
        <div class="directory-preview">${html}</div>
        <button class="btn btn-xs btn-primary copy-dir-html" data-idx="${i}">Copier HTML</button>
      </div>`;
    }).join('');

    $$('.copy-dir-html').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = team[parseInt(btn.dataset.idx)];
        if (!m) return;
        const html = Templates.render(m, 'classic', '#1a73e8');
        navigator.clipboard.writeText(html).then(() => showToast('HTML copié !'));
      });
    });
  }

  // --- History ---
  function addToHistory(data, template, color, font) {
    const entry = { data, template, color, font, date: new Date().toISOString() };
    history.unshift(entry);
    if (history.length > 20) history.pop();
    localStorage.setItem('sigHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const list = $('#historyList');
    if (!history.length) {
      list.innerHTML = '<p class="text-muted">Aucune signature pour le moment.</p>';
      return;
    }
    list.innerHTML = history.map((entry, i) => `
      <div class="history-item" data-idx="${i}">
        <div class="history-meta">
          <strong>${entry.data.firstName} ${entry.data.lastName}</strong>
          <span class="text-muted">${new Date(entry.date).toLocaleDateString()}</span>
        </div>
        <div class="history-preview">${Templates.render(entry.data, entry.template, entry.color, entry.font)}</div>
        <button class="btn btn-xs btn-outline restore-history">Restaurer</button>
      </div>
    `).join('');

    $$('.restore-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.closest('.history-item').dataset.idx);
        const entry = history[idx];
        if (!entry) return;
        Object.entries(entry.data).forEach(([k, v]) => {
          const el = document.getElementById(k);
          if (el && typeof v === 'string') el.value = v;
        });
        templateSel.value = entry.template;
        colorInput.value = entry.color;
        fontFamily.value = entry.font || '';
        logoDataUrl = entry.data.logoUrl || null;
        photoDataUrl = entry.data.photoUrl || null;
        loadGoogleFont(fontFamily.value);
        renderPreview(entry.data, entry.template, entry.color, entry.font);
        showToast('Signature restaurée !');
        switchTab('single');
      });
    });
  }

  // --- Toast ---
  function showToast(msg) {
    let toast = $('#toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.className = 'toast show';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2500);
  }

  // --- Navigation ---
  function switchTab(name) {
    const map = { single: 'Signature', team: 'Équipe', directory: 'Annuaire', history: 'Historique' };
    $$('.nav-links a').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + name));
    $$('.section').forEach(s => s.classList.toggle('active', s.id === name));
    if (name === 'team') renderTeam();
    if (name === 'directory') renderDirectory();
    if (name === 'history') renderHistory();
  }

  // --- Bulk CSV Export for Team ---
  function exportTeamCsv() {
    if (!team.length) { showToast('Aucun membre dans l\'équipe'); return; }
    const headers = ['firstName','lastName','title','company','email','phone','phone2','mobile','website','address','department','linkedin','facebook','twitter','instagram'];
    const rows = team.map(m => headers.map(h => `"${(m[h] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'equipe_signatures.csv');
  }

  async function exportTeamPdf() {
    if (!team.length) { showToast('Aucun membre dans l\'équipe'); return; }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let i = 0; i < team.length; i++) {
      if (i > 0) pdf.addPage();
      const div = document.createElement('div');
      div.innerHTML = Templates.render(team[i], 'classic', '#1a73e8');
      div.style.position = 'absolute'; div.style.left = '-9999px';
      document.body.appendChild(div);
      const canvas = await html2canvas(div, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(div);
      const imgData = canvas.toDataURL('image/png');
      const w = 190; const h = (canvas.height / canvas.width) * w;
      pdf.addImage(imgData, 'PNG', 10, 10, w, h);
    }
    pdf.save('annuaire_equipe.pdf');
    showToast(`PDF généré : ${team.length} membre(s)`);
  }

  // --- Init ---
  function init() {
    // Navigation
    $$('.nav-links a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        switchTab(link.getAttribute('href').replace('#', ''));
      });
    });

    // Form submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = getFormData();
      const template = templateSel.value;
      const color = colorInput.value;
      const font = fontFamily.value;
      renderPreview(data, template, color, font);
      addToHistory(data, template, color, font);
    });

    // Live preview
    let debounceTimer;
    const schedulePreview = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const data = getFormData();
          renderPreview(data, templateSel.value, colorInput.value, fontFamily.value);
        } catch (e) {
          console.error('Preview error:', e);
          showToast('Erreur de rendu: ' + e.message);
        }
      }, 300);
    };
    form.addEventListener('input', schedulePreview);
    form.addEventListener('change', schedulePreview);
    // Direct listeners for key controls
    templateSel.addEventListener('change', schedulePreview);
    colorInput.addEventListener('change', schedulePreview);
    fontFamily.addEventListener('change', schedulePreview);

    // Google Font
    fontFamily.addEventListener('change', () => loadGoogleFont(fontFamily.value));

    // Logo upload
    $('#logo').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) { logoDataUrl = null; schedulePreview(); return; }
      const reader = new FileReader();
      reader.onload = ev => { logoDataUrl = ev.target.result; schedulePreview(); };
      reader.readAsDataURL(file);
    });

    // Photo upload
    $('#photo').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) { photoDataUrl = null; schedulePreview(); return; }
      const reader = new FileReader();
      reader.onload = ev => { photoDataUrl = ev.target.result; schedulePreview(); };
      reader.readAsDataURL(file);
    });

    // Export with loading state
    $$('[data-export]').forEach(btn => btn.addEventListener('click', withLoading(btn, () => exportAs(btn.dataset.export))));
    $('#downloadAllBtn').addEventListener('click', withLoading($('#downloadAllBtn'), exportAllFormats));
    $('#copyHtmlBtn').addEventListener('click', copyHtmlToClipboard);

    // Test email
    $('#testEmailBtn').addEventListener('click', () => {
      const data = getFormData();
      if (!data.email) { showToast('Email requis'); return; }
      const subject = encodeURIComponent('Test signature email');
      const body = encodeURIComponent('Voici un aperçu de ma nouvelle signature :\n\n' + preview.innerHTML.replace(/<[^>]+>/g, ''));
      window.open(`mailto:${data.email}?subject=${subject}&body=${body}`, '_blank');
      showToast('Email client ouvert');
    });

    // Team
    $('#saveToTeamBtn').addEventListener('click', () => addToTeam(getFormData()));
    $('#teamFilter').addEventListener('change', renderTeam);
    $('#exportTeamCsvBtn').addEventListener('click', exportTeamCsv);
    $('#exportTeamPdfBtn').addEventListener('click', withLoading($('#exportTeamPdfBtn'), exportTeamPdf));
    $('#clearTeamBtn').addEventListener('click', () => { if (confirm('Effacer toute l\'équipe ?')) { team = []; saveTeam(); } });
    $('#importTeamBtn').addEventListener('click', () => $('#teamCsvImport').click());
    $('#teamCsvImport').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => {
        if (r.data && r.data.length) {
          r.data.forEach(row => {
            const m = {
              firstName: row.firstName || '', lastName: row.lastName || '',
              title: row.title || '', company: row.company || '',
              email: row.email || '', phone: row.phone || '',
              phone2: row.phone2 || '', mobile: row.mobile || '',
              website: row.website || '', address: row.address || '',
              department: row.department || '',
              linkedin: row.linkedin || '', facebook: row.facebook || '',
              twitter: row.twitter || '', instagram: row.instagram || '',
              logoUrl: null, photoUrl: null, socialHtml: '',
            };
            if (m.firstName || m.lastName || m.email) team.push(m);
          });
          saveTeam();
          showToast(`${r.data.length} membre(s) importé(s)`);
        }
      }});
    });

    // Dark mode
    if (localStorage.getItem('sigDarkMode') === '1') toggleDarkMode();
    $('#darkModeToggle').addEventListener('click', toggleDarkMode);

    // History
    $('#clearHistoryBtn').addEventListener('click', () => { history = []; localStorage.removeItem('sigHistory'); renderHistory(); showToast('Historique effacé'); });

    // Initial render
    const data = getFormData();
    renderPreview(data, templateSel.value, colorInput.value, fontFamily.value);
    renderHistory();
  }

  // Expose for inline onclick
  window.deleteFromTeam = deleteFromTeam;
  window.showToast = showToast;

  document.addEventListener('DOMContentLoaded', init);
})();
