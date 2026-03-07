'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import { ColorPicker } from './ColorPicker';

// ── Custom FontWeight extension ──
const FontWeight = Extension.create({
  name: 'fontWeight',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element) => element.style.fontWeight || null,
            renderHTML: (attributes) => {
              if (!attributes.fontWeight) return {};
              return { style: `font-weight: ${attributes.fontWeight}` };
            },
          },
        },
      },
    ];
  },
});

const fontWeightOptions = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: 'normal', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: 'bold', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  defaultColor?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  minHeight = '60px',
  defaultColor = '#333333',
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        listItem: false,
        strike: false,
      }),
      Underline,
      TextStyle,
      Color,
      FontWeight,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-inherit',
        style: `min-height: ${minHeight}; padding: 6px 8px; font-size: 12px; line-height: 1.5;`,
      },
    },
  });

  // Sync external value changes (only if different from current editor content)
  // We use a ref to track the last value we set, avoiding infinite loops
  const lastExternalValue = useRef(value);
  if (editor && value !== lastExternalValue.current) {
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    lastExternalValue.current = value;
  }

  const getCurrentFontWeight = useCallback(() => {
    if (!editor) return 'normal';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontWeight || 'normal';
  }, [editor]);

  const setFontWeight = useCallback(
    (weight: string) => {
      if (!editor) return;
      if (weight === 'normal' || weight === '400') {
        // Remove font weight mark
        editor.chain().focus().setMark('textStyle', { fontWeight: null }).run();
      } else {
        editor.chain().focus().setMark('textStyle', { fontWeight: weight }).run();
      }
    },
    [editor],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
    },
    [editor],
  );

  const getCurrentColor = useCallback(() => {
    if (!editor) return defaultColor;
    const attrs = editor.getAttributes('textStyle');
    return attrs.color || defaultColor;
  }, [editor, defaultColor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-gray-50 flex-wrap">
        {/* Font Weight Dropdown */}
        <select
          value={getCurrentFontWeight()}
          onChange={(e) => setFontWeight(e.target.value)}
          className="h-6 text-[10px] border border-gray-300 rounded px-1 bg-white cursor-pointer outline-none"
          style={{ minWidth: 80 }}
        >
          {fontWeightOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-gray-300 mx-0.5" />

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Italic"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
            editor.isActive('underline')
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Underline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </button>

        {/* Bold (quick toggle) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Bold"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>

        <div className="w-px h-4 bg-gray-300 mx-0.5" />

        {/* Color Picker */}
        <div className="relative">
          <button
            ref={colorBtnRef}
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 transition-colors"
            title="Text Color"
          >
            <div className="flex flex-col items-center gap-0">
              <span className="text-[10px] font-bold leading-none" style={{ color: getCurrentColor() }}>A</span>
              <div className="w-3.5 h-1 rounded-sm" style={{ backgroundColor: getCurrentColor() }} />
            </div>
          </button>
          {showColorPicker && (
            <div className="absolute top-7 left-0 z-50">
              <div className="bg-white rounded-lg shadow-lg border p-2">
                <ColorPicker
                  label=""
                  value={getCurrentColor()}
                  onChange={(color) => {
                    handleColorChange(color);
                    // Don't close - let user pick freely
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="w-full mt-1 text-[10px] text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none"
      />
    </div>
  );
}
