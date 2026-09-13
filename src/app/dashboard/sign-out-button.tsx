"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button className="secondary-button" type="button" onClick={signOut}>
      Se déconnecter
    </button>
  );
}
