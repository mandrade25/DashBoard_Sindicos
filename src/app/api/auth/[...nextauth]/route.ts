import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import {
  clearLoginFailures,
  evaluateLoginRateLimit,
  registerLoginFailure,
} from "@/lib/auth-rate-limit";
import { getIp } from "@/lib/audit";

function isCredentialsCallback(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return pathname.endsWith("/api/auth/callback/credentials");
}

function buildLoginRedirect(request: NextRequest, callbackUrl: string | null, error: string) {
  const loginUrl = new URL("/login", request.url);

  if (callbackUrl) {
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
  }

  loginUrl.searchParams.set("error", error);

  return loginUrl;
}

function getResponseError(response: Response) {
  const location = response.headers.get("location");
  if (!location) return null;

  const locationUrl = new URL(location, "http://localhost");
  return locationUrl.searchParams.get("error");
}

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (!isCredentialsCallback(request)) {
    return handlers.POST(request);
  }

  const formData = await request.clone().formData();
  const email = formData.get("email");
  const callbackUrl = formData.get("callbackUrl");
  const ip = getIp(request) ?? "unknown";

  const context = {
    ip,
    email: typeof email === "string" ? email : null,
  };

  const rateLimitDecision = evaluateLoginRateLimit(context);
  if (!rateLimitDecision.allowed) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: buildLoginRedirect(
          request,
          typeof callbackUrl === "string" ? callbackUrl : null,
          "RateLimit",
        ).toString(),
        "Retry-After": String(rateLimitDecision.retryAfterSeconds),
      },
    });
  }

  const response = await handlers.POST(request);
  const error = getResponseError(response);

  if (error === "CredentialsSignin") {
    registerLoginFailure(context);
  } else if (!error) {
    clearLoginFailures(context);
  }

  return response;
}

export const dynamic = "force-dynamic";
