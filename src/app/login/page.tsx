"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = "/onboarding";
        return;
      }

      setMessage("Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-card">
        <p className="eyebrow">{mode === "login" ? "Connexion" : "Créer un compte"}</p>
        <h1>{mode === "login" ? "Accédez à votre espace entreprise." : "Créez votre espace Social SaaS."}</h1>
        <p className="hero-copy">
          {mode === "login"
            ? "Retrouvez votre calendrier éditorial et vos futures publications."
            : "Commencez par votre compte, puis créez votre société en quelques secondes."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Adresse e-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@entreprise.fr"
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6 caractères minimum"
            />
          </label>

          <button className="primary-button form-button" type="submit" disabled={loading}>
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        {message ? <p className="form-message">{message}</p> : null}

        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login" ? "Pas encore de compte ? Créer un compte" : "Déjà inscrit ? Se connecter"}
        </button>
      </section>
    </main>
  );
}
