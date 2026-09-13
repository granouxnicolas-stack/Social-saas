"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const finalSlug = slugify(slug || name);

    const { error } = await supabase.rpc("create_company", {
      company_name: name,
      company_slug: finalSlug,
    });

    if (error) {
      setMessage(error.message.includes("duplicate") ? "Ce nom d’espace est déjà utilisé." : error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="page-shell auth-shell">
      <section className="hero-card auth-card">
        <p className="eyebrow">Configuration</p>
        <h1>Créez votre société.</h1>
        <p className="hero-copy">
          Cet espace isolera vos utilisateurs, vos publications et vos futurs réseaux sociaux.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nom de la société
            <input
              type="text"
              required
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                if (!slug) setSlug(slugify(value));
              }}
              placeholder="Ex. Dupont Plomberie"
            />
          </label>

          <label>
            Identifiant de l’espace
            <input
              type="text"
              required
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              placeholder="dupont-plomberie"
            />
          </label>

          <button className="primary-button form-button" type="submit" disabled={loading}>
            {loading ? "Création…" : "Créer ma société"}
          </button>
        </form>

        {message ? <p className="form-message">{message}</p> : null}
      </section>
    </main>
  );
}
