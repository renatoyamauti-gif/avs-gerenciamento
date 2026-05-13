import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymicfavvmyzqgrovjusd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWNmYXZ2bXl6cWdyb3ZqdXNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYxOTE5NiwiZXhwIjoyMDkyMTk1MTk2fQ.kjxu6W4Kxqiy2TdXK8I1fJJR9bLEx573vn7SOUvZWfY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) {
    console.error("Auth Error:", err1);
    return;
  }
  
  if (users.users.length === 0) {
    console.log("No users found.");
    return;
  }
  
  const userId = users.users[0].id;
  console.log("User ID:", userId, "Email:", users.users[0].email);

  const { data: profile, error: err2 } = await supabase.from('profiles').select('*').eq('id', userId);
  console.log("Profile Data (via service_role, bypassing RLS):", profile, err2);
}

check();
