import type { Metadata } from "next";

import {
  LEGAL,
  SALON,
  getFullAddress,
  getPhoneDisplay,
  getPhoneHref,
  getSiteUrl,
} from "@/lib/config";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Mentions legales",
  description: `Mentions legales du site ${SALON.name}.`,
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return (
    <>
      <Header />

      <main id="contenu" className="min-h-screen pb-24 pt-[110px]">
        <div className="container-kb">
          <article className="prose-kb mx-auto max-w-3xl">
            <h1 className="section-title">Mentions legales</h1>
            <p className="mt-4 text-sm text-ink-400">
              Derniere mise a jour : {new Date().getFullYear()}
            </p>

            <div className="mt-10 space-y-10 leading-relaxed text-neutral-300">
              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  1. Editeur du site
                </h2>
                <div className="card p-5">
                  <dl className="space-y-2.5 text-sm">
                    <Line label="Denomination" value={SALON.name} />
                    <Line label="Adresse" value={getFullAddress()} />
                    <Line
                      label="Contact"
                      value={
                        SALON.email
                          ? `${getPhoneDisplay()} — ${SALON.email}`
                          : getPhoneDisplay()
                      }
                    />
                    <Line label="Numero SIREN" value={LEGAL.siren} />
                    <Line label="Numero SIRET" value={LEGAL.siret} />
                    <Line
                      label="Forme juridique"
                      value={
                        LEGAL.legalForm ||
                        "[A COMPLETER — ex. entreprise individuelle, SARL, SAS]"
                      }
                    />
                    <Line
                      label="Numero de TVA intracommunautaire"
                      value={
                        LEGAL.vatNumber ||
                        "[A COMPLETER, si l'entreprise est assujettie a la TVA]"
                      }
                    />
                    <Line
                      label="Directeur de la publication"
                      value={
                        LEGAL.publicationDirector ||
                        "[NOM DU RESPONSABLE A RENSEIGNER]"
                      }
                    />
                  </dl>
                </div>
                <p className="mt-4 rounded-xl border border-gold-500/25 bg-gold-400/[0.06] p-4 text-sm">
                  <strong className="text-white">A completer :</strong> les
                  champs encore entre crochets doivent etre renseignes avant la
                  mise en ligne. Ils se modifient dans la constante{" "}
                  <code className="text-gold-400">LEGAL</code> de{" "}
                  <code className="text-gold-400">src/lib/config.ts</code>.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">2. Hebergement</h2>
                <p>
                  Le site est heberge par{" "}
                  <strong className="text-white">
                    [HEBERGEUR A RENSEIGNER — ex. Vercel Inc.]
                  </strong>
                  , dont le siege social est situe{" "}
                  <strong className="text-white">
                    [ADRESSE DE L&apos;HEBERGEUR]
                  </strong>
                  .
                </p>
                <p className="mt-3">
                  Les donnees de reservation sont stockees sur une base de
                  donnees PostgreSQL hebergee au sein de l&apos;Union
                  europeenne.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  3. Propriete intellectuelle
                </h2>
                <p>
                  L&apos;ensemble des elements composant ce site (textes,
                  images, logo, charte graphique, code source) est protege par
                  le droit d&apos;auteur. Toute reproduction, representation ou
                  diffusion, totale ou partielle, sans autorisation ecrite
                  prealable de {SALON.name}, est interdite.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  4. Donnees personnelles
                </h2>
                <p>
                  Les informations recueillies lors de la prise de rendez-vous
                  sont utilisees uniquement pour gerer et rappeler ce
                  rendez-vous. Le detail du traitement, la duree de conservation
                  et les modalites d&apos;exercice de vos droits sont decrits
                  dans notre{" "}
                  <a
                    href="/confidentialite"
                    className="text-gold-400 underline underline-offset-2 hover:text-gold-300"
                  >
                    politique de confidentialite
                  </a>
                  .
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">5. Cookies</h2>
                <p>
                  Ce site n&apos;utilise{" "}
                  <strong className="text-white">
                    aucun cookie publicitaire ni de mesure d&apos;audience
                  </strong>
                  . Seul un cookie technique est depose lors de la connexion a
                  l&apos;espace administrateur du salon : il est strictement
                  necessaire au fonctionnement du service et ne necessite donc
                  pas de consentement prealable.
                </p>
                <p className="mt-3">
                  Les polices de caracteres sont hebergees directement avec le
                  site : aucune requete n&apos;est adressee a un service tiers
                  lors de votre navigation.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  6. Responsabilite
                </h2>
                <p>
                  {SALON.name} s&apos;efforce d&apos;assurer l&apos;exactitude
                  des informations diffusees sur ce site, sans garantir
                  l&apos;absence totale d&apos;erreur. Les horaires,
                  disponibilites et tarifs peuvent evoluer ; seuls ceux affiches
                  au salon font foi en cas de divergence.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  7. Droit applicable
                </h2>
                <p>
                  Les presentes mentions legales sont soumises au droit
                  francais. En cas de litige, et apres recherche d&apos;une
                  solution amiable, les tribunaux francais seront seuls
                  competents.
                </p>
                <p className="mt-3">
                  Conformement au reglement (UE) n° 524/2013, vous pouvez
                  egalement recourir a la plateforme europeenne de reglement en
                  ligne des litiges.
                </p>
              </section>

              {/* ---------------------------------------------------------- */}
              <section>
                <h2 className="mb-4 text-xl font-semibold">8. Contact</h2>
                <p>
                  Pour toute question relative au site ou aux presentes mentions
                  legales :
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {SALON.email && (
                    <li>
                      E-mail :{" "}
                      <a
                        href={`mailto:${SALON.email}`}
                        className="text-gold-400 hover:text-gold-300"
                      >
                        {SALON.email}
                      </a>
                    </li>
                  )}
                  <li>
                    Telephone :{" "}
                    <a
                      href={getPhoneHref()}
                      className="text-gold-400 hover:text-gold-300"
                    >
                      {getPhoneDisplay()}
                    </a>
                  </li>
                  {getFullAddress() && <li>Adresse : {getFullAddress()}</li>}
                  <li>Site : {getSiteUrl()}</li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-ink-400 sm:w-64">{label}</dt>
      <dd className="text-neutral-200">{value}</dd>
    </div>
  );
}
