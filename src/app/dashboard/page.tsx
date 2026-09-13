const stats = [
  { label: "Publications planifiées", value: "0" },
  { label: "Réseaux connectés", value: "0" },
  { label: "Brouillons", value: "0" },
];

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Tableau de bord</p>
        <h1>Votre activité sociale en un coup d’œil.</h1>
        <p className="hero-copy">
          Cette page deviendra l’entrée principale de chaque société après authentification.
        </p>
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
