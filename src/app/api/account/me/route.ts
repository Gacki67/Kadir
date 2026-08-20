import { handleApiError, ok } from "@/lib/api";
import { getCurrentCustomer } from "@/lib/customer-auth-server";

export const dynamic = "force-dynamic";

/** GET /api/account/me — informations du client connecte (ou null). */
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return ok({ customer: null });

    return ok({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    return handleApiError(error, "account:me");
  }
}
