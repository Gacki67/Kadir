import type { Metadata } from "next";

import {
  DATA_RETENTION_MONTHS,
  SALON,
  getFullAddress,
  getSnapchatDisplay,
  getSnapchatUrl,
} from "@/lib/config";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description: `Comment ${SALON.name} collecte, utilise et protege vos donnees personnelles lors d'une reservation en ligne.`,
  alternates: { canonical: "/confidentialite" },
  robots: { index: true, follow: true },
};

const RIGHTS = [
  {
    title: "Droit d'acces",
    text: "Obtenir la copie des donnees que nous detenons sur vous.",
  },
  {
    title: "Droit de rectification",
    text: "Corriger une information inexacte (nom mal orthographie, numero errone…).",
  },
  {
    title: "Droit a l'effacement",
    text: "Demander la suppression definitive de vos donnees. Elle est realisee sous 30 jours.",
  },
  {
    title: "Droit d'opposition",
    text: "Vous opposer au traitement de vos donnees pour un motif legitime.",
  },
  {
    title: "Droit a la limitation",
    text: "Demander le gel temporaire de l'utilisation de vos donnees.",
  },
  {
    title: "Droit a la portabilite",
    text: "Recevoir vos donnees dans un format structure et lisible par machine.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <article className="mx-auto max-w-3xl">
            <h1 className="section-title">Politique de confidentialite</h1>
            <p className="mt-4 text-sm text-ink-400">
              Derniere mise a jour : {new Date().getFullYear()}
            </p>

            <p className="mt-8 rounded-2xl border border-gold-500/25 bg-gold-400/[0.06] p-5 leading-relaxed text-neutral-200">
              <strong className="text-white">En resume :</strong> vos
              coordonnees sont utilisees{" "}
              <strong className="text-white">
                uniquement pour gerer et vous rappeler votre rendez-vous
              </strong>
              . Elles ne sont ni revendues, ni cedees, ni utilisees a des fins
              publicitaires.
            </p>

            <div className="mt-10 space-y-10 leading-relaxed text-neutral-300">
              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  1. Responsable du traitement
                </h2>
                <p>
                  Le responsable du traitement des donnees est{" "}
                  <strong className="text-white">{SALON.name}</strong>,{" "}
                  {getFullAddress()}.
                </p>
                <p className="mt-3">
                  Pour toute question relative a vos donnees, contactez-nous a{" "}
                  <a
                    href={`mailto:${SALON.email}`}
                    className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                  >
                    {SALON.email}
                  </a>{" "}
                  ou sur Snapchat{" "}
                  <a
                    href={getSnapchatUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                  >
                    {getSnapchatDisplay()}
                  </a>
                  .
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  2. Donnees collectees
                </h2>
                <p>
                  Lors d&apos;une prise de rendez-vous, nous collectons
                  uniquement les informations necessaires :
                </p>

                <div className="card mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-ink-600 bg-ink-900/50">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-semibold text-white">
                          Donnee
                        </th>
                        <th scope="col" className="px-5 py-3 font-semibold text-white">
                          Pourquoi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700">
                      {[
                        ["Nom et prenom", "Vous identifier a votre arrivee au salon"],
                        ["Adresse e-mail", "Envoyer la confirmation et le rappel"],
                        ["Numero de telephone", "Envoyer le SMS de confirmation et de rappel, vous joindre en cas d'imprevu"],
                        ["Prestation, date et heure", "Reserver et bloquer votre creneau"],
                        ["Commentaire (facultatif)", "Preparer au mieux votre passage"],
                      ].map(([data, why]) => (
                        <tr key={data}>
                          <td className="px-5 py-3 font-medium text-neutral-200">
                            {data}
                          </td>
                          <td className="px-5 py-3 text-neutral-400">{why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-5">
                  <strong className="text-white">
                    Aucune donnee bancaire n&apos;est collectee
                  </strong>{" "}
                  : le reglement se fait sur place. Aucune donnee sensible
                  (sante, origine, opinions) n&apos;est demandee.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  3. Base legale et finalites
                </h2>
                <p>
                  Le traitement repose sur{" "}
                  <strong className="text-white">
                    l&apos;execution de mesures precontractuelles
                  </strong>{" "}
                  (article 6.1.b du RGPD) — la reservation que vous demandez —
                  ainsi que sur{" "}
                  <strong className="text-white">votre consentement</strong>{" "}
                  (article 6.1.a), recueilli par la case a cocher obligatoire du
                  formulaire de reservation.
                </p>
                <p className="mt-3">Vos donnees servent exclusivement a :</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "enregistrer et bloquer votre creneau ;",
                    "vous envoyer la confirmation par e-mail et par SMS ;",
                    "vous envoyer un rappel automatique 24 h avant le rendez-vous ;",
                    "vous permettre de modifier ou d'annuler votre rendez-vous ;",
                    "vous contacter en cas d'imprevu (fermeture exceptionnelle, retard).",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  4. Duree de conservation
                </h2>
                <p>
                  Vos donnees sont conservees{" "}
                  <strong className="text-white">
                    {DATA_RETENTION_MONTHS} mois
                  </strong>{" "}
                  apres votre dernier rendez-vous, afin de conserver
                  l&apos;historique de vos passages et de faciliter vos
                  prochaines venues. Passe ce delai, elles sont supprimees.
                </p>
                <p className="mt-3">
                  Vous pouvez demander leur suppression a tout moment, sans
                  attendre ce delai.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  5. Destinataires des donnees
                </h2>
                <p>
                  Vos donnees sont accessibles uniquement a l&apos;equipe du
                  salon. Elles sont transmises a nos sous-traitants techniques,
                  strictement pour l&apos;acheminement des messages :
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex gap-3">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    <span>
                      <strong className="text-white">
                        Notre prestataire d&apos;envoi d&apos;e-mails
                      </strong>{" "}
                      — pour la confirmation et le rappel.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    <span>
                      <strong className="text-white">
                        Notre prestataire d&apos;envoi de SMS
                      </strong>{" "}
                      — pour les memes messages.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    <span>
                      <strong className="text-white">Notre hebergeur</strong> —
                      pour le stockage securise de la base de donnees.
                    </span>
                  </li>
                </ul>
                <p className="mt-4">
                  <strong className="text-white">
                    Vos donnees ne sont jamais vendues, louees ou cedees
                  </strong>{" "}
                  a des tiers a des fins commerciales ou publicitaires.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">6. Securite</h2>
                <p>
                  Nous mettons en oeuvre des mesures techniques adaptees :
                  chiffrement des echanges (HTTPS), acces a l&apos;espace
                  administrateur protege par mot de passe et session signee,
                  limitation du nombre de tentatives de connexion, validation
                  systematique des donnees recues et protection contre les
                  injections en base.
                </p>
                <p className="mt-3">
                  Le lien de gestion de votre rendez-vous contient un jeton
                  unique et impossible a deviner. Ne le partagez pas.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">7. Vos droits</h2>
                <p>
                  Conformement au RGPD et a la loi Informatique et Libertes,
                  vous disposez des droits suivants :
                </p>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {RIGHTS.map((right) => (
                    <li key={right.title} className="card p-4">
                      <h3 className="text-sm font-semibold text-white">
                        {right.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-neutral-400">
                        {right.text}
                      </p>
                    </li>
                  ))}
                </ul>

                <p className="mt-6">
                  Pour exercer ces droits, ecrivez-nous a{" "}
                  <a
                    href={`mailto:${SALON.email}`}
                    className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                  >
                    {SALON.email}
                  </a>
                  . Nous repondons sous 30 jours maximum.
                </p>
                <p className="mt-3">
                  Si vous estimez que vos droits ne sont pas respectes, vous
                  pouvez introduire une reclamation aupres de la CNIL —{" "}
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                  >
                    www.cnil.fr
                  </a>
                  .
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">8. Cookies</h2>
                <p>
                  Ce site ne depose{" "}
                  <strong className="text-white">
                    aucun cookie de suivi, de mesure d&apos;audience ou de
                    publicite
                  </strong>
                  . Seul un cookie technique de session est utilise pour
                  l&apos;espace administrateur du salon. Aucun bandeau de
                  consentement n&apos;est donc necessaire.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  9. Modification de cette politique
                </h2>
                <p>
                  Cette politique peut evoluer. Toute modification importante
                  sera signalee sur cette page, avec mise a jour de la date
                  indiquee en haut du document.
                </p>
              </section>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
