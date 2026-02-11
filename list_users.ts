
import { createClient } from '@supabase/supabase-js'

const url = 'https://mdaksestqxfdxpirudsc.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc2NDUsImV4cCI6MjA3NzUzMzY0NX0.Gwus82RDQyHKW3QW6p6pW-o96PqBOJGrFfEO6Zjk7L4'

const supabase = createClient(url, key)

async function listUsers() {
    console.log('Fetching users from profiles table...')
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error.message)
        return
    }

    if (!data || data.length === 0) {
        console.log('No users found in profiles table.')
        return
    }

    console.log(`Found ${data.length} users:`)
    console.table(data.map(u => ({
        id: u.id,
        name: u.name || 'N/A',
        email: u.email,
        role: u.role,
        status: u.status,
        created_at: u.created_at
    })))
}

listUsers()
