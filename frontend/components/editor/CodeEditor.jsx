/**
 * Code Editor Component - Monaco Editor
 */

import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../context/store';

const LANGUAGE = 'javascript';
const THEME_MAP = {
  dark: 'vs-dark',
  light: 'light',
  neon: 'vs-dark',
  cyber: 'vs-dark',
};

export function CodeEditor({ 
  value, 
  onChange, 
  height = '400px',
  readOnly = false,
  onMount,
}) {
  const editorRef = useRef(null);
  const { settings } = useStore();

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Настройка Monaco
    monaco.editor.defineTheme('devarena-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#00ff88',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#00ff88',
      },
    });

    monaco.editor.setTheme('devarena-dark');

    // Настройка размера шрифта
    editor.updateOptions({
      fontSize: settings.editorFontSize,
      tabSize: settings.editorTabSize,
      wordWrap: settings.editorWordWrap ? 'on' : 'off',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 16, bottom: 16 },
    });

    if (onMount) {
      onMount(editor, monaco);
    }
  }, [settings, onMount]);

  const handleChange = useCallback((newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  return (
    <div className="rounded-lg overflow-hidden border border-dark-border">
      <Editor
        height={height}
        language={LANGUAGE}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="devarena-dark"
        options={{
          readOnly,
          fontSize: settings.editorFontSize,
          tabSize: settings.editorTabSize,
          wordWrap: settings.editorWordWrap ? 'on' : 'off',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          bracketPairColorization: { enabled: true },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-dark-bg">
            <div className="text-primary animate-pulse">Загрузка редактора...</div>
          </div>
        }
      />
    </div>
  );
}
