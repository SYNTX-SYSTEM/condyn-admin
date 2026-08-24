/**
 * Opaque pointer to state governed by a producer-specific authority contract.
 * It deliberately carries no state payload or authority dependency.
 */
export interface AuthoritativeStateReference {
  producerId: string;
  authorityContractId: string;
  artifactId: string;
  locator: string;
}

/** A trusted resolver is bound when the reader is constructed, never supplied per resolution. */
export interface AuthoritativeStateResolver<TPayload = unknown> {
  producerId: string;
  authorityContractId: string;
  resolve(reference: AuthoritativeStateReference): Promise<TPayload>;
}

/**
 * The resolution describes state obtained through one successful trusted resolution.
 * It does not carry authority into another operation.
 */
export interface AuthoritativeStateResolution<TPayload = unknown> {
  reference: AuthoritativeStateReference;
  payload: TPayload;
}

/** A reader can resolve only through authority dependencies fixed at construction. */
export interface BoundAuthoritativeStateReader {
  resolve(reference: AuthoritativeStateReference): Promise<AuthoritativeStateResolution>;
}
