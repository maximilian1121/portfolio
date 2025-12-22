"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaCopy } from "react-icons/fa";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const match = /language-(\w+)/.exec(className || "");
  const codeString = React.Children.toArray(children)
    .join("")
    .replace(/^\n+/, "")
    .replace(/\n$/, "");

  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => setCopied(false), 2000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [copied]);

  if (!inline && match) {
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(codeString)
        .then(() => setCopied(true))
        .catch(() => {
          const textarea = document.createElement("textarea");
          textarea.value = codeString;
          textarea.style.position = "fixed";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          try {
            document.execCommand("copy");
            setCopied(true);
          } finally {
            document.body.removeChild(textarea);
          }
        });
    };

    return (
      <div className="relative not-prose">
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 cursor-pointer rounded hover:bg-blue-700 focus:outline-none flex items-center gap-1"
        >
          <FaCopy className="inline-block" /> Copy
        </button>
        <span
          className={`absolute top-10 right-2 text-white text-xs px-2 py-1 rounded transition-all duration-300 ${
            copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          Copied to clipboard!
        </span>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="pre"
          codeTagProps={{ style: { fontSize: "1rem" } }}
          customStyle={{
            borderRadius: "0.5rem",
            padding: "1rem",
            margin: 0,
            textIndent: 0,
            whiteSpace: "pre",
            wordBreak: "break-word",
            overflowX: "auto",
            display: "block",
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default CodeBlock;
