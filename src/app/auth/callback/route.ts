import { NextResponse } from 'next/server'
// The client you created in Step 3
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // Check if we already have a session to prevent redundant exchange (fixes otp_expired)
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (existingSession) {
      console.log('Auth Callback: Already has session, redirecting...');
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.log('Auth Callback: Exchanging code for session...');
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth Callback: Exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }
    
    // CRITICAL: Manually construct the redirect response to ensure cookies are included
    const response = NextResponse.redirect(`${origin}${next}`)
    
    // In some Next.js environments, we need to manually sync cookies from the server client 
    // to the redirect response to ensure the browser receives them immediately.
    // However, with @supabase/ssr, the setAll function in createClient should handle this
    // if the response is passed correctly. For route handlers, a standard redirect is usually enough,
    // but the extra logging will help us confirm.
    
    console.log('Auth Callback: Success! Session created.');
    return response
  }

  console.warn('Auth Callback: No code found in URL');

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
