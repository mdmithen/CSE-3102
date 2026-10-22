// ==========================================
// SIGNUP - Player account creation
// Uses js/auth.js for the role guard and
// js/supabase-config.js for the Supabase client.
//
// Flow:
//  1. sb.auth.signUp() creates the auth user
//  2. Insert a row into public.users (id, full_name,
//     email, phone, address, club_name, role)
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

      /* 2. Save the player profile into profiles + players + users tables */
      return sbc.from("profiles").upsert([{
        id: user.id,
        full_name: fullName,
        phone: phone
      }]).then(function (profRes) {
        if (profRes && profRes.error) {
          console.warn("profiles upsert:", profRes.error.message);
          setSuccess("Auth account created. You can now log in. (Profile save pending.)");
          return;
        }

        /* Insert into users table */
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
            setSuccess("Auth account + profile created. Users table insert pending.");
            return;
          }

          /* Look up the club id by name */
          return sbc.from("clubs")
            .select("id")
            .eq("name", clubName)
            .maybeSingle()
            .then(function (clubRes) {
              var clubId = (clubRes && clubRes.data) ? clubRes.data.id : null;

              if (!clubId) {
                setSuccess("Auth account + profile + users created. Club not found — contact your admin.");
                return;
              }

              /* Add the player to the club roster */
              return sbc.from("players").insert([{
                profile_id: user.id,
                club_id: clubId,
                full_name: fullName,
                status: "active"
              }]).then(function (plyRes) {
                if (plyRes && plyRes.error) {
                  console.warn("players insert:", plyRes.error.message);
                  setSuccess("Auth account + profile + users created. Roster insert pending.");
                  return;
                }

                setSuccess("Account created successfully! You can now log in.");
                form.reset();

                setTimeout(function () {
                  window.location.href = "login.html";
                }, 1500);
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
