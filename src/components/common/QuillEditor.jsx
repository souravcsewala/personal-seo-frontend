'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function QuillEditor({ value, onChange, placeholder = 'Write your content here...', height = 450, autoFocusEditor = false, preserveSelectionOnValueChange = false }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(height);
  const dragRef = useRef({ dragging: false, startY: 0, startH: height });
  const lastRangeRef = useRef(null);
  
  const adjustTableBorder = useCallback((delta) => {
    const quill = quillRef.current;
    if (!quill) return;
    let range = quill.getSelection();
    if (!range && lastRangeRef.current) {
      try { quill.setSelection(lastRangeRef.current); range = lastRangeRef.current; } catch (_) {}
    }
    let tableEl = null;
    try {
      const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
      let node = domSel && domSel.anchorNode ? (domSel.anchorNode.nodeType === 1 ? domSel.anchorNode : domSel.anchorNode.parentElement) : null;
      while (node && node !== quill.root) {
        if (node.tagName === 'TABLE') { tableEl = node; break; }
        node = node.parentElement;
      }
      if (!tableEl && range) {
        const leaf = quill.getLeaf(range.index);
        node = leaf && leaf[0] && leaf[0].domNode ? leaf[0].domNode : null;
        while (node && node !== quill.root) {
          if (node.tagName === 'TABLE') { tableEl = node; break; }
          node = node.parentElement;
        }
      }
    } catch (_) {}
    if (!tableEl) return;
    const sample = tableEl.querySelector('td,th');
    const current = sample ? parseFloat((sample.style.borderWidth || getComputedStyle(sample).borderTopWidth || '1').toString()) : 1;
    const next = Math.max(0, Math.min(8, (isNaN(current) ? 1 : current) + delta));
    tableEl.querySelectorAll('td,th').forEach((cell) => {
      cell.style.borderWidth = `${next}px`;
      if (!cell.style.borderStyle) cell.style.borderStyle = 'solid';
      if (!cell.style.borderColor) cell.style.borderColor = '#ddd';
    });
    onChange?.(quill.root.innerHTML);
  }, [onChange]);

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
    // No header row; blank cells
    let tbody = '<tbody>' + Array.from({ length: safeRows }).map(() => '<tr>' + Array.from({ length: safeCols }).map(() => '<td style="border:1px solid #ddd;padding:8px"></td>').join('') + '</tr>').join('') + '</tbody>';
    return `<table style="border-collapse:collapse;width:100%;margin:10px 0">${tbody}</table>`;
  };

  const handleTable = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;

    // Determine selection (restore last saved if missing)
    let range = quill.getSelection();
    if (!range && lastRangeRef.current) {
      try { quill.setSelection(lastRangeRef.current); range = lastRangeRef.current; } catch (_) {}
    }
    // Find table element at current selection
    let tableEl = null;
    try {
      const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
      let node = domSel && domSel.anchorNode ? (domSel.anchorNode.nodeType === 1 ? domSel.anchorNode : domSel.anchorNode.parentElement) : null;
      while (node && node !== quill.root) {
        if (node.tagName === 'TABLE') { tableEl = node; break; }
        node = node.parentElement;
      }
      if (!tableEl && range) {
        const leaf = quill.getLeaf(range.index);
        node = leaf && leaf[0] && leaf[0].domNode ? leaf[0].domNode : null;
        while (node && node !== quill.root) {
          if (node.tagName === 'TABLE') { tableEl = node; break; }
          node = node.parentElement;
        }
      }
    } catch (_) {}
    if (tableEl) {
      try {
        tableEl.remove();
        onChange?.(quill.root.innerHTML);
      } catch (_) {}
      return;
    }

    // Insert new table only if user confirms valid rows/cols
    const rowsRaw = typeof window !== 'undefined' ? window.prompt('Number of rows?', '2') : null;
    if (rowsRaw === null) return; // cancelled
    const colsRaw = typeof window !== 'undefined' ? window.prompt('Number of columns?', '3') : null;
    if (colsRaw === null) return; // cancelled
    const r = parseInt(String(rowsRaw).trim(), 10);
    const c = parseInt(String(colsRaw).trim(), 10);
    if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0 || c <= 0) return;
    const html = createTableHtml(r, c);
    const insertAt = (range && typeof range.index === 'number') ? range.index : (quill.getLength() - 1);
    quill.clipboard.dangerouslyPasteHTML(insertAt, html);
  }, [onChange]);

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
    ['link', 'image', 'table', 'deleteTable', 'borderThicker', 'borderThinner'],
    ['clean'],
    ['fullscreen'],
  ]), []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (quillRef.current) return;

    const init = () => {
      const Quill = typeof window !== 'undefined' ? window.Quill : undefined;
      if (!Quill) return false;
      // Provide SVG icons for custom toolbar buttons
      try {
        const icons = Quill.import('ui/icons');
        if (icons) {
          icons.table = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9h18M3 13h18M8 5v14M16 5v14"/></svg>';
          icons.deleteTable = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>';
          icons.fullscreen = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
          icons.borderThicker = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12"/><path d="M12 3v6M9 6h6"/></svg>';
          icons.borderThinner = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12"/><path d="M9 6h6"/></svg>';
        }
      } catch (_) {}
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

      // Avoid stealing focus unless explicitly requested
      try {
        if (!autoFocusEditor) {
          quill.blur();
        } else {
          quill.focus();
        }
      } catch (_) {}

      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        onChange?.(html);
      });
      quill.on('selection-change', (r) => {
        lastRangeRef.current = r || lastRangeRef.current;
      });

      const toolbar = quill.getModule('toolbar');
      if (toolbar) {
        toolbar.addHandler('image', handleImage);
        toolbar.addHandler('table', handleTable);
        toolbar.addHandler('deleteTable', () => {
          // compute table under selection using saved range
          let range = quill.getSelection();
          if (!range && lastRangeRef.current) {
            try { quill.setSelection(lastRangeRef.current); range = lastRangeRef.current; } catch (_) {}
          }
          let tableEl = null;
          try {
            const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
            let node = domSel && domSel.anchorNode ? (domSel.anchorNode.nodeType === 1 ? domSel.anchorNode : domSel.anchorNode.parentElement) : null;
            while (node && node !== quill.root) {
              if (node.tagName === 'TABLE') { tableEl = node; break; }
              node = node.parentElement;
            }
            if (!tableEl && range) {
              const leaf = quill.getLeaf(range.index);
              node = leaf && leaf[0] && leaf[0].domNode ? leaf[0].domNode : null;
              while (node && node !== quill.root) {
                if (node.tagName === 'TABLE') { tableEl = node; break; }
                node = node.parentElement;
              }
            }
          } catch (_) {}
          if (!tableEl) return;
          const ok = typeof window !== 'undefined' ? window.confirm('Delete this table?') : true;
          if (!ok) return;
          try {
            tableEl.remove();
            onChange?.(quill.root.innerHTML);
          } catch (_) {}
        });
        toolbar.addHandler('fullscreen', handleFullscreen);
        toolbar.addHandler('borderThicker', () => adjustTableBorder(1));
        toolbar.addHandler('borderThinner', () => adjustTableBorder(-1));

        // Ensure icons render reliably by directly injecting SVGs into buttons
        try {
          const container = toolbar.container;
          if (container) {
            const setIcon = (selector, svg) => {
              const btn = container.querySelector(selector);
              if (btn) {
                btn.innerHTML = svg;
              }
            };
            setIcon('button.ql-table', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9h18M3 13h18M8 5v14M16 5v14"/></svg>');
            setIcon('button.ql-deleteTable', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>');
            setIcon('button.ql-fullscreen', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>');
            setIcon('button.ql-borderThicker', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12"/><path d="M12 3v6M9 6h6"/></svg>');
            setIcon('button.ql-borderThinner', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12"/><path d="M9 6h6"/></svg>');
          }
          // Bind explicit onclicks to avoid toolbar disabled state issues
          const btnFullscreen = container.querySelector('button.ql-fullscreen');
          if (btnFullscreen) btnFullscreen.onclick = (e) => { e.preventDefault(); handleFullscreen(); };
          const btnDelete = container.querySelector('button.ql-deleteTable');
          if (btnDelete) btnDelete.onclick = (e) => { e.preventDefault(); toolbar.handlers.deleteTable(); };
          // rely on Quill toolbar handler for table to avoid double trigger
          const btnBorderUp = container.querySelector('button.ql-borderThicker');
          if (btnBorderUp) btnBorderUp.onclick = (e) => { e.preventDefault(); adjustTableBorder(1); };
          const btnBorderDown = container.querySelector('button.ql-borderThinner');
          if (btnBorderDown) btnBorderDown.onclick = (e) => { e.preventDefault(); adjustTableBorder(-1); };
        } catch (_) {}
      }

      // Trap Tab key inside editor to prevent page focus jump/scroll
      try {
        quill.keyboard.addBinding({ key: 9 }, function(range, context) {
          quill.insertText(range.index, '\t', 'user');
          quill.setSelection(range.index + 1, 0, 'silent');
          return false; // prevent default
        });
        quill.keyboard.addBinding({ key: 9, shiftKey: true }, function(range, context) {
          // simple behavior: also insert a tab on Shift+Tab
          quill.insertText(range.index, '\t', 'user');
          quill.setSelection(range.index + 1, 0, 'silent');
          return false;
        });
      } catch (_) {}
      return true;
    };

    if (!init()) {
      const id = setInterval(() => {
        if (init()) clearInterval(id);
      }, 100);
      return () => clearInterval(id);
    }

  }, [editorRef, handleFullscreen, handleImage, handleTable, onChange, placeholder, toolbarOptions, value, autoFocusEditor]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML;
    if (typeof value === 'string' && value !== current) {
      const sel = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value);
      if (preserveSelectionOnValueChange && sel) quill.setSelection(sel);
    }
  }, [value, preserveSelectionOnValueChange]);

  // Drag-to-resize handlers (for non-fullscreen)
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const dy = e.clientY - dragRef.current.startY;
      const next = Math.max(240, dragRef.current.startH + dy);
      setEditorHeight(next);
    };
    const onUp = () => {
      if (dragRef.current.dragging) {
        dragRef.current.dragging = false;
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[1000] bg-white p-4 quill-fullscreen' : ''}>
      <div className={isFullscreen ? 'max-w-5xl mx-auto h-full flex flex-col' : ''}>
        <div className={isFullscreen ? 'flex-1 flex flex-col' : ''}>
          <div ref={editorRef} style={{ minHeight: isFullscreen ? 'calc(100% - 48px)' : editorHeight }} />
          <div
            onMouseDown={(e) => {
              dragRef.current.dragging = true;
              dragRef.current.startY = e.clientY;
              dragRef.current.startH = editorHeight;
            }}
            style={{ height: 8, cursor: 'ns-resize' }}
            className="bg-gray-100 hover:bg-gray-200"
            title="Drag to resize editor"
          />
        </div>
      </div>
      <style jsx global>{`
        /* Base sizing */
        .ql-container { min-height: ${editorHeight}px; }
        .ql-editor { min-height: ${editorHeight - 42}px; }

        /* Toolbar custom buttons (icons provided via Quill icons map) */

        /* Fullscreen adjustments */
        .quill-fullscreen .ql-toolbar { border-bottom: 1px solid #e5e7eb; }
        .quill-fullscreen .ql-container { height: auto !important; overflow: auto; }

        /* Table defaults and resizable cells */
        .ql-editor table { width: 100%; border-collapse: collapse; table-layout: auto; }
        .ql-editor th, .ql-editor td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
        .ql-editor th, .ql-editor td { resize: both; overflow: auto; min-width: 60px; min-height: 32px; }
      `}</style>
    </div>
  );
}



