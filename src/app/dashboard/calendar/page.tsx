import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPost } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Planifié",
  publishing: "Publication...",
  published: "Publié",
  failed: "Erreur",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("company_members")
    .select("company_id, role, companies(name)")
    .eq("user_id", user.id)
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id,title,content,status,scheduled_at,post_targets(platform)")
    .eq("company_id", membership.company_id)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const canEdit = ["owner", "admin", "editor"].includes(membership.role);
  const company = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="dashboard-topline">
          <div>
            <p className="eyebrow">Calendrier éditorial</p>
            <h1>{company?.name ?? "Votre société"}</h1>
          </div>
          <Link className="secondary-button" href="/dashboard">Tableau de bord</Link>
        </div>
        <p className="hero-copy">
          Préparez vos contenus, choisissez les réseaux et programmez leur diffusion.
        </p>
      </section>

      {canEdit && (
        <section className="editor-card">
          <h2>Nouvelle publication</h2>
          <form action={createPost} className="post-form">
            <label>
              Titre interne
              <input name="title" placeholder="Ex. Chantier de la semaine" />
            </label>
            <label>
              Texte de la publication
              <textarea name="content" rows={7} required placeholder="Écrivez votre publication…" />
            </label>
            <label>
              Date et heure de publication
              <input name="scheduled_at" type="datetime-local" />
            </label>
            <fieldset>
              <legend>Réseaux</legend>
              <label><input name="facebook" type="checkbox" /> Facebook</label>
              <label><input name="instagram" type="checkbox" /> Instagram</label>
              <label><input name="tiktok" type="checkbox" /> TikTok</label>
            </fieldset>
            <div className="actions">
              <button className="primary-button" type="submit">Enregistrer la publication</button>
            </div>
          </form>
        </section>
      )}

      <section className="calendar-list">
        <div className="section-heading">
          <h2>Publications</h2>
          <span>{posts?.length ?? 0} contenu(s)</span>
        </div>
        {!posts?.length ? (
          <article className="feature-card empty-state">
            <h2>Aucune publication pour le moment</h2>
            <p>Créez votre premier brouillon ou planifiez une publication.</p>
          </article>
        ) : (
          posts.map((post) => (
            <article className="post-card" key={post.id}>
              <div>
                <span className={`status-pill status-${post.status}`}>{statusLabel[post.status] ?? post.status}</span>
                <h3>{post.title || "Publication sans titre"}</h3>
                <p>{post.content}</p>
              </div>
              <div className="post-meta">
                <span>{post.scheduled_at ? new Date(post.scheduled_at).toLocaleString("fr-FR") : "Non planifiée"}</span>
                <span>{post.post_targets?.map((target) => target.platform).join(" · ") || "Aucun réseau choisi"}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
