import type { Page, Route } from "@playwright/test";
import {
  SYNTHETIC_CHALLENGE,
  SYNTHETIC_CREATE_PROOF_RESPONSE,
  SYNTHETIC_PAYMENTS,
  SYNTHETIC_SESSION_TOKEN,
  SYNTHETIC_USER,
  SYNTHETIC_VERIFY_RESPONSES,
  type SyntheticPayment,
} from "./synthetic-data";

/**
 * Deterministic mock of the EarnProof backend API (`NEXT_PUBLIC_API_URL`).
 * Every response body is built from synthetic fixture data — no live
 * network call ever leaves the browser context during a test.
 */
export type ApiMockOptions = {
  apiUrl: string;
  /** Which proof id to serve as the verification "happy path" result. */
  verifyOutcome?: keyof typeof SYNTHETIC_VERIFY_RESPONSES;
  /** Require this bearer token on authenticated routes; mismatches 401. */
  expectedToken?: string;
};

export class ApiMock {
  private payments: SyntheticPayment[];
  private readonly apiUrl: string;
  private verifyOutcome: keyof typeof SYNTHETIC_VERIFY_RESPONSES;
  private readonly expectedToken: string;
  private proofCreationDelayMs = 0;
  authRequests: { walletAddress: string }[] = [];
  verifyRequests: string[] = [];
  /** Every `Idempotency-Key` header seen on POST /proofs/minimum-income, in request order. */
  proofCreationIdempotencyKeys: (string | undefined)[] = [];

  constructor(options: ApiMockOptions) {
    this.apiUrl = options.apiUrl.replace(/\/$/, "");
    this.verifyOutcome = options.verifyOutcome ?? "valid";
    this.expectedToken = options.expectedToken ?? SYNTHETIC_SESSION_TOKEN;
    this.payments = SYNTHETIC_PAYMENTS.map((payment) => ({ ...payment }));
  }

  /** Switch the outcome served by `GET /proofs/:id/verify` for tests that
   * exercise expired/revoked/unknown states without a second ApiMock. */
  setVerifyOutcome(outcome: keyof typeof SYNTHETIC_VERIFY_RESPONSES) {
    this.verifyOutcome = outcome;
  }

  /** Delay every POST /proofs/minimum-income response, to widen the window
   * for a rapid-double-click / late-response-ordering test to land a
   * second request while the first is still in flight, if the frontend's
   * submission lock were not preventing it. */
  setProofCreationDelay(ms: number) {
    this.proofCreationDelayMs = ms;
  }

  async install(page: Page) {
    await page.route(`${this.apiUrl}/**`, (route) => this.handle(route));
  }

  private isAuthorized(route: Route) {
    const header = route.request().headers()["authorization"];
    return header === `Bearer ${this.expectedToken}`;
  }

  private json(route: Route, status: number, body: unknown) {
    return route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  }

  private async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(new URL(this.apiUrl).pathname, "");
    const method = request.method();

    if (path === "/auth/challenge" && method === "POST") {
      const body = request.postDataJSON() as { walletAddress: string };
      this.authRequests.push({ walletAddress: body.walletAddress });
      return this.json(route, 200, SYNTHETIC_CHALLENGE);
    }

    if (path === "/auth/verify" && method === "POST") {
      return this.json(route, 200, {
        user: SYNTHETIC_USER,
        session: { token: this.expectedToken, tokenType: "Bearer" },
      });
    }

    if (path === "/payments/sync" && method === "POST") {
      if (!this.isAuthorized(route)) return this.json(route, 401, { error: "unauthorized" });
      return this.json(route, 200, { synced: this.payments.length });
    }

    if (path === "/payments" && method === "GET") {
      if (!this.isAuthorized(route)) return this.json(route, 401, { error: "unauthorized" });
      return this.json(route, 200, this.payments);
    }

    const classificationMatch = path.match(/^\/payments\/([^/]+)\/classification$/);
    if (classificationMatch && method === "PATCH") {
      if (!this.isAuthorized(route)) return this.json(route, 401, { error: "unauthorized" });
      const paymentId = classificationMatch[1];
      const body = request.postDataJSON() as { classification: SyntheticPayment["classification"] };
      const isIncomeLike = body.classification === "INCOME";
      this.payments = this.payments.map((payment) =>
        payment.id === paymentId
          ? { ...payment, classification: body.classification, isEligible: isIncomeLike }
          : payment,
      );
      const updated = this.payments.find((payment) => payment.id === paymentId);
      return this.json(route, 200, updated);
    }

    if (path === "/proofs/minimum-income" && method === "POST") {
      if (!this.isAuthorized(route)) return this.json(route, 401, { error: "unauthorized" });
      this.proofCreationIdempotencyKeys.push(request.headers()["idempotency-key"]);
      if (this.proofCreationDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.proofCreationDelayMs));
      }
      return this.json(route, 201, SYNTHETIC_CREATE_PROOF_RESPONSE);
    }

    const verifyMatch = path.match(/^\/proofs\/([^/]+)\/verify$/);
    if (verifyMatch && method === "GET") {
      const requestedId = decodeURIComponent(verifyMatch[1]);
      this.verifyRequests.push(requestedId);
      const response = requestedId.startsWith("UNKNOWN")
        ? SYNTHETIC_VERIFY_RESPONSES.unknown
        : SYNTHETIC_VERIFY_RESPONSES[this.verifyOutcome];
      return this.json(route, 200, response);
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: `unmocked route: ${method} ${path}` }),
    });
  }
}
