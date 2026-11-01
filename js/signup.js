// ==========================================
// SIGNUP - Player account creation
// Uses js/auth.js for the role guard and
// js/supabase-config.js for the Supabase client.
//
// Flow:
//  1. sb.auth.signUp() creates the auth user
//  2. profiles + users rows are written
//  3. a row is inserted into public.join_requests for the chosen club
//     (the player does NOT join the roster yet)
//  4. the club manager approves -> club_approve_request adds the player
//     to public.players; a rejection deletes the join request.
// ==========================================

(function () {

  var form = document.getElementById("signupForm");
  var errorBox = document.getElementById("error");
  var successBox = document.getElementById("success");
  var clubSelect = document.getElementById("club");

  if (!form) return;

  function sb() { return window.SB || null; }

  function setError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg || "";
    if (msg) {
      errorBox.classList.remove("is-shake");
      void errorBox.offsetWidth;
      errorBox.classList.add("is-shake");
    }
  }

  function setSuccess(msg) {
    if (!successBox) return;
    successBox.textContent = msg || "";
  }

  /* ---------- club dropdown ---------- */

  function loadClubs() {
    var sbc = sb();
    if (!sbc || !clubSelect) return;

    clubSelect.innerHTML = '<option value="">Loading clubs…</option>';

    sbc.from("clubs")
      .select("id, name")
      .order("name")
      .then(function (res) {
        var rows = (res && res.data) || [];
        clubSelect.innerHTML = '<option value="">Select a club</option>';

        if (!rows.length) {
          clubSelect.innerHTML = '<option value="">No clubs available</option>';
          return;
        }

        rows.forEach(function (club) {
          var opt = document.createElement("option");
          opt.value = club.name;
          opt.textContent = club.name;
          clubSelect.appendChild(opt);
        });
      })
      .catch(function () {
        clubSelect.innerHTML = '<option value="">Could not load clubs</option>';
      });
  }

  /* ---------- show / hide password ---------- */

  var toggleBtn = document.getElementById("togglePassword");
  var passInput = document.getElementById("password");
  if (toggleBtn && passInput) {
    toggleBtn.addEventListener("click", function () {
      var isHidden = passInput.type === "password";
      passInput.type = isHidden ? "text" : "password";
      toggleBtn.textContent = isHidden ? "Hide" : "Show";
      toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      toggleBtn.setAttribute("aria-pressed", String(isHidden));
      passInput.focus();
    });
  }

  /* ---------- submit ---------- */

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var sbc = sb();
    if (!sbc) {
      setError("Supabase is not connected. Check js/supabase-config.js.");
      return;
    }

    var fullName = (document.getElementById("fullName").value || "").trim();
    var email = (document.getElementById("email").value || "").trim();
    var password = document.getElementById("password").value;
    var phone = (document.getElementById("phone").value || "").trim();
    var address = (document.getElementById("address").value || "").trim();
    var clubName = (document.getElementById("club").value || "").trim();

    if (!fullName || !email || !password || !phone || !address || !clubName) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setError("");
    setSuccess("Creating account…");

    /* 1. Create the Supabase Auth account */
    sbc.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: "player"
        }
      }
    })
    .then(function (res) {
      var user = res && res.data ? res.data.user : null;

      if (res && res.error) {
        setError(res.error.message || "Signup failed.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      if (!user) {
        setError("Account created. Check your email to confirm, then log in.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      /* 2. Profile (name/phone) and the optional users mirror row */
      return sbc.from("profiles").upsert([{
        id: user.id,
        full_name: fullName,
        phone: phone
      }]).then(function (profRes) {
        if (profRes && profRes.error) {
          console.warn("profiles upsert:", profRes.error.message);
        }

        /* The users table is optional: never block the join request on it */
        return sbc.from("users").upsert([{
          id: user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          address: address,
          club_name: clubName,
          role: "player"
        }]).then(function (userRes) {
          if (userRes && userRes.error) {
            console.warn("users insert:", userRes.error.message);
          }

          /* 3. Find the club the player picked */
          return sbc.from("clubs")
            .select("id")
            .eq("name", clubName)
            .maybeSingle()
            .then(function (clubRes) {
              var clubId = (clubRes && clubRes.data) ? clubRes.data.id : null;

              if (!clubId) {
                throw new Error('Club "' + clubName + '" was not found. Ask an admin to register it first.');
              }

              /* 4. Do NOT add the player to the roster here. A join request
                 goes to the club manager instead; the club approves it and
                 only then does the player join the roster. A rejection
                 removes the request (club_reject_request). */
              return sbc.from("join_requests").insert([{
                player_id: user.id,
                club_id: clubId,
                note: address
                  ? ("Address: " + address + (phone ? " • Phone: " + phone : ""))
                  : "New player signup request",
                status: "pending"
              }]).then(function (reqRes) {
                if (reqRes && reqRes.error) throw reqRes.error;

                // Explicitly sign out so player cannot log in before manager approval
                if (window.AUTH && window.AUTH.clearSession) {
                  window.AUTH.clearSession();
                }
                return sbc.auth.signOut().then(function () {
                  setSuccess("Account created! Your join request was sent to " + clubName +
                    ". You can log in once that club approves your request.");
                  form.reset();

                  setTimeout(function () {
                    window.location.href = "login.html";
                  }, 2500);
                });
              });
            });
        });
      });
    })
    .catch(function (err) {
      setError((err && err.message) ? err.message : "Signup failed. Please try again.");
      if (submitBtn) submitBtn.disabled = false;
    })
    .finally(function () {
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  /* ---------- start ---------- */

  loadClubs();

})();
