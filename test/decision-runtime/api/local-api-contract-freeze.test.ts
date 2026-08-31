import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contractPath = "docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md";
const httpPath = "lib/decision-runtime/http/decision-contexts.ts";
const postRoutePath = "app/api/decision-contexts/route.ts";
const getRoutePath = "app/api/decision-contexts/[revisionId]/route.ts";
const contextTypesPath = "lib/decision-core/context/types.ts";
const authorityTypesPath = "lib/decision-core/authority/types.ts";
const revisionTypesPath = "lib/decision-core/revisions/types.ts";
const validationAssemblyTypesPath = "lib/decision-core/validation-assembly/types.ts";

const publicErrors = [
  ["ERR_DECISION_API_INVALID_JSON", "Request body must be valid JSON.", "400"],
  ["ERR_DECISION_API_REQUEST_REJECTED", "Decision Context request was rejected.", "422"],
  ["ERR_DECISION_API_CONFLICT", "Decision Context revision conflicts with an existing immutable record.", "409"],
  ["ERR_DECISION_API_NOT_FOUND", "Decision Context revision was not found.", "404"],
  ["ERR_DECISION_API_INTERNAL", "Decision Context service failed.", "500"]
] as const;

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function quotedUnion(sourceText: string, typeName: string): string[] {
  const match = sourceText.match(
    typeName === "DecisionContextItemRole"
      ? new RegExp(`export type ${typeName} =([\\s\\S]*?);`)
      : new RegExp(`export type ${typeName} =([\\s\\S]*?)(?=\\n\\nexport interface)`)
  );
  expect(match, `sealed ${typeName} must remain available`).not.toBeNull();
  return [...match![1].matchAll(/"([A-Z_]+)"/g)].map((entry) => entry[1]);
}

function documentedTokens(document: string, heading: string): string[] {
  const match = document.match(new RegExp(`### ${heading}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`));
  expect(match, `documentation section ${heading} must exist`).not.toBeNull();
  return [...new Set([...match![1].matchAll(/`([A-Z_]+)`/g)].map((entry) => entry[1]))];
}

function interfaceFields(sourceText: string, interfaceName: string): string[] {
  const match = sourceText.match(new RegExp(`export interface ${interfaceName}(?: extends [^{]+)? \\{([\\s\\S]*?)\\n\\}`));
  expect(match, `sealed ${interfaceName} must remain available`).not.toBeNull();
  return [...match![1].matchAll(/^  ([A-Za-z][A-Za-z0-9]*):/gm)].map((entry) => entry[1]).sort();
}

function jsonBlockAfter(document: string, marker: string): string {
  const start = document.indexOf(marker);
  expect(start, `documentation marker ${marker} must exist`).toBeGreaterThanOrEqual(0);
  const block = document.slice(start).match(/```json\n([\s\S]*?)\n```/);
  expect(block, `documentation JSON block after ${marker} must exist`).not.toBeNull();
  return block![1];
}

function balancedObjectBody(text: string, open: number): string {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open + 1, index);
    }
  }
  throw new Error("unclosed documented JSON object");
}

function directDocumentedObjectFields(objectBody: string): string[] {
  const lines = objectBody.split("\n");
  const first = lines.find((line) => /^(\s*)"[A-Za-z][A-Za-z0-9]*":/.test(line));
  expect(first, "documented object must contain fields").toBeDefined();
  const indent = first!.match(/^(\s*)/)![1];
  return lines.flatMap((line) => {
    const field = line.match(new RegExp(`^${indent}"([A-Za-z][A-Za-z0-9]*)":`));
    return field ? [field[1]] : [];
  }).sort();
}

function nestedDocumentedObjectBody(objectBody: string, fieldName: string): string {
  const property = `"${fieldName}": {`;
  const propertyIndex = objectBody.indexOf(property);
  expect(propertyIndex, `documented ${fieldName} object must exist`).toBeGreaterThanOrEqual(0);
  return balancedObjectBody(objectBody, objectBody.indexOf("{", propertyIndex));
}

function documentedItemObjectBody(revisionBody: string): string {
  const itemsIndex = revisionBody.indexOf('"items": [');
  expect(itemsIndex, "documented context items array must exist").toBeGreaterThanOrEqual(0);
  return balancedObjectBody(revisionBody, revisionBody.indexOf("{", itemsIndex));
}

function provenanceFieldsByOrigin(sourceText: string): Record<string, string[]> {
  const union = sourceText.match(/export type DecisionContextItemProvenance =([\s\S]*?)(?=\n\nexport interface)/);
  expect(union).not.toBeNull();
  return Object.fromEntries([...union![1].matchAll(/\{\s*origin:\s*"([A-Z_]+)";([^}]*)\}/g)].map((variant) => [
    variant[1],
    ["origin", ...[...variant[2].matchAll(/([A-Za-z][A-Za-z0-9]*):/g)].map((field) => field[1])].sort()
  ]));
}

