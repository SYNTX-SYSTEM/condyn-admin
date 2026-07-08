# CONDYN Career Analysis Protocol v1.0 — Step 15: Encrypted Prompt Registry & Governance Specification

**Spezifikations-Version:** 1.0  
**Architektur-Status:** Implementiert & Verifiziert (TDD — 100% Abdeckung)  
**Datum:** 8. Juli 2026  

---

## 1. Architektonisches Leitbild & Protokoll-Souveränität

Im Rahmen des CONDYN Career Analysis Protocol v1.0 sind Prompts keine statischen Textbausteine im Quellcode und keine unkontrollierten Eingaben. Prompts sind **versionierte, kryptographisch gesicherte Runtime-Artefakte**.

### 1.1 Invarianten der Prompt-Registry (EPR-I)

| Invariante | Formale Definition | Verifikationsregel |
| :--- | :--- | :--- |
| **EPR-I1: Zero-Plaintext Persistence** | In den Datenbank- und Repository-Strukturen (`prompt_versions`) darf niemals Prompt-Klartext gespeichert werden. Es existiert ausschließlich `encrypted_content`. | Jedes Speicher- oder Ladeereignis darf nur Ciphertexte und Checksummen exportieren. |
| **EPR-I2: Kanonischer Ciphertext** | `encrypted_content` folgt zwingend dem kanonischen Format: `v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>`. | Zod-Regex im Schema lehnt jedes abweichende Format ab. |
| **EPR-I3: AES-256-GCM Key Enforcement** | `PROMPT_ENCRYPTION_KEY` muss exakt 32 Byte (Base64-kodiert) umfassen. | Fehlt der Key: `ERR_MISSING_ENCRYPTION_KEY`. Ungültiges Format/Länge: `ERR_INVALID_ENCRYPTION_KEY`. |
| **EPR-I4: SHA-256 Checksum Verification** | Nach jeder Entschlüsselung berechnet die Runtime den SHA-256 Hex-Digest des Klartextes und vergleicht ihn mit `content_checksum`. | Jede Abweichung wirft unverzüglich `ERR_PROMPT_CHECKSUM_MISMATCH`. |
| **EPR-I5: Runtime Governance Sovereignty** | Der `ActivePromptResolver` lädt zur Analyse-Laufzeit ausschließlich Versionen mit dem Status `ACTIVE`. | `DRAFT`, `APPROVED`, `DEPRECATED` oder `ARCHIVED` werden strikt abgewiesen (`ERR_NO_ACTIVE_PROMPT_VERSION`). |

---

## 2. Modul-Architektur (`lib/career/prompts/`)

```
lib/career/prompts/
├── crypto.ts       # AES-256-GCM Ver-/Entschlüsselung & SHA-256 Checksummen
├── schema.ts       # Zod-Verträge (PromptStatus, PromptTemplate, PromptVersion)
├── repository.ts   # PromptRepository Interface & InMemoryPromptRepository
└── resolver.ts     # ActivePromptResolver (Laufzeit-Auflösung & Integritätsprüfung)
```

### 2.1 Cryptographic Core (`crypto.ts`)
- **Key Loader**:
  `getPromptEncryptionKey(explicitKeyBase64?: string): Buffer`
  - Prüft Präsenz und 32-Byte-Länge nach Base64-Dekodierung.
- **Verschlüsselung**:
  `encryptPromptContent(plainText: string, explicitKeyBase64?: string): EncryptedPromptResult`
  - Generiert 12-Byte IV, nutzt `aes-256-gcm` und gibt `{ encryptedContent: "v1:iv:tag:cipher", checksum }` zurück.
- **Entschlüsselung**:
  `decryptPromptContent(canonicalCiphertext: string, explicitKeyBase64?: string): string`
  - Validiert das kanonische Format und entschlüsselt authentifiziert.

### 2.2 Zod Schema & Lifecycle (`schema.ts`)
```ts
export const PromptStatusSchema = z.enum([
  "DRAFT",
  "APPROVED",
  "ACTIVE",
  "DEPRECATED",
  "ARCHIVED"
]);
```

### 2.3 Runtime Resolver (`resolver.ts`)
Der `ActivePromptResolver` ist der einzige Einstiegspunkt für Analyse-Pipelines:
1. Sucht das Template über `getTemplateBySlug(slug)`.
2. Ermittelt die aktive Version (`status === "ACTIVE"`).
3. Entschlüsselt `encrypted_content`.
4. Verifiziert den SHA-256 Digest gegen `content_checksum`.
5. Gibt ein im Speicher existierendes `ResolvedActivePrompt`-Objekt zurück.

---

## 3. Fehlerkatalog (Error Codes)

| Error Code | Auslöser |
| :--- | :--- |
| `ERR_MISSING_ENCRYPTION_KEY` | Die Umgebungsvariable `PROMPT_ENCRYPTION_KEY` ist nicht gesetzt oder leer. |
| `ERR_INVALID_ENCRYPTION_KEY` | Der Schlüssel lässt sich nicht als Base64 dekodieren oder ergibt nicht exakt 32 Byte. |
| `ERR_INVALID_CIPHERTEXT_FORMAT` | Der Ciphertext entspricht nicht dem kanonischen `v1:iv:tag:cipher`-Format. |
| `ERR_PROMPT_TEMPLATE_NOT_FOUND` | Für den angeforderten Slug existiert kein Template. |
| `ERR_NO_ACTIVE_PROMPT_VERSION` | Es existiert keine Version im Status `ACTIVE` (oder nur `DRAFT`/`APPROVED`). |
| `ERR_PROMPT_CHECKSUM_MISMATCH` | Die nach Entschlüsselung berechnete Checksumme weicht von `content_checksum` ab. |

---

## 4. Test- & Verifikationsabdeckung

Die vollständige Suite in `test/career-prompt-registry.test.ts` verifiziert sämtliche Invarianten und Fehlerpfade:
- 100 % isolierte Unit-Tests für `crypto.ts`, `schema.ts`, `repository.ts` und `resolver.ts`.
- Keine Netzwerk- oder LLM-Abhängigkeiten im Registry-Testlauf.
