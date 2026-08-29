import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLIENT_CONTRACTS } from "@/lib/api/client-contracts";
import {
  API_SPEC_SOURCE,
  API_SPEC_VERSION,
} from "@/lib/api/generated/v1";
import { checkContracts, loadSpec } from "../../scripts/check-api-drift";
import successHealth from "@/tests/contracts/fixtures/health.success.json";
import errorUnauthorized from "@/tests/contracts/fixtures/error.unauthorized.json";
import breakingChange from "@/tests/contracts/fixtures/breaking-change.openapi.json";

const spec = loadSpec(
  join(process.cwd(), "lib/api/openapi/earnproof-api.v1.json"),
);

describe("frontend API schema drift", () => {
  it("pins generated types to a deterministic source and version", () => {
    expect(API_SPEC_SOURCE).toBe("lib/api/openapi/earnproof-api.v1.json");
    expect(API_SPEC_VERSION).toBe(spec.info.version);
    const generated = readFileSync(
      join(process.cwd(), "lib/api/generated/v1.ts"),
      "utf8",
    );
    expect(generated).toContain("AUTO-GENERATED. Do not edit.");
    expect(generated).not.toContain("components/verification/verification-panel.tsx");
  });

  it("covers auth, payment, proof, issuer, organization, API-key, webhook, health, and error contracts", () => {
    const schemas = CLIENT_CONTRACTS.map((contract) => contract.schema);
    expect(schemas).toEqual(
      expect.arrayContaining([
        "AuthChallengeResponse",
        "AuthVerifyResponse",
        "Payment",
        "ProofCreated",
        "VerifyProofResponse",
        "Issuer",
        "Organization",
        "ApiKey",
        "Webhook",
        "HealthResponse",
        "ApiError",
      ]),
    );
  });

  it("accepts representative success and error fixtures against the spec", () => {
    const healthFields = Object.keys(spec.components.schemas.HealthResponse.properties);
    for (const field of ["status", "service", "database", "timestamp"]) {
      expect(healthFields).toContain(field);
      expect(successHealth[field as keyof typeof successHealth]).toEqual(expect.any(String));
    }
    const errorFields = spec.components.schemas.ApiError.required;
    for (const field of errorFields) {
      expect(errorUnauthorized).toHaveProperty(field);
    }
    expect(spec.components.schemas.ApiError.properties.code.enum).toContain(
      errorUnauthorized.code,
    );
  });

  it("allows additive optional fields without failing", () => {
    const additive = structuredClone(spec);
    additive.components.schemas.HealthResponse.properties.region = {
      type: "string",
    };
    expect(checkContracts(additive, CLIENT_CONTRACTS)).toEqual([]);
  });

  it("fails a seeded breaking change with the owning client module", () => {
    const breakingSpec = structuredClone(spec);
    const schema = breakingSpec.components.schemas[breakingChange.schema];
    delete schema.properties[breakingChange.removeField];
    schema.required = schema.required.filter(
      (field: string) => field !== breakingChange.removeField,
    );

    const failures = checkContracts(breakingSpec, CLIENT_CONTRACTS);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((failure: { module: string }) => failure.module === breakingChange.owningModule)).toBe(
      true,
    );
    expect(failures.map((failure: { message: string }) => failure.message).join("\n")).toMatch(
      /HealthResponse\.timestamp/,
    );
    expect(failures.map((failure: { message: string }) => failure.message).join("\n")).toMatch(
      /Owning client module: lib\/health-check\.ts/,
    );
  });

  it("passes the current versioned OpenAPI fixture", () => {
    expect(checkContracts(spec, CLIENT_CONTRACTS)).toEqual([]);
  });
});
