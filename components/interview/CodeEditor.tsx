'use client';

import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';

const GRAMMARS: Record<string, { grammar: Prism.Grammar; lang: string }> = {
  Python: { grammar: Prism.languages.python, lang: 'python' },
  JavaScript: { grammar: Prism.languages.javascript, lang: 'javascript' },
  TypeScript: { grammar: Prism.languages.typescript, lang: 'typescript' },
  Java: { grammar: Prism.languages.java, lang: 'java' },
  'C++': { grammar: Prism.languages.cpp, lang: 'cpp' },
  Go: { grammar: Prism.languages.go, lang: 'go' },
  SQL: { grammar: Prism.languages.sql, lang: 'sql' },
};

/**
 * Syntax-highlighted code editor — a controlled textarea overlaid with Prism
 * highlighting (via react-simple-code-editor). Lightweight + SSR-safe; tokens
 * are themed in globals.css. Tab indents (handled by the editor).
 */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly,
  language = 'Python',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  language?: string;
}) {
  const g = GRAMMARS[language] ?? GRAMMARS.Python;
  const highlight = (code: string) => {
    try {
      return Prism.highlight(code, g.grammar, g.lang);
    } catch {
      return code;
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--line-strong)',
        borderRadius: 'var(--r-sm)',
        background: 'var(--card-2)',
        maxHeight: 420,
        overflow: 'auto',
      }}
    >
      <Editor
        value={value}
        onValueChange={readOnly ? () => {} : onChange}
        highlight={highlight}
        padding={16}
        tabSize={2}
        insertSpaces
        placeholder={placeholder}
        textareaClassName="code-ta"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          lineHeight: 1.65,
          minHeight: 280,
          color: 'var(--ink)',
        }}
      />
    </div>
  );
}
