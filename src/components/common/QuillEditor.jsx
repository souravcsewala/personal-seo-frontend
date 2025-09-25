'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function QuillEditor({ value, onChange, placeholder = 'Write your content here...', height = 450 }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleImage = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const url = typeof window !== 'undefined' ? window.prompt('Enter image URL:') : '';
    if (!url) return;
    const range = quill.getSelection(true);
    quill.insertEmbed(range?.index || 0, 'image', url, 'user');
  }, []);

  const createTableHtml = (rows, cols) => {
    const safeRows = Math.max(1, Math.min(10, Number(rows) || 0));
    const safeCols = Math.max(1, Math.min(10, Number(cols) || 0));
    let thead = '<thead><tr>' + Array.from({ length: safeCols }).map(() => '<th style="border:1px solid #ddd;padding:8px;background:#f8f8f8">Header</th>').join('') + '</tr></thead>';
    let tbody = '<tbody>' + Array.from({ length: safeRows }).map(() => '<tr>' + Array.from({ length: safeCols }).map(() => '<td style="border:1px solid #ddd;padding:8px">Cell</td>').join('') + '</tr>').join('') + '</tbody>';
    return `<table style="border-collapse:collapse;width:100%;margin:10px 0">${thead}${tbody}</table>`;
  };

  const handleTable = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const rows = typeof window !== 'undefined' ? window.prompt('Number of rows?', '2') : '2';
    const cols = typeof window !== 'undefined' ? window.prompt('Number of columns?', '3') : '3';
    const html = createTableHtml(rows, cols);
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range?.index || 0, html);
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const toolbarOptions = useMemo(() => ([
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'table'],
    ['clean'],
    ['fullscreen'],
  ]), []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (quillRef.current) return;

    const init = () => {
      const Quill = typeof window !== 'undefined' ? window.Quill : undefined;
      if (!Quill) return false;
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          syntax: true,
          toolbar: toolbarOptions,
          history: { delay: 1000, maxStack: 200, userOnly: true },
          clipboard: { matchVisual: true },
        },
      });

      quillRef.current = quill;

      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        onChange?.(html);
      });

      const toolbar = quill.getModule('toolbar');
      if (toolbar) {
        toolbar.addHandler('image', handleImage);
        toolbar.addHandler('table', handleTable);
        toolbar.addHandler('fullscreen', handleFullscreen);
      }
      return true;
    };

    if (!init()) {
      const id = setInterval(() => {
        if (init()) clearInterval(id);
      }, 100);
      return () => clearInterval(id);
    }

  }, [editorRef, handleFullscreen, handleImage, handleTable, onChange, placeholder, toolbarOptions, value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML;
    if (typeof value === 'string' && value !== current) {
      const sel = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value);
      if (sel) quill.setSelection(sel);
    }
  }, [value]);

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[1000] bg-white p-4' : ''}>
      <div className={isFullscreen ? 'max-w-5xl mx-auto h-full flex flex-col' : ''}>
        <div className={isFullscreen ? 'flex-1 flex flex-col' : ''}>
          <div ref={editorRef} style={{ minHeight: isFullscreen ? 'calc(100% - 42px)' : height }} />
        </div>
      </div>
      <style jsx global>{`
        .ql-container { min-height: ${height}px; }
        .ql-toolbar button.ql-fullscreen::after { content: '\u2922'; font-size: 14px; }
        .ql-toolbar button.ql-table::after { content: '\u25A6'; font-size: 14px; }
      `}</style>
    </div>
  );
}



