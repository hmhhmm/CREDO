// U5 Institutional Credential Issuer — the missing "active verifier" action. Previously
// the university only ever displayed credentials that already existed on a candidate's
// profile (see the old getIssuedCredentials); this is the real action of the university
// issuing one into the ledger, so "credential issuer active" reflects something the
// university actually did, not just a side-effect of a student happening to have a
// verified artifact. Global, same pattern as SkillFeedbackContext — University has no
// backend session to scope this to.
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface CredentialIssuerContextValue {
  isIssued: (universityId: string, artifactId: string) => boolean;
  issueCredential: (universityId: string, artifactId: string) => void;
}

const CredentialIssuerCtx = createContext<CredentialIssuerContextValue | null>(null);

function key(universityId: string, artifactId: string) {
  return `${universityId}::${artifactId}`;
}

export function CredentialIssuerProvider({ children }: { children: ReactNode }) {
  const [issued, setIssued] = useState<Set<string>>(new Set());

  const isIssued = useCallback(
    (universityId: string, artifactId: string) => issued.has(key(universityId, artifactId)),
    [issued]
  );

  const issueCredential = useCallback((universityId: string, artifactId: string) => {
    setIssued((prev) => {
      const next = new Set(prev);
      next.add(key(universityId, artifactId));
      return next;
    });
  }, []);

  return (
    <CredentialIssuerCtx.Provider value={{ isIssued, issueCredential }}>{children}</CredentialIssuerCtx.Provider>
  );
}

export function useCredentialIssuer() {
  const ctx = useContext(CredentialIssuerCtx);
  if (!ctx) throw new Error("useCredentialIssuer must be used within CredentialIssuerProvider");
  return ctx;
}
