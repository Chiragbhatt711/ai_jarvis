import React, { useState } from 'react';

const extractText = (node) => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) return extractText(node.props.children);
  return '';
};

const CodeBlockWithCopy = ({ children }) => {
  const [copied, setCopied] = useState(false);

  const codeText = extractText(children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="relative my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 bg-gray-700 text-white text-xs px-3 py-1 rounded-md hover:bg-gray-600 focus:outline-none shadow"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="bg-gray-900 text-white text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlockWithCopy;
