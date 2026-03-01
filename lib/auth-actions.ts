'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    if (!supabase) {
        redirect('/error?message=' + encodeURIComponent('Supabase is not configured. Use the Demo login instead.'))
    }

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/error?message=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/map')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    if (!supabase) {
        redirect('/error?message=' + encodeURIComponent('Supabase is not configured. Use the Demo login instead.'))
    }

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error?message=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account.'))
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    if (!supabase) {
        redirect('/error?message=' + encodeURIComponent('Supabase is not configured. Google sign-in is unavailable.'))
    }

    const origin = (await headers()).get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/confirm`,
        },
    })

    if (error) {
        redirect('/error?message=' + encodeURIComponent(error.message))
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function logout() {
    const supabase = await createClient()
    if (supabase) {
        await supabase.auth.signOut()
    }
    revalidatePath('/', 'layout')
    redirect('/login')
}

