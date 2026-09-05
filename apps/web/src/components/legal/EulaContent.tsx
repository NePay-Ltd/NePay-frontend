import * as React from "react";
import { LegalDocumentRenderer, LegalNode } from "./LegalDocumentRenderer";
import eulaData from "../../lib/constants/legal/eula.json";

export function EulaContent() {
    return <LegalDocumentRenderer content={eulaData as LegalNode[]} />;
}
