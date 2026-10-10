/**
 * Compatibility re-export (F-JP-4): the registration client is database infrastructure shared by the
 * HR Decision Loop and the Job Pool routes and lives in lib/persistence. This path keeps its contract.
 */
export { createRegistrationClient } from "../../persistence/registration-client";
