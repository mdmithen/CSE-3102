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

          // Step 3: Fetch general notices (public only - club-targeted
          // notices belong to one club and must not appear here)
          client.from('notices')
            .select('*')
            .eq('is_published', true)
            .is('club_id', null)
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
            .is('club_id', null)
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
    /* Safety net: a notice aimed at one club never reaches the public
       page, even if an older query returned it. */
    notices = (notices || []).filter(function (n) { return !n.club_id; });

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
            : '<span class="tourn-closed-label" style="text-align:right; line-height:1.4;">' +
                'Apply from your<br><b>Club Dashboard → Notice Board</b>' +
              '</span>'
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

  /* A player can own several stat rows: a lifetime row, tournament
     rows, and one row per match (the host club records match stats).
     Adding them all together would double count, so per player only
     one grain is summed:
       - match rows, when the player has any (they are the finest
         grain and already hold that match's performance)
       - otherwise the career / tournament rows
     The surviving row keeps a real id so the profile modal works. */
  function aggregatePlayerStats(rows) {
    var groups = {};

    rows.forEach(function (r) {
      var key = r.player_id
        ? ('p:' + r.player_id)
        : ('n:' + String(r.player_name || '').toLowerCase().trim() + '|' + String(r.club_id || ''));
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    var sumFields = ['matches_played', 'goals', 'assists', 'minutes_played',
                     'clean_sheets', 'yellow_cards', 'red_cards', 'innings',
                     'runs', 'wickets', 'catches', 'fifties', 'hundreds',
                     'motm_awards'];

    return Object.keys(groups).map(function (key) {
      var all = groups[key];
      var hasMatchRows = all.some(function (r) { return r.match_id; });
      var used = all.filter(function (r) { return hasMatchRows ? !!r.match_id : !r.match_id; });

      var base = used[0];
      var out = {};
      Object.keys(base).forEach(function (k) { out[k] = base[k]; });

      sumFields.forEach(function (f) {
        out[f] = used.reduce(function (total, r) {
          return total + (Number(r[f]) || 0);
        }, 0);
      });

      // Rating is a quality grade, not a total: weight it by matches
      var rated = used.filter(function (r) { return r.rating !== null && r.rating !== undefined; });
      if (rated.length) {
        var weight = 0, weighted = 0;
        rated.forEach(function (r) {
          var w = Math.max(1, Number(r.matches_played) || 1);
          weight += w;
          weighted += (parseFloat(r.rating) || 0) * w;
        });
        out.rating = weight ? Math.round((weighted / weight) * 100) / 100 : null;
      }

      // A mixed set keeps the sport it has the most entries in
      var votes = {};
      used.forEach(function (r) {
        var s = r.sport || 'Football';
        votes[s] = (votes[s] || 0) + 1;
      });
      out.sport = Object.keys(votes).sort(function (a, b) { return votes[b] - votes[a]; })[0] || 'Football';

      // Aggregated numbers no longer belong to one scope
      out.tournament_id = null;
      out.match_id = null;
      return out;
    });
  }

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
        .then(function (res) {
          var rows = (res && res.data) || [];

          /* One row per player, then sport-aware ordering: football
             by goals, cricket by runs, ties broken by rating. */
          var stats = aggregatePlayerStats(rows);
          stats.sort(function (a, b) {
            var pa = a.sport === 'Cricket' ? (a.runs || 0) : (a.goals || 0);
            var pb = b.sport === 'Cricket' ? (b.runs || 0) : (b.goals || 0);
            if (pb !== pa) return pb - pa;
            return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
          });

          playerStatsCache = stats.slice(0, 10);
          stats = playerStatsCache;

          if (!stats.length) {
            host.innerHTML = '<p class="empty-state">No player ranking data recorded yet.</p>';
            return;
          }

          host.innerHTML = stats.map(function (p, idx) {
            var club = clubsMap[p.club_id] || 'Sports Club';
            var rankBadge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#' + (idx + 1)));
            var isCrk = p.sport === 'Cricket';
            var r = p.rating || '7.5';

            var statPills = isCrk
              ? '<span class="stat-pill-highlight">🏏 ' + (p.runs || 0) + ' Runs</span> • <span>🎯 ' + (p.wickets || 0) + ' Wickets</span>'
              : '<span class="stat-pill-highlight">⚽ ' + (p.goals || 0) + ' Goals</span> • <span>🎯 ' + (p.assists || 0) + ' Assists</span>';

            return '<div class="player-ranking-entry" data-player-stat-id="' + esc(p.id) + '">' +
              '<span class="player-rank" style="font-size:1rem; font-weight:700;">' + rankBadge + '</span>' +
              '<div class="player-ranking-info">' +
                '<div class="player-name"><b>' + esc(p.player_name) + '</b> <span class="player-pos-chip">' + esc(isCrk ? '🏏 ' : '⚽ ') + esc(p.position || 'Player') + '</span></div>' +
                '<div class="player-club">' + esc(club) + ' • ' + statPills + ' • <span>⭐ ' + r + '</span></div>' +
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

  /* ---------- 4b. CLUB RANKINGS ---------- */

  /* Points from completed matches: 3 for a win, 1 for a draw.
     Goal difference, then goals scored, then name break ties. */
  function loadClubRankings() {
    var host = document.getElementById('clubRankings');
    if (!host) return;

    var client = sb();
    if (!client) return;

    client.from('clubs').select('id, name, district').then(function (cRes) {
      var clubs = (cRes && cRes.data) || [];
      if (!clubs.length) {
        host.innerHTML = '<p class="empty-state">No club ranking data available.</p>';
        return;
      }

      client.from('matches')
        .select('home_club_id, away_club_id, home_score, away_score, status')
        .then(function (mRes) {
          var matches = (mRes && mRes.data) || [];

          var table = {};
          clubs.forEach(function (c) {
            table[c.id] = {
              id: c.id, name: c.name, district: c.district || '',
              played: 0, won: 0, drawn: 0, lost: 0,
              gf: 0, ga: 0, points: 0
            };
          });

          matches.forEach(function (m) {
            if (m.status !== 'completed') return;
            if (m.home_score === null || m.home_score === undefined) return;
            if (m.away_score === null || m.away_score === undefined) return;

            var home = table[m.home_club_id];
            var away = table[m.away_club_id];
            if (!home || !away) return;

            var hs = Number(m.home_score) || 0;
            var as = Number(m.away_score) || 0;

            home.played++; away.played++;
            home.gf += hs; home.ga += as;
            away.gf += as; away.ga += hs;

            if (hs > as) {
              home.won++; away.lost++; home.points += 3;
            } else if (hs < as) {
              away.won++; home.lost++; away.points += 3;
            } else {
              home.drawn++; away.drawn++;
              home.points += 1; away.points += 1;
            }
          });

          var ranked = Object.keys(table).map(function (k) { return table[k]; })
            .filter(function (t) { return t.played > 0; })
            .sort(function (a, b) {
              if (b.points !== a.points) return b.points - a.points;
              var gdA = a.gf - a.ga, gdB = b.gf - b.ga;
              if (gdB !== gdA) return gdB - gdA;
              if (b.gf !== a.gf) return b.gf - a.gf;
              return String(a.name).localeCompare(String(b.name));
            });

          if (!ranked.length) {
            host.innerHTML = '<p class="empty-state">No club ranking data available. Rankings appear after a match result is marked completed.</p>';
            return;
          }

          host.innerHTML = ranked.slice(0, 10).map(function (t, idx) {
            var badge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#' + (idx + 1)));
            var gd = t.gf - t.ga;
            return '<div class="ranking-entry">' +
              '<span class="rank" style="font-size:1rem; font-weight:700;">' + badge + '</span>' +
              '<div class="ranking-club">' +
                '<b>' + esc(t.name) + '</b>' +
                (t.district ? ' <small style="color:var(--text-soft);">• ' + esc(t.district) + '</small>' : '') +
                '<div style="font-size:0.75rem; color:var(--text-soft); margin-top:2px;">' +
                  'P ' + t.played + ' • W ' + t.won + ' • D ' + t.drawn + ' • L ' + t.lost +
                  ' • GD ' + (gd > 0 ? '+' + gd : gd) +
                '</div>' +
              '</div>' +
              '<span class="ranking-points" style="font-weight:700;">' + t.points + ' pts</span>' +
            '</div>';
          }).join('');
        }).catch(function (err) {
          console.warn('[HOME] Club rankings load:', err);
          host.innerHTML = '<p class="empty-state">Could not load club rankings.</p>';
        });
    }).catch(function (err) {
      console.warn('[HOME] Clubs load for rankings:', err);
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

    var isCrk = p.sport === 'Cricket';
    var matches = p.matches_played || 0;
    var rating = p.rating || '7.5';
    var motm = p.motm_awards || 0;
    var season = p.season || '2026';
    var scope = p.tournament_id ? 'Tournament ID #' + p.tournament_id : 'Overall Career Lifetime';

    if (isCrk) {
      /* Cricket profile: runs/wickets headline, and the career
         breakdown shows innings, catches, fifties and hundreds
         instead of minutes and cards. Labels are rewritten so the
         static markup never lies about what the number is. */
      var runs = p.runs || 0;
      var wickets = p.wickets || 0;

      setModalStat('modalStatGoals', runs, 'Runs Scored', '🏏');
      setModalStat('modalStatAssists', wickets, 'Wickets', '🎯');
      fillEl('modalStatMatches', matches);
      fillEl('modalStatRating', rating);
      setModalStat('modalStatMinutes', (p.innings || 0), '🏏 Innings');
      setModalStat('modalStatCleanSheets', (p.catches || 0), '🧤 Catches / Stumpings');
      setModalStat('modalStatYellow', (p.fifties || 0), '🌟 Fifties (50s)');
      setModalStat('modalStatRed', (p.hundreds || 0), '💯 Hundreds (100s)');
      fillEl('modalStatMotm', motm);
      var cImpact = matches > 0 ? ((runs + wickets) / matches).toFixed(2) : '0.00';
      setModalStat('modalStatImpact', cImpact + ' per match', 'Runs + Wickets / Match');
      fillEl('modalStatScope', scope);
      fillEl('modalStatSeason', season);
    } else {
      var goals = p.goals || 0;
      var assists = p.assists || 0;
      var minutes = p.minutes_played || (matches * 90);
      var cleanSheets = p.clean_sheets || 0;
      var yellow = p.yellow_cards || 0;
      var red = p.red_cards || 0;
      var impact = matches > 0 ? ((goals + assists) / matches).toFixed(2) : '0.00';

      // setModalStat (not fillEl) so labels/icons rewritten by a
      // cricket row are restored when a football row is opened next
      setModalStat('modalStatGoals', goals, 'Goals Scored', '⚽');
      setModalStat('modalStatAssists', assists, 'Assists', '🎯');
      fillEl('modalStatMatches', matches);
      fillEl('modalStatRating', rating);
      setModalStat('modalStatMinutes', minutes + "'", '⏱️ Minutes Played');
      setModalStat('modalStatCleanSheets', cleanSheets, '🧤 Clean Sheets / Saves');
      setModalStat('modalStatYellow', yellow, '🟨 Yellow Cards');
      setModalStat('modalStatRed', red, '🟥 Red Cards');
      fillEl('modalStatMotm', motm);
      setModalStat('modalStatImpact', impact + ' per match', '📊 Goal Involvement / Match');
      fillEl('modalStatScope', scope);
      fillEl('modalStatSeason', season);
    }

    playerModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  /* Sets a modal stat value and, when given, rewrites the label
     (and icon for the hero cards) next to it - the modal markup is
     static, so this is how cricket rows get honest labels. */
  function setModalStat(id, value, label, icon) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;

    var card = el.closest ? el.closest('.stat-highlight-card') : null;
    if (card) {
      var lbl = card.querySelector('.stat-lbl');
      var ic = card.querySelector('.stat-icon');
      if (lbl && label) lbl.textContent = label;
      if (ic && icon) ic.textContent = icon;
      return;
    }
    var prev = el.previousElementSibling;
    if (prev && label) prev.textContent = label;
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
    initPlayerModal();
    loadPublicNotices();
    loadUpcomingMatches();
    loadPlayerRankings();
    loadClubRankings();
  });

})();
