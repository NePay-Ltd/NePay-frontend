import * as React from "react";
import { LegalDocumentRenderer, LegalNode } from "./LegalDocumentRenderer";
import privacyData from "../../lib/constants/legal/privacy.json";

export function PrivacyContent() {
    return <LegalDocumentRenderer content={privacyData as LegalNode[]} />;
}
