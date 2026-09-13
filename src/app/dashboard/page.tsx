import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

const stats = [
  { label: "Publications planifiées", value: "0" },
  { label: "Réseaux connectés", value: "0" },
  { label: "Brouillons", value: "0" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error } = await supabase
    .from("company_members")
    .select("role, companies(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const membership = memberships?.[0];
  const company = Array.isArray(membership?.companies)
    ? membership.companies[0]
    : membership?.companies;

  if (!company) {
    redirect("/onboarding");
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="dashboard-topline">
          <div>
            <p className="eyebrow">Tableau de bord</p>
            <h1>{company.name}</h1>
          </div>
          <SignOutButton />
        </div>

        <p className="hero-copy">
          Votre espace est connecté et sécurisé. Le prochain module sera votre calendrier éditorial.
        </p>

        <div className="company-meta">
          <span>Espace : {company.slug}</span>
          <span>Rôle : {membership?.role ?? "membre"}</span>
          <span>Compte : {user.email}</span>
        </div>
      </section>

      <section className="feature-grid">
        {stats.map((stat) => (
          <article className="feature-card" key={stat.label}>
            <span>{stat.value}</span>
            <h2>{stat.label}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
