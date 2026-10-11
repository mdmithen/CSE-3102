// ==========================================
// LOGIN - Very simple check (for class project)
// Admin: admin@gmail.com / 123456
// ==========================================

// 1. Correct admin email + password (fixed)
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASS = "123456";

// 2. Get form + inputs + error box from HTML
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const errorBox = document.getElementById("error");

// 3. When user clicks "Login"
form.addEventListener("submit", function (e) {
  e.preventDefault(); // stop page reload

  const email = emailInput.value.trim();
  const pass = passInput.value;

  // 4. Check login
  // For now: only admin login. Later we will add player login here.
  // Example for later:
  // if (player login) { window.location.href = "player.html"; }

  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    errorBox.textContent = "";
    // Go to admin panel
    window.location.href = "admin.html";
  } else {
    // Show error
    errorBox.textContent = "❌ Wrong email or password!";
  }
});
