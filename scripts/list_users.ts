
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdaksestqxfdxpirudsc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc2NDUsImV4cCI6MjA3NzUzMzY0NX0.Gwus82RDQyHKW3QW6p6pW-o96PqBOJGrFfEO6Zjk7L4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    console.log('Fetching users from:', supabaseUrl);
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, role, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        process.exit(1);
    }

    console.log('--- Registered Users ---');
    console.table(data);
    console.log(`Total: ${data.length} users`);
}

listUsers();
