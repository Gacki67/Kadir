# L'Espace de Rayan — Mettre le site en ligne (gratuit, ~10 min)

À la fin, tu auras :
- un **site public** que n'importe qui peut ouvrir (idéal Insta) ;
- la **création de compte** et le **bouton Réserver** qui marchent pour de vrai ;
- l'**espace de Rayan** (code d'accès) où il voit les réservations **en direct**.

Tout est déjà codé. Il reste juste à l'héberger. On utilise **Neon** (base de
données) + **Vercel** (hébergement) — les deux sont gratuits, sans carte
bancaire.

---

## Étape 1 — Créer la base de données (Neon)

1. Va sur **https://neon.tech** → *Sign up* (le plus simple : « Continue with
   GitHub »).
2. *Create project* → nom : `espace-de-rayan`, région : **Europe (Frankfurt)**.
3. Neon affiche une **Connection string**. **IMPORTANT :** clique sur l'option
   **« Direct connection »** (et PAS « Pooled ») pour obtenir une URL **sans**
   `-pooler` dans l'adresse. Elle ressemble à :
   ```
   postgresql://neondb_owner:xxxx@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Copie-la, on s'en sert à l'étape suivante.

## Étape 2 — Mettre en ligne (Vercel)

1. Va sur **https://vercel.com** → *Sign up* → « Continue with GitHub ».
2. *Add New… → Project* → importe le dépôt **`gacki67/kadir`**.
   - Assure-toi d'avoir d'abord **fusionné la Pull Request** (bouton vert
     « Merge pull request » sur GitHub) : Vercel publie la branche par défaut
     du dépôt, qui contiendra alors le nouveau site. Rien d'autre à régler
     côté branche.
3. Déplie **Environment Variables** et ajoute ces 4 lignes :

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | *(la Connection string Neon de l'étape 1)* |
   | `ADMIN_SESSION_SECRET` | `colle-la-clé-secrète-que-je-t'ai-donnée` |
   | `ADMIN_ACCESS_CODE` | `Ryan1230` *(le code secret de Rayan)* |
   | `NEXT_PUBLIC_SITE_URL` | `https://espace-de-rayan.vercel.app` |

   *(La clé `ADMIN_SESSION_SECRET` et un exemple de code t'ont été donnés dans
   le chat. `NEXT_PUBLIC_SITE_URL` : mets l'URL que Vercel te proposera ;
   tu pourras l'ajuster après le 1er déploiement si besoin.)*

4. Clique **Deploy**. Vercel installe tout, **crée les tables**, **remplit le
   catalogue de prestations** et publie le site automatiquement.

## Étape 3 — C'est en ligne 🎉

- **Ton site :** `https://espace-de-rayan.vercel.app`
- **Le lien à mettre dans les stories Insta (réservation) :**
  `https://espace-de-rayan.vercel.app/reservation`
  → le client clique, crée son compte, choisit sa coupe et son créneau.
- **L'espace de Rayan :** `https://espace-de-rayan.vercel.app/admin`
  → Rayan saisit son **code d'accès** et voit toutes les réservations en
  direct (nom, prénom, téléphone, jour, heure).

> Astuce : dans Insta, on ne peut mettre qu'un seul lien en bio. Pour une story,
> utilise le **sticker « Lien »** et colle l'adresse `/reservation` ci-dessus.

---

## Personnaliser (quand tu veux)

Tout se règle dans **`src/lib/config.ts`** :
- `SALON.openingSoon` → passe à `false` le jour de l'ouverture (retire le
  bandeau « Ouverture prochaine ») ;
- `SERVICES` → prix, durées, prestations (modifiables aussi depuis `/admin`) ;
- horaires par défaut dans `BOOKING.defaultBusinessHours`.

Les **photos** des coupes sont dans `public/coupes/` (`coupe-1.jpg` … `coupe-5.jpg`) :
remplace-les quand tu veux, elles s'affichent automatiquement.

## E-mails de confirmation (optionnel, plus tard)

Sans configuration, les réservations marchent ; la confirmation s'affiche dans
les logs. Pour envoyer de vrais e-mails, crée un compte gratuit **Resend**
(https://resend.com) et ajoute sur Vercel `RESEND_API_KEY` + `EMAIL_FROM`.

---

### Compte de démonstration (pour tester avant l'ouverture)
Après le déploiement, tu peux tester le parcours client en créant un compte
depuis `/reservation`. Un compte de démo existe aussi si tu lances le seed avec
`--demo` : `client.demo@exemple.fr` / `demodemo` (à supprimer avant l'ouverture).
