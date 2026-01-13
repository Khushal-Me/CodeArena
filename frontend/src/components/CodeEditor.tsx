import Editor from '@monaco-editor/react';
import type { SupportedLanguage } from '@/types';

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

const languageToMonaco: Record<SupportedLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
};

const CodeEditor = ({
  language,
  value,
  onChange,
  readOnly = false,
  height = '500px',
}: CodeEditorProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <Editor
        height={height}
        language={languageToMonaco[language]}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;
