
import { createClient } from '@supabase/supabase-js'

const url = 'https://mdaksestqxfdxpirudsc.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc2NDUsImV4cCI6MjA3NzUzMzY0NX0.Gwus82RDQyHKW3QW6p6pW-o96PqBOJGrFfEO6Zjk7L4'

const supabase = createClient(url, key)

async function findNextTV() {
    console.log('Searching for "Next TV" in profiles...')
    
    // Search in profiles table
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .or('name.ilike.%Next TV%,email.ilike.%nexttv%')

    if (pError) {
        console.error('Error searching profiles:', pError.message)
    } else {
        console.log('Profiles found:', profiles)
    }

    // Also check for admins
    const { data: admins, error: aError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN')

    if (aError) {
        console.error('Error searching admins:', aError.message)
    } else {
        console.log('Admins found:', admins)
    }
}

findNextTV()
