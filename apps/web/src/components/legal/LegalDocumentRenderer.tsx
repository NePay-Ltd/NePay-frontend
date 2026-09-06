import * as React from "react";

export type LegalNode = {
  type: "title" | "subtitle" | "heading" | "paragraph";
  text: string;
};

interface LegalDocumentRendererProps {
  content: LegalNode[];
}

export function LegalDocumentRenderer({ content }: LegalDocumentRendererProps) {
  return (
    <div className="space-y-4">
      {content.map((node, index) => {
        switch (node.type) {
          case "title":
            return (
              <h1 key={index} className="text-2xl font-bold text-ink mt-6 mb-2">
                {node.text}
              </h1>
            );
          case "subtitle":
            return (
              <p key={index} className="text-sm font-medium text-muted whitespace-pre-wrap mb-6">
                {node.text}
              </p>
            );
          case "heading":
            return (
              <h2 key={index} className="text-lg font-bold text-ink mt-8 mb-3">
                {node.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className="text-base text-muted text-justify leading-relaxed whitespace-pre-wrap">
                {node.text}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
