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

 const sizeWhitelist = useMemo(() => ['12px','14px','16px','18px','20px','24px','28px','32px'], []);
 const toolbarOptions = useMemo(() => ([
  [{ header: [1, 2, 3, false] }, { size: sizeWhitelist }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'table', 'deleteTable', 'borderThicker', 'borderThinner'],
  ['clean'],
  ['fontBigger', 'fontSmaller', 'fullscreen'],
 ]), [sizeWhitelist]);

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
     icons.fontBigger = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l4-16h-4l-4 16zM14 10h7M14 14h7"/></svg>';
     icons.fontSmaller = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l4-16h-4l-4 16zM14 12h7"/></svg>';
    }
   } catch (_) {}
   // Register size style whitelist
   try {
    const Size = Quill.import('attributors/style/size');
    Size.whitelist = sizeWhitelist;
    Quill.register(Size, true);
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
    // Always save the selection range, even if null (to track when selection is lost)
    if (r) {
     lastRangeRef.current = r;
    }
   });
   
   // Also track selection on text changes to catch when user selects text
   quill.on('editor-change', (eventName, ...args) => {
    if (eventName === 'selection-change') {
     const range = args[0];
     if (range) {
      lastRangeRef.current = range;
     }
    }
   });

   const toolbar = quill.getModule('toolbar');
   if (toolbar) {
    // Helper function to preserve selection and apply formatting
    const applyFormatting = (format, savedRange = null) => {
     try {
      // Use saved range if provided, otherwise try to get current selection
      let range = savedRange || quill.getSelection();
      
      // If no selection, try to restore from saved range
      if (!range && lastRangeRef.current) {
       try {
        quill.setSelection(lastRangeRef.current);
        range = lastRangeRef.current;
       } catch (_) {}
      }
      
      // If still no range, use cursor position
      if (!range) {
       const length = quill.getLength();
       range = { index: Math.max(0, length - 1), length: 0 };
      }
      
      // Apply formatting to the range
      if (range && typeof range.index === 'number') {
       // Get current format to check if it's already applied
       const currentFormat = quill.getFormat(range);
       const isActive = currentFormat[format] === true;
       
       // Toggle formatting: if already active, remove it; otherwise apply it
       quill.format(format, !isActive, 'user');
       
       // Restore selection after formatting
       requestAnimationFrame(() => {
        try {
         if (range && typeof range.index === 'number') {
          quill.setSelection(range.index, range.length || 0, 'user');
          quill.focus();
         }
        } catch (_) {}
       });
      }
     } catch (_) {}
    };
    
    // Add handlers for standard formatting buttons to preserve selection
    toolbar.addHandler('bold', () => applyFormatting('bold'));
    toolbar.addHandler('italic', () => applyFormatting('italic'));
    toolbar.addHandler('underline', () => applyFormatting('underline'));
    toolbar.addHandler('strike', () => applyFormatting('strike'));
    
    toolbar.addHandler('image', handleImage);
    toolbar.addHandler('table', handleTable);
    const stepSize = (dir = 1) => {
     try {
      const range = quill.getSelection() || lastRangeRef.current || { index: 0, length: 0 };
      const fmt = quill.getFormat(range);
      const current = fmt.size && sizeWhitelist.includes(fmt.size) ? fmt.size : '16px';
      const idx = sizeWhitelist.indexOf(current);
      const nextIdx = Math.max(0, Math.min(sizeWhitelist.length - 1, idx + dir));
      const next = sizeWhitelist[nextIdx];
      if (range && typeof range.index === 'number') {
       quill.format('size', next, 'user');
      } else {
       quill.format('size', next, 'user');
      }
     } catch (_) {}
    };
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
    toolbar.addHandler('fontBigger', () => stepSize(1));
    toolbar.addHandler('fontSmaller', () => stepSize(-1));

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
      setIcon('button.ql-fontBigger', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l4-16h-4l-4 16zM14 10h7M14 14h7"/></svg>');
      setIcon('button.ql-fontSmaller', '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l4-16h-4l-4 16zM14 12h7"/></svg>');

      // Apply tooltips/titles for better UX
      const setTitle = (selector, title) => {
       const el = container.querySelector(selector);
       if (el) {
        el.setAttribute('title', title);
        el.setAttribute('aria-label', title);
       }
      };
      // Formatting
      setTitle('button.ql-bold', 'Bold (Ctrl+B)');
      setTitle('button.ql-italic', 'Italic (Ctrl+I)');
      setTitle('button.ql-underline', 'Underline (Ctrl+U)');
      setTitle('button.ql-strike', 'Strikethrough');
      // Colors and background (selects)
      setTitle('select.ql-color', 'Text color');
      setTitle('select.ql-background', 'Background color');
      // Headings and size
      setTitle('select.ql-header', 'Heading level');
      setTitle('select.ql-size', 'Font size');
      // Alignment
      setTitle('select.ql-align', 'Text alignment');
      // Lists and indentation
      setTitle('button.ql-list[value="ordered"]', 'Numbered list');
      setTitle('button.ql-list[value="bullet"]', 'Bulleted list');
      setTitle('button.ql-indent[value="+1"]', 'Increase indent');
      setTitle('button.ql-indent[value="-1"]', 'Decrease indent');
      // Blocks
      setTitle('button.ql-blockquote', 'Blockquote');
      setTitle('button.ql-code-block', 'Code block');
      // Links and media
      setTitle('button.ql-link', 'Insert link');
      setTitle('button.ql-image', 'Insert image');
      // Custom table actions
      setTitle('button.ql-table', 'Insert table');
      setTitle('button.ql-deleteTable', 'Delete table');
      setTitle('button.ql-borderThicker', 'Thicker table borders');
      setTitle('button.ql-borderThinner', 'Thinner table borders');
      // Clean and fullscreen
      setTitle('button.ql-clean', 'Remove formatting');
      setTitle('button.ql-fullscreen', 'Toggle fullscreen');
      // Font size steppers
      setTitle('button.ql-fontBigger', 'Increase font size');
      setTitle('button.ql-fontSmaller', 'Decrease font size');
     }
     // Bind mousedown handlers to capture selection before focus is lost
     // This ensures we can apply formatting to selected text even after clicking toolbar buttons
     const setupFormattingButton = (selector, format) => {
      const btn = container.querySelector(selector);
      if (btn) {
       let savedRange = null;
       
       // Capture selection on mousedown (before focus is lost)
       btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Save current selection before button click
        savedRange = quill.getSelection() || lastRangeRef.current;
       }, true);
       
       // Apply formatting on click with saved selection
       btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Use saved range or current selection
        const rangeToUse = savedRange || quill.getSelection() || lastRangeRef.current;
        applyFormatting(format, rangeToUse);
        savedRange = null; // Reset after use
       }, true);
      }
     };
     
     // Setup formatting buttons with selection preservation
     setupFormattingButton('button.ql-bold', 'bold');
     setupFormattingButton('button.ql-italic', 'italic');
     setupFormattingButton('button.ql-underline', 'underline');
     setupFormattingButton('button.ql-strike', 'strike');
     
     const btnFullscreen = container.querySelector('button.ql-fullscreen');
     if (btnFullscreen) btnFullscreen.onclick = (e) => { e.preventDefault(); handleFullscreen(); };
     const btnDelete = container.querySelector('button.ql-deleteTable');
     if (btnDelete) btnDelete.onclick = (e) => { e.preventDefault(); toolbar.handlers.deleteTable(); };
     // rely on Quill toolbar handler for table to avoid double trigger
     const btnBorderUp = container.querySelector('button.ql-borderThicker');
     if (btnBorderUp) btnBorderUp.onclick = (e) => { e.preventDefault(); adjustTableBorder(1); };
     const btnBorderDown = container.querySelector('button.ql-borderThinner');
     if (btnBorderDown) btnBorderDown.onclick = (e) => { e.preventDefault(); adjustTableBorder(-1); };
     const btnUp = container.querySelector('button.ql-fontBigger');
     if (btnUp) btnUp.onclick = (e) => { e.preventDefault(); toolbar.handlers.fontBigger(); };
     const btnDown = container.querySelector('button.ql-fontSmaller');
     if (btnDown) btnDown.onclick = (e) => { e.preventDefault(); toolbar.handlers.fontSmaller(); };
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
   <div className={isFullscreen ? 'max-w-5xl mx-auto h-full flex flex-col editor-flex-wrap' : ''}>
    <div className={isFullscreen ? 'editor-inner-wrap flex-1 flex flex-col' : ''}>
     <div
      ref={editorRef}
      style={
       isFullscreen
        ? { flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }
        : { minHeight: editorHeight }
      }
     />
     {!isFullscreen && (
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
     )}
    </div>
   </div>
   <style jsx global>{`
    /* Fullscreen container and flex plumbing to enable inner scroll */
    .quill-fullscreen { display: flex; flex-direction: column; height: 100%; }
    .quill-fullscreen .editor-flex-wrap { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .quill-fullscreen .editor-inner-wrap { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    /* Base sizing */
    .ql-container { min-height: ${editorHeight}px; }
    .ql-editor { min-height: ${editorHeight - 42}px; }

    /* Toolbar custom buttons (icons provided via Quill icons map) */

    /* Fullscreen adjustments */
    .quill-fullscreen .ql-toolbar {
     border-bottom: 1px solid #e5e7eb;
     position: sticky;
     top: 0;
     z-index: 10;
     background: #fff;
    }
    .quill-fullscreen .ql-container {
     flex: 1 1 auto;
     display: flex;
     flex-direction: column;
     height: auto !important;
     max-height: none;
     overflow: hidden; /* let editor scroll, not the container */
     min-height: 0 !important;
    }
    .quill-fullscreen .ql-editor {
     flex: 1 1 auto;
     min-height: 0 !important;
     height: auto;
     overflow-y: auto;
     -webkit-overflow-scrolling: touch;
     touch-action: pan-y;
     overscroll-behavior: contain;
    }

    /* Table defaults and resizable cells */
    .ql-editor table { width: 100%; border-collapse: collapse; table-layout: auto; }
    .ql-editor th, .ql-editor td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    .ql-editor th, .ql-editor td { resize: both; overflow: auto; min-width: 60px; min-height: 32px; }
   `}</style>
  </div>
 );
}



