# L'Espace de Rayan — Guide de mise en ligne (gratuit)

Ce guide explique, étape par étape, comment mettre le site en ligne
**gratuitement** avec **Vercel** (hébergement) + **Neon** (base de données
PostgreSQL). Aucune carte bancaire n'est demandée pour la formule gratuite.

---

## 1. Créer la base de données (Neon — gratuit)

1. Aller sur **https://neon.tech** → *Sign up* (avec GitHub, c'est le plus simple).
2. *Create a project* → nom : `espace-de-rayan`, région : *Europe (Frankfurt)*.
3. Neon affiche une **Connection string** qui ressemble à :
   ```
   postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Gardez-la : c'est votre `DATABASE_URL`.
4. Pour `DIRECT_URL`, reprenez **la même URL en retirant `-pooler`** dans le nom
   d'hôte :
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

## 2. Mettre le code sur GitHub

Le code est déjà sur la branche `claude/rayan-barber-booking-site-ek8fym`.
Depuis GitHub, vous pouvez la fusionner dans `main` (bouton *Merge*), ou
déployer directement cette branche à l'étape suivante.

## 3. Déployer sur Vercel (gratuit)

1. Aller sur **https://vercel.com** → *Sign up* avec GitHub.
2. *Add New… → Project* → importer le dépôt du site.
3. Dans **Environment Variables**, ajouter :

   | Nom | Valeur |
   |-----|--------|
   | `DATABASE_URL` | la Connection string Neon (avec `-pooler`) |
   | `DIRECT_URL` | la même sans `-pooler` |
   | `ADMIN_SESSION_SECRET` | une longue chaîne aléatoire (min. 32 caractères) |
   | `ADMIN_ACCESS_CODE` | **le code secret de Rayan** (ex. `RAYAN-7391`) |
   | `NEXT_PUBLIC_SITE_URL` | l'URL du site (ex. `https://espace-de-rayan.vercel.app`) |

   > Pour générer `ADMIN_SESSION_SECRET`, tapez dans un terminal :
   > `openssl rand -base64 32` (ou utilisez n'importe quelle longue phrase).

4. Cliquer **Deploy**. Vercel installe tout, crée les tables, remplit le
   catalogue de prestations et met le site en ligne automatiquement.

## 4. Se connecter à l'espace de Rayan

- Aller sur **`votre-site.vercel.app/admin`**.
- Saisir le **code d'accès** (`ADMIN_ACCESS_CODE`).
- Rayan voit alors **tous les rendez-vous** : nom, prénom, téléphone, jour et
  heure. Il peut aussi modifier les horaires, bloquer des créneaux (congés) et
  ajuster les prestations/tarifs.

Les clients, eux, doivent **créer un compte** (e-mail + mot de passe) pour
réserver. Ils ne voient jamais les rendez-vous des autres.

## 5. Ajouter les photos des coupes

1. Placez vos photos dans le dossier **`public/coupes/`** en les nommant :
   `coupe-1.jpg`, `coupe-2.jpg`, … jusqu'à `coupe-6.jpg`.
2. Commitez / poussez : elles apparaissent aussitôt dans l'onglet **Les Coupes**.
3. Tant qu'une photo manque, une vignette élégante « Photo à venir » s'affiche —
   la page reste toujours propre.

## 6. Personnaliser (facultatif)

Tout se règle dans un seul fichier : **`src/lib/config.ts`**
- `SALON.phoneDisplay` / `SALON.phoneE164` : le numéro de téléphone.
- `SALON.address` : l'adresse du salon (laissée vide tant qu'elle n'est pas
  connue — le site s'adapte automatiquement).
- `SALON.openingSoon` : passez à `false` le jour de l'ouverture pour retirer le
  bandeau « Ouverture prochaine ».
- `SERVICES` : la liste des prestations, prix et durées (aussi modifiables
  depuis `/admin` une fois en ligne).
- Horaires par défaut : `BOOKING.defaultBusinessHours` (Rayan travaille
  lundi → vendredi 9 h–19 h, samedi et dimanche fermés).

## 7. E-mails de confirmation (facultatif, gratuit)

Sans configuration, les réservations fonctionnent et les confirmations
s'affichent dans les logs. Pour envoyer de vrais e-mails, créez un compte
gratuit **Resend** (https://resend.com), puis ajoutez sur Vercel :
- `RESEND_API_KEY` : votre clé,
- `EMAIL_FROM` : par ex. `L'Espace de Rayan <contact@votre-domaine.fr>`.

---

### Compte de démonstration (pour tester)

Après `npm run db:seed -- --demo` (ou en local), un compte de test existe :
- e-mail : `client.demo@exemple.fr`
- mot de passe : `demodemo`

À supprimer avant l'ouverture réelle.
