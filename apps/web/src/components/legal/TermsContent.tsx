import * as React from "react";
import { LegalDocumentRenderer, LegalNode } from "./LegalDocumentRenderer";
import termsData from "../../lib/constants/legal/terms.json";

export function TermsContent() {
    return <LegalDocumentRenderer content={termsData as LegalNode[]} />;
}
