import { NextResponse } from "next/server";

import { fail, guardRateLimit, handleApiError, readJson } from "@/lib/api";
import { RATE_LIMITS, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/customer-auth-server";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-auth";
import { customerLoginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/login — connexion d'un client.
 * Le message d'erreur est identique que l'e-mail ou le mot de passe soit faux,
 * pour ne pas reveler quels comptes existent.
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "accountLogin", RATE_LIMITS.accountLogin);
  if (limited) return limited;

  try {
    const parsed = customerLoginSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("E-mail ou mot de passe incorrect.", 401);
    }

    const customer = await prisma.customer.findUnique({
      where: { email: parsed.data.email },
    });

    const valid =
      customer !== null &&
      (await verifyPassword(parsed.data.password, customer.passwordHash));

    if (!customer || !valid) {
      // Petit delai pour ralentir les attaques par force brute.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return fail("E-mail ou mot de passe incorrect.", 401);
    }

    const token = await createCustomerSessionToken(customer.id, customer.email);
    resetRateLimit(`accountLogin:${getClientIp(request)}`);

    const response = NextResponse.json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);
    return response;
  } catch (error) {
    return handleApiError(error, "account:login");
  }
}
