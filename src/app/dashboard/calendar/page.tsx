import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPost } from "./actions";
import { MediaUploader } from "./media-uploader";

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

  const [{ data: posts, error: postsError }, { data: mediaAssets, error: mediaError }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id,title,content,status,scheduled_at,media_urls,post_targets(platform)")
        .eq("company_id", membership.company_id)
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .limit(50),
      supabase
        .from("media_assets")
        .select("id,file_name,mime_type,object_path,size_bytes")
        .eq("company_id", membership.company_id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  if (postsError) throw new Error(postsError.message);

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
          <Link className="secondary-button" href="/dashboard">
            Tableau de bord
          </Link>
        </div>
        <p className="hero-copy">
          Préparez vos contenus, ajoutez vos médias, choisissez les réseaux et programmez leur diffusion.
        </p>
      </section>

      {canEdit && (
        <section className="editor-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Médiathèque</p>
              <h2>Photos et vidéos de l’entreprise</h2>
            </div>
            {!mediaError && <MediaUploader companyId={membership.company_id} />}
          </div>

          {mediaError ? (
            <p className="form-message">
              La médiathèque est prête dans le code mais attend encore l’activation de la migration Storage.
            </p>
          ) : !mediaAssets?.length ? (
            <p className="form-message">
              Aucun média pour le moment. Ajoutez une photo ou une vidéo.
            </p>
          ) : (
            <div className="media-grid">
              {mediaAssets.map((asset) => (
                <article className="media-card" key={asset.id}>
                  <strong>{asset.file_name}</strong>
                  <span>{asset.mime_type.startsWith("video/") ? "Vidéo" : "Image"}</span>
                  <small>{Math.max(1, Math.round(asset.size_bytes / 1024))} Ko</small>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

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
              <textarea
                name="content"
                rows={7}
                required
                placeholder="Écrivez votre publication…"
              />
            </label>

            {!!mediaAssets?.length && (
              <fieldset>
                <legend>Médias à joindre</legend>
                <div className="media-choice-grid">
                  {mediaAssets.map((asset) => (
                    <label className="media-choice" key={asset.id}>
                      <input
                        name="media_paths"
                        type="checkbox"
                        value={asset.object_path}
                      />
                      <span>
                        <strong>{asset.file_name}</strong>
                        <small>{asset.mime_type.startsWith("video/") ? "Vidéo" : "Image"}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

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
              <button className="primary-button" type="submit">
                Enregistrer la publication
              </button>
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
                <span className={`status-pill status-${post.status}`}>
                  {statusLabel[post.status] ?? post.status}
                </span>
                <h3>{post.title || "Publication sans titre"}</h3>
                <p>{post.content}</p>
              </div>
              <div className="post-meta">
                <span>
                  {post.scheduled_at
                    ? new Date(post.scheduled_at).toLocaleString("fr-FR")
                    : "Non planifiée"}
                </span>
                <span>
                  {post.post_targets?.map((target) => target.platform).join(" · ") ||
                    "Aucun réseau choisi"}
                </span>
                <span>{post.media_urls?.length ?? 0} média(s)</span>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
