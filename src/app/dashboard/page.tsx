import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error } = await supabase
    .from("company_members")
    .select("role, company_id, companies(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1);

  if (error) throw new Error(error.message);

  const membership = memberships?.[0];
  const company = Array.isArray(membership?.companies)
    ? membership.companies[0]
    : membership?.companies;

  if (!company || !membership) redirect("/onboarding");

  const [{ count: scheduledCount }, { count: draftCount }] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "scheduled"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "draft"),
  ]);

  const stats = [
    { label: "Publications planifiées", value: String(scheduledCount ?? 0) },
    { label: "Réseaux connectés", value: "0" },
    { label: "Brouillons", value: String(draftCount ?? 0) },
  ];

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
          Préparez vos contenus et organisez vos publications depuis votre calendrier éditorial.
        </p>

        <div className="actions">
          <Link className="primary-button" href="/dashboard/calendar">Ouvrir le calendrier éditorial</Link>
        </div>

        <div className="company-meta">
          <span>Espace : {company.slug}</span>
          <span>Rôle : {membership.role}</span>
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
