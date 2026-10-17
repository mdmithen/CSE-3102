/* ==========================================
   SUPABASE CONFIG - Project connection
   Loads after the supabase-js CDN script and
   before js/auth.js.

   Your two keys (both are safe in the browser):
     - Project URL  -> https://<ref>.supabase.co
     - anon public key -> safe to expose
       NEVER put the service_role key here.
   ========================================== */

var SUPABASE_URL = "https://amynasnspzhblarjwcug.supabase.co";

var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteW5hc25zcHpoYmxhcmp3Y3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDc0MjMsImV4cCI6MjEwNzc4MzQyM30.7ql_p-RTW11Iuc-fQ-Ax1FcvZ0TWmsFv8AjQdNaczSw";

/* Create the shared client used by js/auth.js */
window.SB = (function () {
  // The CDN script must load first: <script src=".../supabase-js@2..."></script>
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase SDK not loaded. Check the CDN script tag in your HTML.");
    return null;
  }

  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Could not create Supabase client:", err);
    return null;
  }
})();
