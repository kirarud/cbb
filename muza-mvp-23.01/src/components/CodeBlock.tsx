
import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-950/80 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs font-mono text-cyan-400 lowercase">{language}</span>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};