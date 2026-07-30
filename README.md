# Kadir Barber — Site vitrine et reservation en ligne

Site web complet et fonctionnel pour le salon **Kadir Barber** :

> **Kadir Barber**
> 19 rue des Vosges
> 67620 Soufflenheim — France
> Contact : Snapchat **@kadir_bs67**
>
> **Coupe, moustache et barbe — 15 €** · 30 minutes
> Du lundi au vendredi, de 9 h a 21 h (dernier creneau a 20 h 30)

Vitrine premium, reservation en ligne avec blocage reel des creneaux,
notifications par e-mail et SMS, rappels automatiques 24 h avant, et espace
administrateur securise.

Le projet est **utilisable en production** : les rendez-vous sont reellement
enregistres dans une base PostgreSQL, et la double reservation est rendue
impossible au niveau de la base de donnees.

---

## Sommaire

1. [Ce que fait le site](#1-ce-que-fait-le-site)
2. [Stack technique](#2-stack-technique)
3. [Installation rapide](#3-installation-rapide)
4. [Base de donnees](#4-base-de-donnees)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [Configurer les e-mails](#6-configurer-les-e-mails)
7. [Configurer les SMS](#7-configurer-les-sms)
8. [Rappels automatiques 24 h avant](#8-rappels-automatiques-24-h-avant)
9. [Espace administrateur](#9-espace-administrateur)
10. [Personnaliser le salon](#10-personnaliser-le-salon)
11. [Deploiement](#11-deploiement)
12. [Tests](#12-tests)
13. [Arborescence du projet](#13-arborescence-du-projet)
14. [Comment fonctionne l'anti double reservation](#14-comment-fonctionne-lanti-double-reservation)
15. [Securite et RGPD](#15-securite-et-rgpd)
16. [Choix techniques expliques](#16-choix-techniques-expliques)
17. [Depannage](#17-depannage)

---

## 1. Ce que fait le site

### Cote client

- Page d'accueil vitrine : banniere, presentation, la prestation et son tarif,
  horaires, coordonnees, **carte Google Maps avec bouton « Itineraire »**,
  reseaux sociaux, appels a l'action.
- **Une seule prestation** — « Coupe, moustache et barbe », 30 minutes, 15 € :
  le client n'a aucun choix a faire, elle est selectionnee automatiquement.
- **Reservation en 4 etapes** avec barre de progression :
  date → heure → coordonnees → recapitulatif → confirmation.
- Calendrier moderne : week-ends et jours passes desactives, jours complets
  grises, point dore sur les jours ou il reste de la place.
- Horaires deja pris affiches barres et non cliquables.
- Confirmation immediate par **e-mail et SMS**, mentionnant la prestation, le
  tarif et **l'adresse complete du salon**.
- Page de confirmation avec numero de reservation et bouton
  « Ajouter a mon calendrier » (fichier `.ics`).
- **Rappel automatique 24 h avant**, par e-mail et par SMS, avec l'adresse.
- Lien securise (sans creation de compte) pour **consulter, deplacer ou
  annuler** son rendez-vous.
- **L'adresse du salon est rappelee partout** : section contact, pied de page,
  recapitulatif avant validation, page de confirmation, espace client,
  e-mails, SMS et fichier calendrier.

### Cote salon (administration)

- Connexion protegee, sessions signees, tentatives limitees.
- Rendez-vous du jour, de la semaine, du mois, a venir, ou tous.
- Vue **liste** et vue **calendrier hebdomadaire**.
- Recherche par nom, prenom, e-mail, telephone ou reference.
- Filtres par statut (confirme, annule, termine, absent) et par etat du rappel.
- Fiche complete d'un rendez-vous, avec l'etat de chaque notification.
- Creation manuelle d'un rendez-vous (prise par telephone), avec ou sans
  notification au client.
- Modification (client, date, heure, prestation) et annulation.
- **Blocage** d'une plage horaire ou d'une journee entiere.
- Gestion de la **prestation et de son tarif** (nom, description, duree, prix,
  image, ordre) — le systeme accepte plusieurs prestations si besoin.
- Modification des **horaires d'ouverture**, jour par jour.
- Suppression definitive des donnees d'un client (RGPD).

---

## 2. Stack technique

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Langage | TypeScript (mode strict) |
| Styles | Tailwind CSS 3 |
| Base de donnees | PostgreSQL |
| ORM | Prisma 6 |
| Validation | Zod (client **et** serveur) |
| Formulaires | React Hook Form |
| Authentification admin | Session JWT signee (`jose`) + bcrypt |
| E-mails | Resend, Brevo ou SMTP |
| SMS | Twilio ou Brevo |
| Tests | Vitest (unitaires + integration) |

Cette stack correspond a celle demandee. Deux ecarts, tous deux justifies :

- **Pas de SDK Resend / Twilio.** Leurs API REST sont appelees directement avec
  `fetch`. Cela retire deux dependances lourdes, fonctionne sur tous les
  runtimes, et evite d'etre bloque par une mise a jour de SDK.
- **Pas de bibliotheque d'icones.** Les ~25 pictogrammes sont des SVG ecrits a
  la main (`src/components/icons.tsx`), soit environ 50 ko de JavaScript
  economises.

---

## 3. Installation rapide

### Prerequis

- Node.js 18.18 ou superieur (20+ recommande)
- PostgreSQL 14 ou superieur (en local, ou un service comme Neon / Supabase)

### Etapes

```bash
# 1. Installer les dependances
npm install

# 2. Creer le fichier de configuration
cp .env.example .env

# 3. Editer .env — au minimum DATABASE_URL, ADMIN_SESSION_SECRET,
#    ADMIN_EMAIL et ADMIN_PASSWORD (voir section 5)

# 4. Creer les tables
npm run db:migrate

# 5. Inserer les prestations et les horaires
npm run db:seed

# 6. Lancer le site
npm run dev
```

Le site est alors disponible sur **http://localhost:3000**
et l'administration sur **http://localhost:3000/admin**.

Pour ajouter aussi quelques rendez-vous de demonstration :

```bash
npm run db:seed -- --demo
```

### Commandes disponibles

| Commande | Role |
| --- | --- |
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm start` | Serveur de production (apres `build`) |
| `npm run typecheck` | Verification TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Tous les tests |
| `npm run db:migrate` | Cree / applique les migrations |
| `npm run db:deploy` | Applique les migrations (production) |
| `npm run db:seed` | Prestations + horaires |
| `npm run db:studio` | Interface graphique de la base |
| `npm run db:reset` | **Efface tout** et rejoue les migrations |
| `npm run hash-password -- "MotDePasse"` | Genere le hachage bcrypt admin |

---

## 4. Base de donnees

### PostgreSQL en local

```bash
# Avec Docker (le plus simple)
docker run --name kadir-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=kadir_barber \
  -p 5432:5432 -d postgres:16

# Ou avec une installation systeme
createdb kadir_barber
```

Puis dans `.env` :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kadir_barber"
```

### Neon (recommande avec Vercel)

1. Creez un projet sur [neon.tech](https://neon.tech) — region Europe.
2. Copiez la chaine de connexion (« Pooled connection »).
3. Renseignez `DATABASE_URL`, en gardant `?sslmode=require`.

### Supabase

1. Creez un projet sur [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI**.
3. Renseignez `DATABASE_URL`. Si vous utilisez le pooler (port 6543), ajoutez
   aussi `DIRECT_URL` avec la connexion directe (port 5432) pour les migrations.

### Modele de donnees

| Table | Role |
| --- | --- |
| `appointments` | Les rendez-vous (client, prestation, creneau, statut, jeton, indicateurs de notification) |
| `services` | Les prestations (nom, description, duree, prix en centimes, image, ordre, actif) |
| `blocked_slots` | Les blocages poses par l'administrateur |
| `business_hours` | Les horaires d'ouverture, un enregistrement par jour |
| `slot_locks` | **Les verrous de creneaux** — voir [section 14](#14-comment-fonctionne-lanti-double-reservation) |

**Convention de dates.** Les jours sont stockes dans une colonne `DATE` pure et
les horaires sous forme de texte `"HH:mm"` en heure francaise. Aucune conversion
de fuseau n'a donc lieu au stockage : un rendez-vous a 14 h reste a 14 h, y
compris lors des changements d'heure. La conversion vers un instant absolu n'est
faite qu'au moment de calculer les rappels et de generer le fichier `.ics`.

### Appliquer les migrations en production

```bash
npm run db:deploy
npm run db:seed   # une seule fois, pour les prestations initiales
```

---

## 5. Variables d'environnement

Toutes les variables sont documentees dans **`.env.example`**. Copiez-le vers
`.env` et completez-le. **Ne committez jamais `.env`** (il est deja ignore par
Git).

### Obligatoires

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Chaine de connexion PostgreSQL |
| `ADMIN_SESSION_SECRET` | Secret de signature des sessions (32 caracteres minimum) |
| `ADMIN_EMAIL` | Identifiant de connexion a `/admin` |
| `ADMIN_PASSWORD_HASH` **ou** `ADMIN_PASSWORD` | Mot de passe administrateur |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (obligatoire en production) |
| `CRON_SECRET` | Protege la route des rappels automatiques |

Generez les secrets ainsi :

```bash
openssl rand -base64 32   # ADMIN_SESSION_SECRET
openssl rand -hex 32      # CRON_SECRET
npm run hash-password -- "VotreMotDePasse"   # ADMIN_PASSWORD_HASH
```

### Facultatives (notifications)

`EMAIL_FROM`, `RESEND_API_KEY`, `BREVO_API_KEY`, `SMTP_*`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
`BREVO_SMS_SENDER`.

> **Sans aucune cle API, le site fonctionne normalement.** Les e-mails et les
> SMS sont alors affiches dans les logs du serveur (« mode developpement »), et
> **une reservation n'echoue jamais a cause d'un probleme d'envoi**.

---

## 6. Configurer les e-mails

Trois fournisseurs sont pris en charge. Le premier configure est utilise.

### Option 1 — Resend (recommande)

1. Creez un compte sur [resend.com](https://resend.com).
2. **Domains** → ajoutez votre domaine et validez les enregistrements DNS.
3. **API Keys** → creez une cle.

```env
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="Kadir Barber <contact@votre-domaine.fr>"
```

Pour tester sans domaine, utilisez `onboarding@resend.dev` comme expediteur
(les e-mails ne partiront que vers votre propre adresse).

### Option 2 — Brevo

1. Compte sur [brevo.com](https://www.brevo.com), puis **SMTP & API → API Keys**.
2. Validez votre domaine expediteur.

```env
BREVO_API_KEY="xkeysib-xxxxxxxxxxxx"
EMAIL_FROM="Kadir Barber <contact@votre-domaine.fr>"
```

### Option 3 — SMTP classique

```bash
npm install nodemailer
```

```env
SMTP_HOST="smtp.votre-hebergeur.fr"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="contact@votre-domaine.fr"
SMTP_PASSWORD="votre-mot-de-passe"
EMAIL_FROM="Kadir Barber <contact@votre-domaine.fr>"
```

Les modeles de messages se modifient dans
`src/lib/notifications/templates.ts`.

---

## 7. Configurer les SMS

### Option 1 — Twilio

1. Compte sur [twilio.com](https://www.twilio.com).
2. Achetez un numero capable d'envoyer des SMS vers la France.
3. Relevez `Account SID` et `Auth Token` sur le tableau de bord.

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+33757000000"
```

Un Messaging Service peut remplacer le numero :

```env
TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxx"
```

### Option 2 — Brevo SMS

Reutilise la meme cle API que les e-mails :

```env
BREVO_API_KEY="xkeysib-xxxxxxxxxxxx"
BREVO_SMS_SENDER="KadirBarber"   # 11 caracteres alphanumeriques maximum
```

> En France, l'envoi de SMS commerciaux vers des numeros mobiles est encadre.
> Les messages envoyes ici sont **transactionnels** (confirmation et rappel
> d'un rendez-vous demande par le client), ce qui est autorise.

---

## 8. Rappels automatiques 24 h avant

La route `GET /api/cron/reminders` cherche les rendez-vous confirmes dont le
debut se situe **entre 23 h et 25 h** dans le futur, et envoie le rappel par
e-mail et par SMS.

Elle est protegee par `CRON_SECRET` :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://votre-site.fr/api/cron/reminders
```

**Aucun doublon possible** : les colonnes `emailReminderSent` et
`smsReminderSent` sont posees en base des le premier envoi. Meme si la tache est
declenchee toutes les 5 minutes, chaque client n'est prevenu qu'une seule fois.

### Sur Vercel

Rien a faire : le fichier `vercel.json` declare deja la tache, executee toutes
les heures. Vercel envoie automatiquement l'en-tete `Authorization` avec la
valeur de `CRON_SECRET`.

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
```

### Ailleurs

Avec `cron` sous Linux :

```cron
0 * * * * curl -s -H "Authorization: Bearer VOTRE_SECRET" https://votre-site.fr/api/cron/reminders
```

Un service gratuit comme [cron-job.org](https://cron-job.org) fonctionne aussi :
appelez l'URL toutes les heures, en ajoutant l'en-tete `Authorization`.

---

## 9. Espace administrateur

Accessible sur **`/admin`**, avec l'e-mail et le mot de passe definis dans
`.env`.

| Page | Contenu |
| --- | --- |
| `/admin` | Rendez-vous : indicateurs, filtres, recherche, vue liste et calendrier |
| `/admin/prestations` | Creer, modifier, desactiver ou supprimer une prestation |
| `/admin/horaires` | Jours d'ouverture et amplitude horaire |
| `/admin/blocages` | Bloquer une plage horaire ou une journee entiere |

Notes utiles :

- Une prestation deja liee a des rendez-vous est **desactivee** plutot que
  supprimee, afin de conserver l'historique.
- Bloquer une plage ne supprime jamais un rendez-vous existant : les creneaux
  deja reserves sont signales et laisses intacts.
- Annuler un rendez-vous **libere le creneau**, tout en conservant la trace.
- « Supprimer definitivement » efface les donnees pour de bon (RGPD).

### En production, utilisez un mot de passe hache

```bash
npm run hash-password -- "UnMotDePasseLongEtUnique"
```

Copiez la valeur affichee dans `ADMIN_PASSWORD_HASH` et **supprimez**
`ADMIN_PASSWORD`.

---

## 10. Personnaliser le salon

### Coordonnees, logo, photos, reseaux sociaux

Tout se trouve dans un seul fichier : **`src/lib/config.ts`**.

```ts
export const SALON = {
  name: "Kadir Barber",
  address: {
    street: "19 rue des Vosges",
    postalCode: "67620",
    city: "Soufflenheim",
    country: "France",
  },
  // Le salon ne publie pas de numero de telephone : le contact se fait
  // par Snapchat et par e-mail.
  snapchatHandle: "kadir_bs67",
  email: "contact@kadirbarber.fr",  // ← a renseigner
  googleMapsEmbedUrl: "…",          // carte, deja pointee sur l'adresse
  googleMapsDirectionsUrl: "…",     // bouton « Itineraire »
  social: { instagram: "…", facebook: "…", tiktok: "", snapchat: "" },
  logoUrl: "",                      // ← ex. "/logo.png"
  gallery: [ /* photos du salon */ ],
};
```

**L'adresse est deja renseignee** et alimente automatiquement : la section
contact, le pied de page, les e-mails, les SMS, la page de confirmation, le
recapitulatif du rendez-vous, le fichier calendrier (.ics) et les donnees
structurees SEO. Un seul endroit a corriger en cas de demenagement.

### Informations legales

```ts
export const LEGAL = {
  siren: "102187168",
  siret: "10218716800011",
  legalForm: "",             // ← a completer
  publicationDirector: "",   // ← a completer
  vatNumber: "",             // ← a completer si assujetti a la TVA
};
```

Les champs laisses vides s'affichent entre crochets dans les mentions legales,
pour signaler ce qu'il reste a renseigner. Le SIRET alimente aussi les donnees
structurees du site.

### La prestation et son tarif

```ts
export const MAIN_SERVICE = {
  name: "Coupe, moustache et barbe",
  duration: 30,     // minutes
  price: 1500,      // EN CENTIMES -> 15,00 €
};
```

Ces valeurs alimentent la base au `npm run db:seed`. Pour changer le tarif au
quotidien, passez plutot par `/admin/prestations` : la modification est
immediate, sans redeploiement.

- **Contact** : le salon ne communique **aucun numero de telephone**. Tous les
  boutons de contact — en-tete, banniere, pied de page, page 404, e-mails,
  fichier calendrier — pointent vers Snapchat **@kadir_bs67**. Pour publier un
  numero plus tard, la marche a suivre est indiquee en commentaire dans
  `src/lib/config.ts`.
- **E-mail** : `contact@kadirbarber.fr` est encore fictif, a remplacer avant la
  mise en ligne.
- **Logo** : deposez le fichier dans `public/` et indiquez `logoUrl: "/logo.png"`.
  Sans logo, un monogramme typographique elegant est affiche.
- **Photos** : remplacez les URLs de `gallery` par vos propres images
  (`/photos/salon-1.jpg` apres depot dans `public/photos/`).
- **Carte** : elle pointe deja sur le 19 rue des Vosges et fonctionne **sans
  cle API Google**. Le bouton « Itineraire » est present sur la page d'accueil,
  la page de reservation, la page de confirmation, l'espace client, le pied de
  page et dans les e-mails.
- **Reseaux sociaux** : laissez une chaine vide pour masquer un reseau.

### Regles de reservation

Toujours dans `src/lib/config.ts` :

```ts
export const BOOKING = {
  timezone: "Europe/Paris",
  slotDurationMinutes: 30,      // duree d'un creneau
  maxAdvanceDays: 60,           // horizon de reservation
  minLeadTimeMinutes: 60,       // delai minimum avant un RDV
  cancellationCutoffHours: 2,   // au-dela, plus d'annulation en ligne
  defaultBusinessHours: [ /* … */ ],
};
```

### Ajouter d'autres prestations (facultatif)

Le salon n'en propose qu'une, mais le systeme en gere plusieurs. Si vous activez
une seconde prestation depuis `/admin/prestations`, **l'etape de choix reapparait
automatiquement** dans le parcours de reservation (5 etapes au lieu de 4). Aucun
code n'est a modifier.

Le `npm run db:seed` reste aligne sur la prestation unique : il recree
« Coupe, moustache et barbe » et **desactive** toute autre prestation active.

### Mentions legales

Le fichier `src/app/mentions-legales/page.tsx` contient des champs entre
crochets (`[SIRET A RENSEIGNER]`, `[HEBERGEUR A RENSEIGNER]`, …).
**Completez-les avant la mise en ligne.**

### Couleurs et typographie

Les couleurs de marque sont dans `tailwind.config.ts` (palettes `ink` et
`gold`), les polices dans `src/app/layout.tsx` (Playfair Display + Inter).

---

## 11. Deploiement

### Vercel (recommande)

1. Poussez le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com), **Add New → Project**, importez le depot.
3. Ajoutez les variables d'environnement (**Settings → Environment Variables**) :

   ```
   DATABASE_URL
   NEXT_PUBLIC_SITE_URL      (ex. https://kadirbarber.fr)
   ADMIN_SESSION_SECRET
   ADMIN_EMAIL
   ADMIN_PASSWORD_HASH
   CRON_SECRET
   EMAIL_FROM
   RESEND_API_KEY            (ou BREVO_API_KEY)
   TWILIO_ACCOUNT_SID        (ou BREVO_SMS_SENDER)
   TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER
   ```

4. Deployez. Le script `build` execute `prisma generate` automatiquement.
5. Appliquez les migrations :

   ```bash
   npx vercel env pull .env.production.local
   npx dotenv -e .env.production.local -- npx prisma migrate deploy
   ```

   (ou lancez `npm run db:deploy` en local avec le `DATABASE_URL` de production)

6. Inserez les prestations initiales : `npm run db:seed`.
7. La tache de rappel est active automatiquement grace a `vercel.json`.

> Le fichier `vercel.json` fixe la region sur `cdg1` (Paris) pour reduire la
> latence vers une base europeenne. Adaptez si besoin.

### Autres hebergeurs

Le projet est un Next.js standard, deployable sur Railway, Render, Fly.io ou un
VPS :

```bash
npm ci
npm run db:deploy
npm run build
npm start          # ecoute sur le port 3000
```

Pensez a declarer la tache cron des rappels (voir [section 8](#8-rappels-automatiques-24-h-avant)).

### Avant la mise en ligne — liste de controle

- [ ] `NEXT_PUBLIC_SITE_URL` pointe vers le domaine reel
- [ ] `ADMIN_PASSWORD_HASH` renseigne, `ADMIN_PASSWORD` supprime
- [ ] `ADMIN_SESSION_SECRET` et `CRON_SECRET` generes aleatoirement
- [ ] Telephone et e-mail reels renseignes dans `src/lib/config.ts`
      (l'adresse, elle, est deja la bonne)
- [ ] Logo et photos du salon remplaces
- [ ] Tarif verifie dans `/admin/prestations` (15 € par defaut)
- [ ] Mentions legales completees : forme juridique, directeur de la
      publication, TVA le cas echeant, et hebergeur
      (SIREN et SIRET sont deja renseignes)
- [ ] Domaine d'envoi valide chez le fournisseur d'e-mails
- [ ] Un e-mail et un SMS de test recus
- [ ] Horaires d'ouverture verifies dans `/admin/horaires`

---

## 12. Tests

```bash
npm test              # tous les tests
npm run test:watch    # en continu
```

**114 tests**, repartis en six fichiers :

| Fichier | Contenu |
| --- | --- |
| `tests/availability.test.ts` | Grille de creneaux, week-ends, dates passees, chevauchements, journee complete |
| `tests/datetime.test.ts` | Fuseau Europe/Paris, changements d'heure, formats francais |
| `tests/validation.test.ts` | Telephone, e-mail, champs obligatoires, consentement RGPD |
| `tests/templates.test.ts` | **Contenu des messages** : adresse, tarif et formulations exactes |
| `tests/details-form.test.tsx` | **Formulaire de reservation** : le bouton ne s'active qu'une fois tous les champs valides et la confidentialite acceptee |
| `tests/booking.integration.test.ts` | **Tests reels en base de donnees** |

Les tests d'integration necessitent une base accessible (`npm run db:migrate`
et `npm run db:seed` prealables). Ils nettoient systematiquement leurs donnees.

Scenarios couverts, conformement au cahier des charges :

- un client reserve un creneau disponible ;
- le creneau reserve disparait des disponibilites ;
- un second client ne peut pas reserver le meme creneau ;
- **5 clients simultanes → une seule reservation acceptee** ;
- une prestation longue ne peut pas chevaucher un creneau occupe ;
- reservation impossible le samedi et le dimanche ;
- reservation impossible dans le passe, avant l'ouverture ou apres la fermeture ;
- les coordonnees obligatoires sont validees, messages en francais ;
- l'e-mail et le SMS de confirmation sont declenches ;
- **tous les messages mentionnent l'adresse du salon**, la prestation et le tarif ;
- le rappel n'est envoye qu'une seule fois ;
- une annulation libere le creneau, qui redevient reservable ;
- un creneau bloque par l'administrateur ne peut pas etre reserve ;
- l'espace administrateur est inaccessible sans authentification ;
- le formulaire ne peut pas etre valide tant qu'il est incomplet, et le devient
  des qu'il est correctement rempli.

---

## 13. Arborescence du projet

```
kadir-barber/
├── prisma/
│   ├── migrations/              Migrations SQL versionnees
│   ├── schema.prisma            Modele de donnees
│   └── seed.ts                  Prestations + horaires (+ RDV de demo)
│
├── scripts/
│   └── hash-password.ts         Genere le hachage bcrypt admin
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           Polices, SEO, donnees structurees
│   │   ├── page.tsx             Page d'accueil
│   │   ├── globals.css          Theme sombre et composants de style
│   │   ├── opengraph-image.tsx  Image de partage generee
│   │   ├── sitemap.ts           Plan du site
│   │   ├── robots.ts            robots.txt
│   │   ├── not-found.tsx        Page 404
│   │   │
│   │   ├── reservation/
│   │   │   ├── page.tsx                    Parcours de reservation
│   │   │   └── confirmee/[token]/page.tsx  Page de confirmation
│   │   │
│   │   ├── rendez-vous/[token]/page.tsx    Espace client (jeton securise)
│   │   ├── mentions-legales/page.tsx
│   │   ├── confidentialite/page.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── login/page.tsx              Connexion (hors garde)
│   │   │   └── (dashboard)/                Pages protegees
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx                Rendez-vous
│   │   │       ├── prestations/page.tsx
│   │   │       ├── horaires/page.tsx
│   │   │       └── blocages/page.tsx
│   │   │
│   │   └── api/
│   │       ├── services/                   Prestations publiques
│   │       ├── availability/               Creneaux disponibles
│   │       ├── appointments/               Creation + gestion par jeton
│   │       │   └── [token]/ics/            Fichier calendrier
│   │       ├── cron/reminders/             Rappels 24 h avant
│   │       └── admin/                      Routes protegees
│   │
│   ├── components/
│   │   ├── icons.tsx            Pictogrammes SVG
│   │   ├── site/                Header, Footer, Hero, sections…
│   │   ├── booking/             Assistant de reservation, calendrier…
│   │   └── admin/               Tableau de bord, fenetres modales…
│   │
│   ├── lib/
│   │   ├── config.ts            ★ CONFIGURATION CENTRALE DU SALON
│   │   ├── datetime.ts          Dates et heures (Europe/Paris)
│   │   ├── availability.ts      Moteur de disponibilites (fonctions pures)
│   │   ├── booking.ts           ★ LOGIQUE METIER + ANTI DOUBLE RESERVATION
│   │   ├── validation.ts        Schemas Zod, messages en francais
│   │   ├── auth.ts              Sessions (compatible Edge)
│   │   ├── auth-server.ts       Verification du mot de passe (bcrypt)
│   │   ├── rate-limit.ts        Limitation anti-abus
│   │   ├── api.ts               Helpers des routes API
│   │   ├── ics.ts               Generation du fichier calendrier
│   │   ├── prisma.ts            Client Prisma partage
│   │   ├── serializers.ts       Conversion base → JSON
│   │   └── notifications/
│   │       ├── index.ts         Orchestration + indicateurs
│   │       ├── email.ts         Resend / Brevo / SMTP
│   │       ├── sms.ts           Twilio / Brevo
│   │       └── templates.ts     ★ TEXTES DES MESSAGES
│   │
│   └── middleware.ts            Protection de /admin et /api/admin
│
├── tests/                       Tests unitaires et d'integration
├── .env.example                 Modele de configuration (sans secret)
├── vercel.json                  Tache cron des rappels
└── tailwind.config.ts           Palette et theme
```

---

## 14. Comment fonctionne l'anti double reservation

C'est le point le plus sensible d'un systeme de reservation. La protection
repose sur **la base de donnees**, et non sur du code applicatif — c'est ce qui
la rend fiable.

### Le principe

La table `slot_locks` contient **une ligne par creneau de 30 minutes occupe**,
avec une contrainte :

```prisma
@@unique([date, time])
```

PostgreSQL garantit alors qu'il ne peut **jamais** exister deux lignes pour le
meme couple (jour, horaire).

### Le deroulement d'une reservation

1. **Verification applicative** — le serveur recalcule les disponibilites et
   renvoie un message clair si le creneau ne convient pas (jour ferme, date
   passee, creneau deja pris…).
2. **Ecriture atomique** — le rendez-vous et **tous** ses verrous de creneaux
   sont crees dans une seule transaction Prisma. Si un seul verrou echoue, rien
   n'est enregistre.
3. **Filet de securite** — si un autre client a reserve entre l'etape 1 et
   l'etape 2, PostgreSQL rejette l'ecriture (erreur `P2002`). Cette erreur est
   convertie en message clair : *« Ce creneau vient d'etre reserve par un autre
   client. Merci de choisir un autre horaire. »*

Il n'existe donc **aucune fenetre de concurrence**, meme si deux clients
confirment a la milliseconde pres.

### Les prestations de plus de 30 minutes

Une prestation d'une heure pose **deux** verrous (par exemple `14:00` et
`14:30`). Un autre client ne peut donc pas reserver a 14 h 30, et une prestation
d'une heure ne peut pas demarrer a 13 h 30. Les durees qui ne tombent pas juste
(45 minutes) sont arrondies au creneau superieur.

### Les blocages administrateur

Ils utilisent **la meme table**, avec `blockedSlotId` au lieu de
`appointmentId`. Un creneau bloque est donc aussi solidement protege qu'un
creneau reserve.

### L'annulation

Le rendez-vous passe au statut `CANCELLED` (l'historique est conserve) et ses
verrous sont supprimes : le creneau redevient immediatement reservable.

Ce comportement est verifie par le test
« n'accepte qu'une seule reservation lors de tentatives simultanees », qui lance
5 reservations concurrentes sur le meme creneau et verifie qu'une seule aboutit.

---

## 15. Securite et RGPD

### Securite

- **Validation systematique** cote client (confort) **et** cote serveur (la
  seule qui fasse foi), avec Zod.
- **Aucune injection SQL possible** : Prisma utilise exclusivement des requetes
  parametrees.
- **Espace administrateur protege a deux niveaux** : le middleware bloque
  l'acces a `/admin` et `/api/admin`, et chaque route verifie de nouveau la
  session.
- **Sessions signees** (JWT HS256), stockees dans un cookie `httpOnly`,
  `sameSite=lax`, `secure` en production, valables 8 heures.
- **Mot de passe hache** avec bcrypt (cout 12) et comparaison a temps constant.
- **Limitation du debit** : 5 reservations par IP toutes les 10 minutes,
  8 tentatives de connexion par IP toutes les 15 minutes.
- **Champ piege anti-robot** dans le formulaire de reservation.
- **Jetons clients** de 256 bits d'entropie, impossibles a deviner.
- **Aucun secret dans le depot** : tout passe par `.env`, ignore par Git.
- **En-tetes de securite** : `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
- Les pages nominatives et l'espace admin sont en `noindex`.

### RGPD

- **Case a cocher obligatoire** avant toute reservation, avec horodatage du
  consentement en base (`privacyAcceptedAt`).
- **Minimisation** : seules les donnees necessaires sont collectees. Aucune
  donnee bancaire, aucune donnee sensible.
- **Finalite affichee clairement** : « vos coordonnees sont utilisees uniquement
  pour gerer et rappeler votre rendez-vous », rappelee sur le formulaire, dans
  les e-mails et en pied de page.
- **Politique de confidentialite** et **mentions legales** completes.
- **Droit a l'effacement** : l'administrateur peut supprimer definitivement
  toutes les donnees d'un client.
- **Conservation limitee** : 24 mois par defaut
  (`DATA_RETENTION_MONTHS` dans `src/lib/config.ts`).
- **Aucun cookie de suivi**, aucune mesure d'audience, aucun outil publicitaire.
  Seul un cookie technique de session existe, pour l'administration : aucun
  bandeau de consentement n'est donc necessaire.
- **Polices auto-hebergees** : aucune requete vers Google depuis le navigateur
  du visiteur.

---

## 16. Choix techniques expliques

**Pourquoi stocker les dates en `DATE` + texte `"HH:mm"` ?**
Parce qu'un rendez-vous n'est pas un instant absolu : c'est « le 14 aout a
14 h », quelle que soit la position du serveur. Stocker un `timestamp` obligerait
a convertir dans les deux sens et provoquerait des decalages lors des
changements d'heure. Ici, la conversion n'a lieu qu'aux deux endroits qui en ont
reellement besoin : le calcul des rappels et le fichier `.ics`.

**Pourquoi une table `slot_locks` separee ?**
Une contrainte unique sur `(date, heure)` directement dans `appointments`
n'aurait pas fonctionne : les rendez-vous annules doivent pouvoir coexister sur
un creneau libere, et une prestation d'une heure occupe deux creneaux. Une table
de verrous dediee resout les deux cas avec une seule contrainte, et sert
egalement aux blocages administrateur.

**Pourquoi les prix en centimes ?**
Pour eviter toute erreur d'arrondi liee aux nombres a virgule flottante. Le prix
est saisi en euros dans l'interface et converti a l'enregistrement.

**Pourquoi figer la duree et le prix dans le rendez-vous ?**
Si le salon augmente ses tarifs demain, les rendez-vous deja pris doivent
conserver le prix annonce au client.

**Pourquoi deux fichiers d'authentification ?**
Le middleware s'execute dans le runtime Edge, qui ne supporte pas bcrypt.
`auth.ts` ne contient que de la verification de session (compatible Edge) et
`auth-server.ts` la verification du mot de passe (Node.js uniquement).

**Pourquoi une limitation de debit en memoire ?**
Elle suffit largement pour un salon sur une instance unique et evite une
dependance externe. Sur un deploiement multi-regions, remplacez le `Map` de
`src/lib/rate-limit.ts` par Upstash Redis ou Vercel KV — seule la fonction
`rateLimit` est a reecrire.

---

## 17. Depannage

**« Can't reach database server »**
PostgreSQL n'est pas demarre ou `DATABASE_URL` est incorrect. Testez la
connexion avec `npx prisma db pull`.

**« ADMIN_SESSION_SECRET est manquant ou trop court »**
Le secret doit faire au moins 32 caracteres :
`openssl rand -base64 32`.

**Les e-mails ou SMS ne partent pas**
Regardez les logs du serveur. En l'absence de cle API, les messages y sont
affiches (comportement normal en developpement). Sinon, verifiez la validite de
la cle et du domaine expediteur.

**Le calendrier n'affiche aucun jour disponible**
Verifiez les horaires dans `/admin/horaires` : au moins un jour doit etre actif.
Verifiez aussi qu'aucun blocage ne couvre la periode.

**« Ce creneau vient d'etre reserve »**
C'est le comportement attendu : un autre client a pris le creneau. La liste des
horaires se recharge automatiquement.

**Erreur d'image « hostname is not configured »**
Ajoutez le domaine de vos images dans `remotePatterns`, dans `next.config.ts`.

**Les rendez-vous n'apparaissent pas dans l'administration**
Verifiez le filtre de periode : par defaut, seuls les rendez-vous du jour sont
affiches. Choisissez « A venir » ou « Tout ».

---

## Licence

Projet livre pour l'usage du salon Kadir Barber.
