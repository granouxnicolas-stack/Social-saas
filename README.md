# Social SaaS

SaaS multi-societes de gestion, creation et programmation de publications sociales pour artisans, commercants et entrepreneurs.

## Objectif V1

- Authentification utilisateurs
- Gestion multi-societes
- Calendrier editorial
- Creation de publications texte + media
- Connexion Facebook / Instagram puis TikTok
- Programmation et suivi de publication
- Abonnements mensuels Stripe
- Back-office administrateur plateforme
- Isolation stricte des donnees par societe

## Stack cible

- Next.js + TypeScript
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Stripe Billing
- API Meta Graph
- API TikTok Content Posting

## Priorite de developpement

1. Socle Next.js / TypeScript
2. Modele multi-societes Supabase
3. Authentification et roles
4. Calendrier editorial
5. Editeur de publication
6. Bibliotheque media
7. Connexions Meta
8. Programmation des publications
9. Stripe
10. Back-office plateforme
11. TikTok

Aucun secret API ne doit etre commite dans ce depot. Utiliser exclusivement des variables d'environnement.