function documentedProvenanceFieldsByOrigin(document: string): Record<string, string[]> {
  const section = document.match(/### DecisionContextItem provenance variants\n([\s\S]*?)(?=\n### |\n## |$)/);
  expect(section).not.toBeNull();
  return Object.fromEntries([...section![1].matchAll(/^\{ "origin": "([A-Z_]+)".*\}$/gm)].map((variant) => [
    variant[1],
    [...variant[0].matchAll(/"([A-Za-z][A-Za-z0-9]*)":/g)].map((field) => field[1]).sort()
  ]));
}

describe("Local Decision Context API contract v1.0", () => {
  it("freezes the exact two-route public HTTP surface and its five public error mappings", () => {
    expect(existsSync(resolve(process.cwd(), contractPath))).toBe(true);

    const document = source(contractPath);
    const http = source(httpPath);
    const postRoute = source(postRoutePath);
    const getRoute = source(getRoutePath);

    expect(document).toContain("# Local Decision Context API Contract v1.0");
    expect(document).toContain("Status: FROZEN FOR LOCAL FRONTEND INTEGRATION");
    expect(document).toContain("d66762fcc08733e7bdf65b0e793512727ee791f4");
    expect(document).toContain("v1.0.0-decision-runtime-r4-local-http-api");
    expect(document).toContain("v1.0.0-decision-runtime-r5-local-http-e2e");

    const endpointSection = document.match(/## Supported Endpoints\n([\s\S]*?)(?=\n## |$)/);
    expect(endpointSection).not.toBeNull();
    expect([...endpointSection![1].matchAll(/`(POST \/api\/decision-contexts|GET \/api\/decision-contexts\/\{revisionId\})`/g)].map((entry) => entry[1]))
      .toEqual(["POST /api/decision-contexts", "GET /api/decision-contexts/{revisionId}"]);

    expect(postRoute).toMatch(/handleCreateDecisionContextRequest\(request, createLocalDecisionContextHttpApplication\)/);
    expect(getRoute).toMatch(/handleReadDecisionContextRequest\(revisionId, createLocalDecisionContextHttpApplication\)/);
    expect(getRoute).not.toMatch(/revisionId\.trim|revisionId\.replace|revisionId\.to/);

    const ownedCodes = [...new Set(http.match(/ERR_DECISION_API_[A-Z_]+/g) ?? [])].sort();
    expect(ownedCodes).toEqual(publicErrors.map(([code]) => code).sort());
    for (const [code, message, status] of publicErrors) {
      expect(document).toContain(code);
      expect(document).toContain(message);
      expect(http).toContain(message);
      expect(http).toMatch(new RegExp(`errorResponse\\(${status},`));
    }

    expect(http).toContain("Response.json({ success: true, revision }, { status: 201 })");
    expect(http).toContain("return Response.json({ success: true, revision });");
    expect(document).toContain('"success": true');
    expect(document).toContain('"revision": <DecisionContextRevision>');
    expect(document).toContain('"success": false');
    expect(document).toContain('"error": {');
    expect(document).toContain('"code": "<public code>"');
    expect(document).toContain('"message": "<public message>"');
  });

  it("derives the documented Core input and revision representation from the exact sealed type sources", () => {
    const document = source(contractPath);
    const contextTypes = source(contextTypesPath);
    const authorityTypes = source(authorityTypesPath);
    const revisionTypes = source(revisionTypesPath);

    expect(document).toContain("DecisionContextDraftInput");
    expect(document).toContain("DecisionContextRevision");
    expect(document).toContain("sourceStateReferences");
    expect(document).toContain("items");
    expect(document).toContain("previousRevisionId");
    expect(document).toContain("validationInput");
    expect(document).toContain("validationAssembly");
    expect(revisionTypes).toContain('artifactKind: "DECISION_CONTEXT_REVISION"');
    expect(revisionTypes).toContain("previousRevisionId: string | null");

    const roles = quotedUnion(contextTypes, "DecisionContextItemRole").sort();
    expect(documentedTokens(document, "DecisionContextItem roles").sort()).toEqual(roles);

    const provenanceOrigins = quotedUnion(contextTypes, "DecisionContextItemProvenance").sort();
    expect(documentedTokens(document, "DecisionContextItem provenance variants").sort()).toEqual(provenanceOrigins);
    for (const field of ["stateReference", "actorId", "proposalRef", "ruleId"]) {
      expect(contextTypes).toContain(field);
      expect(document).toContain(field);
    }

    const referenceInterface = authorityTypes.match(/export interface AuthoritativeStateReference \{([\s\S]*?)\n\}/);
    expect(referenceInterface).not.toBeNull();
    const referenceFields = [...referenceInterface![1].matchAll(/^  (producerId|authorityContractId|artifactId|locator): string;/gm)].map((entry) => entry[1]).sort();
    expect(referenceFields).toEqual(["artifactId", "authorityContractId", "locator", "producerId"]);
    const referenceSection = document.match(/### AuthoritativeStateReference\n([\s\S]*?)(?=\n### |\n## |$)/);
    expect(referenceSection).not.toBeNull();
    const documentedReferenceFields = [...referenceSection![1].matchAll(/`(producerId|authorityContractId|artifactId|locator)`/g)].map((entry) => entry[1]).sort();
    expect(documentedReferenceFields).toEqual(referenceFields);
  });

  it("freezes exact frontend-visible Core wire field sets without depending on declaration ordering or implementation details", () => {
    const document = source(contractPath);
    const contextTypes = source(contextTypesPath);
    const authorityTypes = source(authorityTypesPath);
    const revisionTypes = source(revisionTypesPath);
    const validationAssemblyTypes = source(validationAssemblyTypesPath);

    const requestBody = jsonBlockAfter(document, "The request body is the JSON representation");
    const referenceBody = jsonBlockAfter(document, "Each source-state reference has exactly these string fields:");
    const revisionBody = jsonBlockAfter(document, "`revision` is the complete sealed `DecisionContextRevision` representation:");
    const contextBody = nestedDocumentedObjectBody(revisionBody, "context");
    const itemBody = documentedItemObjectBody(contextBody);
    const validationInputBody = nestedDocumentedObjectBody(revisionBody, "validationInput");
    const validationAssemblyBody = nestedDocumentedObjectBody(revisionBody, "validationAssembly");

    expect(directDocumentedObjectFields(requestBody)).toEqual(interfaceFields(contextTypes, "DecisionContextDraftInput"));
    expect(directDocumentedObjectFields(referenceBody)).toEqual(interfaceFields(authorityTypes, "AuthoritativeStateReference"));
    expect(directDocumentedObjectFields(contextBody)).toEqual(interfaceFields(contextTypes, "DecisionContextDraft"));
    expect(directDocumentedObjectFields(revisionBody)).toEqual(interfaceFields(revisionTypes, "DecisionContextRevision"));
    expect(directDocumentedObjectFields(validationInputBody)).toEqual(interfaceFields(validationAssemblyTypes, "DecisionContextValidationAssemblyInput"));
    expect(directDocumentedObjectFields(validationAssemblyBody)).toEqual(interfaceFields(validationAssemblyTypes, "DecisionContextValidationAssembly"));

    const itemInputFields = interfaceFields(contextTypes, "DecisionContextItemInput");
    const itemFields = [...new Set([...itemInputFields, ...interfaceFields(contextTypes, "DecisionContextItem")])].sort();
    const documentedItemInput = document.match(/Each item has ([^.]+)\./);
    expect(documentedItemInput).not.toBeNull();
    expect([...documentedItemInput![1].matchAll(/`([A-Za-z][A-Za-z0-9]*)`/g)].map((field) => field[1]).sort()).toEqual(itemInputFields);
    expect(directDocumentedObjectFields(itemBody)).toEqual(itemFields);

    expect(documentedProvenanceFieldsByOrigin(document)).toEqual(provenanceFieldsByOrigin(contextTypes));
  });

  it("preserves the public semantic boundaries, R5 proof, and versioning rule without claiming extra endpoints", () => {
    const document = source(contractPath);
    const nonClaims = [
      "201 CREATED != CURRENT REVISION",
      "200 GET != CURRENT REVISION",
      "PERSISTED != TRUE",
      "PERSISTED != SEMANTIC CORRECTNESS",
      "HTTP SUCCESS != AUTHORITY OF REALITY",
      "404 != GAP",
      "404 != DECISION NEED",
      "ROOT REVISION != HEAD REVISION",
      "ROOT REVISION != LATEST REVISION",
      "ROOT REVISION != ACTIVE REVISION",
      "AUTHORITY RESOLUTION SUCCESS != CONTEXT CONTENT AUTHORITY",
      "AUTHORITY PAYLOAD != DECISION CONTEXT CONTENT",
      "HTTP RESPONSE != DECISION",
      "HTTP RESPONSE != RECOMMENDATION"
    ];
    expect(document).toContain("## Semantic Non-Claims");
    for (const boundary of nonClaims) expect(document).toContain(boundary);
    expect(document).toContain("POST revision\n==\nPostgreSQL stored payload\n==\nGET revision");
    expect(document).toContain("authority rejection -> 422");
    expect(document).toContain("malformed JSON -> 400");
    expect(document).toContain("authority payload-only marker did not enter the Decision revision");
    expect(document).toContain("legacy Career Decision lifecycle tables were not provisioned");
    expect(document).toContain("## Frontend Integration Rules");
    expect(document).toContain("## Out of Scope");
    expect(document).toContain("Any future incompatible change");
    expect(document.match(/^## (?:POST|GET) \/api\/decision-contexts(?:\/\{revisionId\})?$/gm))
      .toEqual(["## POST /api/decision-contexts", "## GET /api/decision-contexts/{revisionId}"]);
  });
});
