// @vitest-environment jsdom

/**
 * Test de non-regression du formulaire de coordonnees.
 *
 * Contexte : une premiere version utilisait `mode: "onBlur"` dans
 * react-hook-form. Le dernier geste de l'utilisateur etant de cocher la case de
 * confidentialite — qui emet un evenement `change` et jamais `blur` —,
 * `isValid` n'etait plus recalcule apres ce clic et le bouton restait
 * desactive : AUCUNE reservation n'etait possible.
 *
 * Ce fichier verrouille les deux comportements attendus :
 *   1. le bouton reste inactif tant que le formulaire est incomplet
 *      (exigence du cahier des charges) ;
 *   2. il devient actif des que tout est correctement rempli, la case de
 *      confidentialite comprise.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DetailsForm } from "@/components/booking/DetailsForm";

afterEach(cleanup);

/** Rend le formulaire et renvoie de quoi le piloter. */
function setup() {
  const onSubmit = vi.fn();
  const onBack = vi.fn();

  render(
    <DetailsForm defaultValues={{}} onSubmit={onSubmit} onBack={onBack} />,
  );

  return {
    onSubmit,
    onBack,
    user: userEvent.setup(),
    submitButton: () =>
      screen.getByRole("button", { name: /verifier ma reservation/i }),
  };
}

/** Remplit les quatre champs obligatoires avec des valeurs valides. */
async function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/prenom/i), "Camille");
  await user.type(screen.getByLabelText(/^nom/i), "Durand");
  await user.type(
    screen.getByLabelText(/adresse e-mail/i),
    "camille.durand@exemple.fr",
  );
  await user.type(screen.getByLabelText(/telephone/i), "06 11 22 33 44");
}

describe("Formulaire de coordonnees", () => {
  it("desactive le bouton tant que rien n'est saisi", () => {
    const { submitButton } = setup();
    expect(submitButton()).toBeDisabled();
  });

  it("laisse le bouton inactif si la confidentialite n'est pas acceptee", async () => {
    const { user, submitButton } = setup();

    await fillValidFields(user);
    // On quitte le dernier champ, comme le ferait un utilisateur.
    await user.tab();

    expect(submitButton()).toBeDisabled();
  });

  it("active le bouton une fois la case de confidentialite cochee", async () => {
    const { user, submitButton } = setup();

    await fillValidFields(user);
    await user.click(screen.getByLabelText(/politique de confidentialite/i));

    // C'est precisement ce qui ne fonctionnait pas en mode `onBlur` :
    // cocher la case doit suffire a rendre le formulaire valide.
    await waitFor(() => expect(submitButton()).toBeEnabled());
  });

  it("transmet les coordonnees saisies", async () => {
    const { user, onSubmit, submitButton } = setup();

    await fillValidFields(user);
    await user.click(screen.getByLabelText(/politique de confidentialite/i));
    await waitFor(() => expect(submitButton()).toBeEnabled());

    await user.click(submitButton());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      firstName: "Camille",
      lastName: "Durand",
      email: "camille.durand@exemple.fr",
      phone: "06 11 22 33 44",
      privacyAccepted: true,
    });
  });

  it("refuse un e-mail invalide et l'annonce en francais", async () => {
    const { user, submitButton } = setup();

    await user.type(screen.getByLabelText(/prenom/i), "Camille");
    await user.type(screen.getByLabelText(/^nom/i), "Durand");
    await user.type(screen.getByLabelText(/adresse e-mail/i), "pas-un-email");
    await user.tab();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /adresse e-mail invalide/i,
    );
    expect(submitButton()).toBeDisabled();
  });

  it("refuse un numero de telephone invalide", async () => {
    const { user, submitButton } = setup();

    await fillValidFields(user);
    // On remplace le numero valide par un numero trop court.
    const phone = screen.getByLabelText(/telephone/i);
    await user.clear(phone);
    await user.type(phone, "123");
    await user.click(screen.getByLabelText(/politique de confidentialite/i));

    await waitFor(() =>
      expect(screen.getByText(/numero de telephone invalide/i)).toBeTruthy(),
    );
    expect(submitButton()).toBeDisabled();
  });

  it("permet de revenir a l'etape precedente", async () => {
    const { user, onBack } = setup();

    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
