/**
 * DISTRICT SPORTS — Homepage (Welcome Page) Logic
 * Loads tournaments and public notices from Supabase,
 * and handles public tournament registration.
 */

(function () {
  'use strict';

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var sb = function () {
    return window.SB || null;
  };

  /* ---------- 1. LOAD NOTICES & TOURNAMENTS ---------- */

  function loadPublicNotices() {
    var host = document.getElementById('publicNotices');
    if (!host) return;

    var client = sb();
    if (!client) {
      console.warn('[HOME] Supabase client not available on homepage.');
      return;
    }

    // Step 1: Fetch clubs to resolve host club names
    var clubsMap = {};
    client.from('clubs').select('id, name, district').then(function (cRes) {
      if (cRes && cRes.data) {
        cRes.data.forEach(function (c) {
          clubsMap[c.id] = c.name;
        });
      }

      // Step 2: Fetch Tournaments
      client.from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(function (tRes) {
          var tournaments = (tRes && tRes.data) || [];

          // Step 3: Fetch general notices
          client.from('notices')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(function (nRes) {
              var notices = (nRes && nRes.data) || [];
              renderNoticesAndTournaments(host, tournaments, notices, clubsMap);
            }).catch(function (nErr) {
              console.warn('[HOME] Notices query:', nErr);
              renderNoticesAndTournaments(host, tournaments, [], clubsMap);
            });
        }).catch(function (tErr) {
          console.warn('[HOME] Tournaments query:', tErr);
          // If tournaments table not yet created, still try general notices
          client.from('notices')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(function (nRes) {
              var notices = (nRes && nRes.data) || [];
              renderNoticesAndTournaments(host, [], notices, clubsMap);
            }).catch(function (err) {
              console.error('[HOME] Notices fallback error:', err);
            });
        });
    }).catch(function (err) {
      console.error('[HOME] Clubs load error:', err);
    });
  }

  function renderNoticesAndTournaments(host, tournaments, notices, clubsMap) {
    if (!tournaments.length && !notices.length) {
      host.innerHTML = '<p class="empty-state">No public notices or tournaments available at this time.</p>';
      return;
    }

    var html = '';

    // Render Tournaments First (they are interactive and have registrations)
    tournaments.forEach(function (t) {
      var hostClub = clubsMap[t.club_id] || 'District Sports Club';
      var dates = t.start_date ? esc(t.start_date) : 'TBA';
      if (t.end_date) dates += ' to ' + esc(t.end_date);
      var deadline = t.registration_deadline ? esc(t.registration_deadline) : 'Open';
      var isClosed = t.status === 'closed' || t.status === 'completed';

      html += '<article class="notice-item tourn-notice-item">' +
        '<div class="tourn-badge-wrap">' +
          '<span class="category tourn-pill">🏆 TOURNAMENT</span>' +
          '<span class="tourn-sport-tag">' + esc(t.sport || 'Sports') + '</span>' +
        '</div>' +
        '<div class="tourn-details">' +
          '<h3 class="notice-title">' + esc(t.title) + '</h3>' +
          '<div class="tourn-meta-row">' +
            '<span class="tourn-meta-chip">🏟️ <b>Venue:</b> ' + esc(t.venue || 'TBA') + '</span>' +
            '<span class="tourn-meta-chip">📅 <b>Dates:</b> ' + dates + '</span>' +
            '<span class="tourn-meta-chip">⏳ <b>Deadline:</b> ' + deadline + '</span>' +
            '<span class="tourn-meta-chip">🏢 <b>Organized by:</b> ' + esc(hostClub) + '</span>' +
            (t.entry_fee ? '<span class="tourn-meta-chip">🎟️ <b>Fee:</b> ' + esc(t.entry_fee) + '</span>' : '') +
          '</div>' +
          (t.description ? '<p class="tourn-description">' + esc(t.description) + '</p>' : '') +
        '</div>' +
        '<div class="tourn-action">' +
          (isClosed
            ? '<span class="tourn-closed-label">Registration Closed</span>'
            : '<button type="button" class="btn btn-primary btn-signup btn-tourn-register" ' +
                'data-tourn-id="' + esc(t.id) + '" ' +
                'data-tourn-title="' + esc(t.title) + '" ' +
                'data-tourn-club="' + esc(hostClub) + '" ' +
                'data-tourn-venue="' + esc(t.venue || '') + '">' +
                'Register Team →' +
              '</button>'
          ) +
        '</div>' +
      '</article>';
    });

    // Render General Notices
    notices.forEach(function (n) {
      // Don't show duplicate system tournament notices if tournament already listed
      var isTourn = (n.category === 'tournament' || (n.title && n.title.indexOf('Tournament') !== -1));
      if (isTourn && tournaments.length > 0) return;

      var dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString() : '';
      html += '<article class="notice-item">' +
        '<div><span class="category">' + esc(n.category || 'NOTICE') + '</span></div>' +
        '<div>' +
          '<div class="notice-title">' + esc(n.title) + '</div>' +
          (n.body ? '<p class="notice-body-text">' + esc(n.body) + '</p>' : '') +
          (dateStr ? '<div class="notice-meta">' + esc(dateStr) + '</div>' : '') +
        '</div>' +
        '<div></div>' +
      '</article>';
    });

    host.innerHTML = html;
    bindTournamentButtons();
  }

  /* ---------- 2. TOURNAMENT REGISTRATION MODAL ---------- */

  var modal = null;
  var modalCloseBtn = null;
  var modalCancelBtn = null;
  var regForm = null;
  var modalAlert = null;

  function initModal() {
    modal = document.getElementById('tournModal');
    modalCloseBtn = document.getElementById('modalCloseBtn');
    modalCancelBtn = document.getElementById('modalCancelBtn');
    regForm = document.getElementById('publicTournamentRegForm');
    modalAlert = document.getElementById('modalAlert');

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    // Close when clicking backdrop
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) {
        closeModal();
      }
    });

    if (regForm) {
      regForm.addEventListener('submit', handleRegistrationSubmit);
    }
  }

  function openModal(tournId, title, club, venue) {
    if (!modal) return;

    var idInput = document.getElementById('modalTournId');
    var titleEl = document.getElementById('modalTournTitle');
    var subEl = document.getElementById('modalTournSubtitle');

    if (idInput) idInput.value = tournId;
    if (titleEl) titleEl.textContent = 'Register for ' + (title || 'Tournament');
    if (subEl) subEl.textContent = 'Organized by ' + (club || 'District Sports') + (venue ? ' • ' + venue : '');

    if (modalAlert) {
      modalAlert.hidden = true;
      modalAlert.textContent = '';
      modalAlert.className = 'modal-alert';
    }

    if (regForm) regForm.reset();

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var firstInput = document.getElementById('regTeamName');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function bindTournamentButtons() {
    var btns = document.querySelectorAll('.btn-tourn-register');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tourn-id');
        var title = btn.getAttribute('data-tourn-title');
        var club = btn.getAttribute('data-tourn-club');
        var venue = btn.getAttribute('data-tourn-venue');
        openModal(id, title, club, venue);
      });
    });
  }

  function handleRegistrationSubmit(e) {
    e.preventDefault();
    var client = sb();
    if (!client) {
      showModalAlert('Supabase is not connected. Please reload the page.', true);
      return;
    }

    var tournId = document.getElementById('modalTournId').value;
    var applicantType = document.getElementById('regApplicantType').value;
    var teamName = (document.getElementById('regTeamName').value || '').trim();
    var contactName = (document.getElementById('regContactName').value || '').trim();
    var contactPhone = (document.getElementById('regContactPhone').value || '').trim();
    var contactEmail = (document.getElementById('regContactEmail').value || '').trim();
    var district = document.getElementById('regDistrict').value;
    var playerCount = parseInt(document.getElementById('regPlayerCount').value, 10) || 11;
    var message = (document.getElementById('regMessage').value || '').trim();

    if (!teamName || !contactName || !contactPhone || !contactEmail || !district) {
      showModalAlert('Please fill in all required fields marked with *.', true);
      return;
    }

    var submitBtn = document.getElementById('regSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request…';
    }

    client.from('tournament_requests').insert([{
      tournament_id: Number(tournId),
      applicant_type: applicantType,
      team_name: teamName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      district: district,
      player_count: playerCount,
      message: message || null,
      status: 'pending',
      created_at: new Date().toISOString()
    }]).then(function (res) {
      if (res && res.error) throw res.error;

      showModalAlert('🎉 Registration request submitted successfully! The organizing club has received your application.', false);
      if (regForm) regForm.reset();

      setTimeout(function () {
        closeModal();
      }, 2500);
    }).catch(function (err) {
      console.error('[TOURN_REG] Submit error:', err);
      showModalAlert('Could not submit registration: ' + (err.message || 'Please check if the tournament_requests table exists in Supabase.'), true);
    }).finally(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration Request';
      }
    });
  }

  function showModalAlert(text, isError) {
    if (!modalAlert) return;
    modalAlert.textContent = text;
    modalAlert.className = 'modal-alert ' + (isError ? 'modal-alert-error' : 'modal-alert-success');
    modalAlert.hidden = false;
  }

  /* ---------- 3. LOAD UPCOMING MATCHES ---------- */

  function loadUpcomingMatches() {
    var host = document.getElementById('upcomingMatches');
    if (!host) return;

    var client = sb();
    if (!client) return;

    client.from('clubs').select('id, name').then(function (cRes) {
      var clubsMap = {};
      if (cRes && cRes.data) {
        cRes.data.forEach(function (c) { clubsMap[c.id] = c.name; });
      }

      client.from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .limit(5)
        .then(function (mRes) {
          var matches = (mRes && mRes.data) || [];
          if (!matches.length) return; // keep default empty state

          host.innerHTML = matches.map(function (m) {
            var home = clubsMap[m.home_club_id] || 'Home Team';
            var away = clubsMap[m.away_club_id] || 'Away Team';
            var dateStr = m.match_date ? new Date(m.match_date).toLocaleString() : 'TBA';
            return '<div class="notice-item" style="display:grid; grid-template-columns: 1fr auto; gap: 8px;">' +
              '<div>' +
                '<h4 style="font-size: 0.95rem; font-weight:600; margin-bottom: 2px;">' + esc(home) + ' vs ' + esc(away) + '</h4>' +
                '<p style="font-size: 0.78rem; color: var(--text-soft);">' +
                  '🏟️ ' + esc(m.venue || 'Stadium') + ' • 📅 ' + esc(dateStr) +
                '</p>' +
              '</div>' +
              '<div><span class="category" style="color:var(--accent-dark); font-weight:700;">' + esc(m.status || 'SCHEDULED') + '</span></div>' +
            '</div>';
          }).join('');
        }).catch(function (err) {
          console.warn('[HOME] Matches load:', err);
        });
    });
  }

  /* ---------- 4. LOAD PLAYER RANKINGS & LIFETIME STATS ---------- */

  var playerStatsCache = [];

  function loadPlayerRankings() {
    var host = document.getElementById('playerRankings');
    if (!host) return;

    var client = sb();
    if (!client) return;

    client.from('clubs').select('id, name, district').then(function (cRes) {
      var clubsMap = {};
      if (cRes && cRes.data) {
        cRes.data.forEach(function (c) { clubsMap[c.id] = c.name; });
      }

      client.from('player_stats')
        .select('*')
        .order('goals', { ascending: false })
        .order('rating', { ascending: false })
        .limit(10)
        .then(function (res) {
          var stats = (res && res.data) || [];
          playerStatsCache = stats;

          if (!stats.length) {
            host.innerHTML = '<p class="empty-state">No player ranking data recorded yet.</p>';
            return;
          }

          host.innerHTML = stats.map(function (p, idx) {
            var club = clubsMap[p.club_id] || 'Sports Club';
            var rankBadge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#' + (idx + 1)));
            var g = p.goals || 0;
            var a = p.assists || 0;
            var r = p.rating || '7.5';

            return '<div class="player-ranking-entry" data-player-stat-id="' + esc(p.id) + '">' +
              '<span class="player-rank" style="font-size:1rem; font-weight:700;">' + rankBadge + '</span>' +
              '<div class="player-ranking-info">' +
                '<div class="player-name"><b>' + esc(p.player_name) + '</b> <span class="player-pos-chip">' + esc(p.position || 'Player') + '</span></div>' +
                '<div class="player-club">' + esc(club) + ' • <span class="stat-pill-highlight">⚽ ' + g + ' Goals</span> • <span>🎯 ' + a + ' Assists</span> • <span>⭐ ' + r + '</span></div>' +
              '</div>' +
              '<button type="button" class="btn-view-player-profile" data-player-stat-id="' + esc(p.id) + '">View Stats →</button>' +
            '</div>';
          }).join('');

          bindPlayerProfileClicks(clubsMap);
        }).catch(function (err) {
          console.warn('[HOME] Player stats load:', err);
        });
    });
  }

  function bindPlayerProfileClicks(clubsMap) {
    var triggers = document.querySelectorAll('.player-ranking-entry, .btn-view-player-profile');
    triggers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        var statId = el.getAttribute('data-player-stat-id');
        if (!statId) return;
        var p = playerStatsCache.find(function (item) { return String(item.id) === String(statId); });
        if (p) openPlayerStatsModal(p, clubsMap);
      });
    });
  }

  var playerModal = null;
  var playerModalClose = null;
  var playerModalDone = null;

  function initPlayerModal() {
    playerModal = document.getElementById('playerStatsModal');
    playerModalClose = document.getElementById('modalPlayerCloseBtn');
    playerModalDone = document.getElementById('modalPlayerDoneBtn');

    if (playerModalClose) playerModalClose.addEventListener('click', closePlayerModal);
    if (playerModalDone) playerModalDone.addEventListener('click', closePlayerModal);

    if (playerModal) {
      playerModal.addEventListener('click', function (e) {
        if (e.target === playerModal) closePlayerModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && playerModal && !playerModal.hidden) {
        closePlayerModal();
      }
    });
  }

  function openPlayerStatsModal(p, clubsMap) {
    if (!playerModal) return;

    var nameEl = document.getElementById('modalPlayerName');
    var subEl = document.getElementById('modalPlayerSub');
    var avatarEl = document.getElementById('modalPlayerAvatar');

    var clubName = (clubsMap && clubsMap[p.club_id]) || 'Sports Club';
    var pos = p.position || 'Player';

    if (nameEl) nameEl.textContent = p.player_name || 'Player';
    if (subEl) subEl.textContent = pos + ' • ' + clubName;
    if (avatarEl) {
      var inits = (p.player_name || 'PL').split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
      avatarEl.textContent = inits || 'PL';
    }

    var goals = p.goals || 0;
    var assists = p.assists || 0;
    var matches = p.matches_played || 0;
    var rating = p.rating || '7.5';
    var minutes = p.minutes_played || (matches * 90);
    var cleanSheets = p.clean_sheets || 0;
    var yellow = p.yellow_cards || 0;
    var red = p.red_cards || 0;
    var motm = p.motm_awards || 0;
    var season = p.season || '2026';
    var scope = p.tournament_id ? 'Tournament ID #' + p.tournament_id : 'Overall Career Lifetime';

    var impact = matches > 0 ? ((goals + assists) / matches).toFixed(2) : '0.00';

    fillEl('modalStatGoals', goals);
    fillEl('modalStatAssists', assists);
    fillEl('modalStatMatches', matches);
    fillEl('modalStatRating', rating);
    fillEl('modalStatMinutes', minutes + "'");
    fillEl('modalStatCleanSheets', cleanSheets);
    fillEl('modalStatYellow', yellow);
    fillEl('modalStatRed', red);
    fillEl('modalStatMotm', motm);
    fillEl('modalStatImpact', impact + ' per match');
    fillEl('modalStatScope', scope);
    fillEl('modalStatSeason', season);

    playerModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function fillEl(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function closePlayerModal() {
    if (!playerModal) return;
    playerModal.hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- INITIALIZE ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    initModal();
    initPlayerModal();
    loadPublicNotices();
    loadUpcomingMatches();
    loadPlayerRankings();
  });

})();
