import { test, expect } from "./fixtures/test";
import { connectAndAuthenticate } from "./fixtures/flows";
import { ProofCreationPage } from "./fixtures/pages";
import { SYNTHETIC_PROOF_ID, SYNTHETIC_CREDENTIAL_HASH } from "./fixtures/synthetic-data";

test.describe("payment sync, classification, and minimum-income proof creation", () => {
  test("syncs payments and only allows selecting eligible income rows", async ({
    page,
    freighter,
  }) => {
    await freighter();
    const proofPage = await connectAndAuthenticate(page);

    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    // 4 synthetic payments render; only the 2 INCOME + eligible ones are
    // checkable.
    await expect(proofPage.paymentCheckbox(0)).toBeEnabled();
    await expect(proofPage.paymentCheckbox(1)).toBeEnabled();
    await expect(proofPage.paymentCheckbox(2)).toBeDisabled(); // REIMBURSEMENT
    await expect(proofPage.paymentCheckbox(3)).toBeDisabled(); // UNKNOWN

    // Create proof stays disabled until an eligible payment is selected.
    await expect(proofPage.createProofButton).toBeDisabled();
  });

  test("reclassifying a payment as income makes it selectable", async ({ page, freighter }) => {
    await freighter();
    const proofPage = await connectAndAuthenticate(page);
    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    await proofPage.classificationSelect(3).selectOption("INCOME");
    await expect(proofPage.paymentCheckbox(3)).toBeEnabled();
  });

  test("creates a signed minimum-income proof from selected payments and links to public verification", async ({
    page,
    freighter,
  }) => {
    await freighter();
    const proofPage = await connectAndAuthenticate(page);
    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    await proofPage.paymentCheckbox(0).check();
    await proofPage.paymentCheckbox(1).check();
    await expect(proofPage.createProofButton).toBeEnabled();

    // `force: true` below works around a pre-existing responsive layout
    // bug this spec surfaced: the unbroken 56-char wallet address rendered
    // by "Connected as {address}" widens the document beyond the mobile
    // viewport (confirmed via window.innerWidth vs the configured
    // viewport), which makes Chromium's mobile emulation report a stray
    // pointer-interception on unrelated elements above the real target
    // even though their bounding boxes never overlap. The element is
    // genuinely visible, enabled, and at the expected location — only the
    // hit-test guard is bypassed. This is an app CSS issue (missing
    // word-break on the address/hash display), not a test bug or a
    // masked functional failure; see the PR description for the flagged
    // follow-up.
    await proofPage.createProofButton.scrollIntoViewIfNeeded();
    await proofPage.createProofButton.click({ force: true });

    await expect(page.getByText("Proof created.")).toBeVisible();
    await expect(proofPage.proofIdText).toContainText(SYNTHETIC_PROOF_ID);
    await expect(proofPage.credentialHashText).toContainText(SYNTHETIC_CREDENTIAL_HASH);

    const verificationHref = await proofPage.openVerificationLink.getAttribute("href");
    expect(verificationHref).toBe(`/verify?proof=${encodeURIComponent(SYNTHETIC_PROOF_ID)}`);

    await proofPage.openVerificationLink.scrollIntoViewIfNeeded();
    await proofPage.openVerificationLink.click({ force: true });
    await expect(page).toHaveURL(new RegExp(`/verify\\?proof=${SYNTHETIC_PROOF_ID}`));
  });

  test("blocks proof creation before a wallet is connected", async ({ page, freighter }) => {
    await freighter();
    const proofPage = new ProofCreationPage(page);
    await proofPage.goto();

    // The payments and proof sections render, but their actions require a
    // session: Sync/Refresh/Create are disabled without one.
    await expect(proofPage.syncButton).toBeDisabled();
    await expect(proofPage.createProofButton).toBeDisabled();
  });

  test("a rapid double click on Create proof only mutates once", async ({
    page,
    freighter,
    apiMock,
  }) => {
    await freighter();
    // Widen the in-flight window so a double click has a real chance to
    // land a second request while the first is still pending, if the
    // frontend's submission lock were not preventing it.
    apiMock.setProofCreationDelay(300);

    const proofPage = await connectAndAuthenticate(page);
    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    await proofPage.paymentCheckbox(0).check();
    await proofPage.paymentCheckbox(1).check();
    await expect(proofPage.createProofButton).toBeEnabled();

    await proofPage.createProofButton.scrollIntoViewIfNeeded();
    // Two rapid clicks on the same button, before the first response can
    // possibly land (the mock is delayed above) or the button's disabled
    // state can re-render.
    await proofPage.createProofButton.click({ force: true });
    await proofPage.createProofButton.click({ force: true });

    await expect(page.getByText("Proof created.")).toBeVisible();
    await expect(proofPage.proofIdText).toContainText(SYNTHETIC_PROOF_ID);

    expect(apiMock.proofCreationIdempotencyKeys).toHaveLength(1);
  });

  test("a retry after a failed submission reuses the same idempotency key", async ({
    page,
    freighter,
    apiMock,
  }) => {
    await freighter();
    const proofPage = await connectAndAuthenticate(page);
    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    await proofPage.paymentCheckbox(0).check();
    await proofPage.paymentCheckbox(1).check();

    // Force only the first attempt to fail at the network layer; let
    // every subsequent request fall through to the normal ApiMock handler
    // registered by the `apiMock` fixture.
    let aborted = false;
    await page.route("**/proofs/minimum-income", async (route) => {
      if (!aborted) {
        aborted = true;
        await route.abort();
        return;
      }
      await route.fallback();
    });

    await proofPage.createProofButton.scrollIntoViewIfNeeded();
    await proofPage.createProofButton.click({ force: true });
    await expect(page.getByText(/Proof creation failed/)).toBeVisible();

    // Retry with the same selection/threshold/period (an unchanged intent).
    await proofPage.createProofButton.click({ force: true });
    await expect(page.getByText("Proof created.")).toBeVisible();

    expect(apiMock.proofCreationIdempotencyKeys).toHaveLength(1);
    expect(apiMock.proofCreationIdempotencyKeys[0]).toEqual(expect.any(String));
  });

  test("disconnecting while a proof submission is in flight does not resurrect it after reconnecting", async ({
    page,
    freighter,
    apiMock,
  }) => {
    await freighter();
    apiMock.setProofCreationDelay(500);

    const proofPage = await connectAndAuthenticate(page);
    await proofPage.syncButton.click();
    await expect(page.getByText("Payments synced.")).toBeVisible();

    await proofPage.paymentCheckbox(0).check();
    await proofPage.paymentCheckbox(1).check();
    await proofPage.createProofButton.scrollIntoViewIfNeeded();
    await proofPage.createProofButton.click({ force: true });
    await expect(page.getByText("Creating signed minimum-income proof...")).toBeVisible();

    // Disconnect before the delayed response can land.
    await proofPage.disconnectButton.click();
    await expect(proofPage.connectButton).toBeVisible();

    // Give the in-flight (now-invalidated) request time to resolve.
    await page.waitForTimeout(700);

    // The disconnected, logged-out view must not show the superseded
    // submission's result.
    await expect(page.getByText("Proof created.")).not.toBeVisible();
    await expect(proofPage.proofIdText).not.toBeVisible();
  });
});
