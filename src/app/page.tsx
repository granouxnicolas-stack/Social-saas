const features = [
  "Calendrier éditorial",
  "Création de textes et médias",
  "Facebook & Instagram",
  "TikTok",
  "Programmation automatique",
  "Back-office multi-sociétés",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Social SaaS</p>
        <h1>Planifiez vos réseaux sociaux sans y passer vos journées.</h1>
        <p className="hero-copy">
          Un espace simple pour les artisans, commerçants et entrepreneurs : idées,
          contenus, médias, calendrier et publication au même endroit.
        </p>
        <div className="actions">
          <a className="primary-button" href="/login">Commencer</a>
          <a className="secondary-button" href="/dashboard">Voir le tableau de bord</a>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature}>
            <span>✓</span>
            <h2>{feature}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
