import { NextResponse } from "next/server";

import { fail, guardRateLimit, handleApiError, readJson } from "@/lib/api";
import { RATE_LIMITS, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/customer-auth-server";
import {
  createCustomerSessionToken,
  customerSessionCookieOptions,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-auth";
import { registerSchema, formatZodErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/register — inscription d'un client.
 * En cas de succes, ouvre directement la session (cookie httpOnly).
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "register", RATE_LIMITS.register);
  if (limited) return limited;

  try {
    const parsed = registerSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail("Certains champs sont invalides.", 422, {
        fields: formatZodErrors(parsed.error),
      });
    }

    const { firstName, lastName, email, phone, password } = parsed.data;

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return fail(
        "Un compte existe deja avec cette adresse e-mail. Connectez-vous.",
        409,
        { fields: { email: "Cette adresse e-mail est deja utilisee." } },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash: await hashPassword(password),
      },
    });

    const token = await createCustomerSessionToken(customer.id, customer.email);
    resetRateLimit(`register:${getClientIp(request)}`);

    const response = NextResponse.json(
      {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
        },
      },
      { status: 201 },
    );
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);
    return response;
  } catch (error) {
    return handleApiError(error, "account:register");
  }
}
