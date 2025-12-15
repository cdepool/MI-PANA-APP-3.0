import { createClient } from '@supabase/supabase-js'

const url = 'https://mdaksestqxfdxpirudsc.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc2NDUsImV4cCI6MjA3NzUzMzY0NX0.Gwus82RDQyHKW3QW6p6pW-o96PqBOJGrFfEO6Zjk7L4'

console.log('Testing connection to:', url)

const supabase = createClient(url, key)

async function test() {
    try {
        // Basic connectivity check: retrieve session (requires no specific table permissions)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Supabase Auth Check: FAILED', error.message)
            process.exit(1)
        }

        console.log('Supabase Auth Check: SUCCESS')
        console.log('Supabase URL is reachable and Key is valid.')

    } catch (e) {
        console.error('Unexpected Error:', e)
        process.exit(1)
    }
}

test()
