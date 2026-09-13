# Architecture V1

## Principes

Le produit est un SaaS multi-societes. Chaque donnee metier est rattachee a une societe et protegee par des politiques RLS Supabase.

## Entites principales

- companies
- company_members
- profiles
- social_accounts
- posts
- post_targets
- post_media
- publication_jobs
- subscriptions
- audit_logs

## Roles V1

- platform_admin : administration globale du SaaS
- company_owner : dirigeant de la societe
- company_admin : administration de la societe
- editor : cree et programme les contenus
- viewer : lecture seule

## Flux principal

1. L'utilisateur cree son compte
2. Il cree ou rejoint une societe
3. Il choisit un abonnement
4. Il connecte Facebook / Instagram
5. Il cree une publication
6. Il ajoute un ou plusieurs medias
7. Il choisit les reseaux cibles
8. Il planifie la publication
9. Un worker execute la publication
10. Le statut et les erreurs sont journalises

## Securite

- aucune cle API dans le repository
- variables d'environnement uniquement
- RLS obligatoire sur toutes les tables metier
- tokens OAuth chiffres au repos
- verification serveur des roles pour toute action sensible
- audit des actions administratives
- separation back-office plateforme / espace client

## Publication

Les publications doivent etre executees par une file de jobs et non directement depuis le navigateur. Le scheduler cree des publication_jobs qui sont ensuite pris en charge par un worker serveur.
