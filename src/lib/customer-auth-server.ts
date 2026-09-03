/**
 * Cote serveur (Node.js) des comptes client : hachage bcrypt, creation et
 * lecture du compte, et recuperation du client connecte a partir du cookie.
 *
 * Separe de `customer-auth.ts` car bcrypt n'est pas compatible Edge Runtime.
 * A n'importer que depuis des routes/pages s'executant sous Node.js.
 */

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Customer } from "@prisma/client";

import { prisma } from "./prisma";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "./customer-auth";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Recupere le client actuellement connecte a partir du cookie de session.
 * Renvoie null si non connecte (ou si le compte a disparu).
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = await verifyCustomerSessionToken(token);
  if (!session) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
  });
  return customer;
}
