'use client';

import { useState, useRef, useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder = "Write your content here..." }) {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [currentHeading, setCurrentHeading] = useState('');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    updateToolbarState();
    handleContentChange();
  };

  const updateToolbarState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    
    // Check for headings
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
      
      if (element.tagName === 'H1') setCurrentHeading('h1');
      else if (element.tagName === 'H2') setCurrentHeading('h2');
      else if (element.tagName === 'H3') setCurrentHeading('h3');
      else setCurrentHeading('');
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 1</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 2</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 1, Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    `;
    execCommand('insertHTML', tableHTML);
  };

  const insertImage = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl) {
      const imageHTML = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      execCommand('insertHTML', imageHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = window.getSelection().toString() || 'Link';
      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      execCommand('insertHTML', linkHTML);
    }
  };

  const insertList = (type) => {
    if (type === 'ordered') {
      execCommand('insertOrderedList');
    } else {
      execCommand('insertUnorderedList');
    }
  };

  const insertQuote = () => {
    const quoteHTML = '<blockquote style="border-left: 4px solid #C96442; margin: 10px 0; padding: 10px 20px; background-color: #f9f9f9; font-style: italic;">Quote text here</blockquote>';
    execCommand('insertHTML', quoteHTML);
  };

  const insertCode = () => {
    const codeHTML = '<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; margin: 10px 0;"><code>Code here</code></pre>';
    execCommand('insertHTML', codeHTML);
  };

  const ToolbarButton = ({ onClick, isActive = false, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer ${
        isActive ? 'bg-[#C96442]/10 text-[#C96442]' : 'text-gray-600 hover:text-gray-900'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const ToolbarSeparator = () => (
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => execCommand('bold')}
          isActive={isBold}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4a1 1 0 011-1h5.5a2.5 2.5 0 010 5H6a1 1 0 000 2h4.5a2.5 2.5 0 010 5H6a1 1 0 01-1-1V4zm2 1v2h3.5a.5.5 0 000-1H7zm0 4v2h4.5a.5.5 0 000-1H7z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('italic')}
          isActive={isItalic}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 2a1 1 0 000 2h1.5l-2 12H6a1 1 0 100 2h8a1 1 0 100-2h-1.5l2-12H14a1 1 0 100-2H8z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('underline')}
          isActive={isUnderline}
          title="Underline (Ctrl+U)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2V6a1 1 0 011-1h6a1 1 0 011 1v7a2 2 0 002-2V5a1 1 0 100-2H3zm11 12a1 1 0 11-2 0 1 1 0 012 0zm-1-1a1 1 0 100 2h1a3 3 0 003-3V8a1 1 0 10-2 0v3a1 1 0 01-1 1h-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        <select
          value={currentHeading}
          onChange={(e) => {
            if (e.target.value) {
              execCommand('formatBlock', e.target.value);
            } else {
              execCommand('formatBlock', 'div');
            }
          }}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C96442]"
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => insertList('unordered')}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => insertList('ordered')}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 000 2h.01a1 1 0 100-2H3zm0 4a1 1 0 000 2h.01a1 1 0 100-2H3zM7 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Insert Elements */}
        <ToolbarButton
          onClick={insertLink}
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={insertImage}
          title="Insert Image"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={insertTable}
          title="Insert Table"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Special Elements */}
        <ToolbarButton
          onClick={insertQuote}
          title="Insert Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9.414 10l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414l2-2zM14 6a1 1 0 00-1.414 0L11.293 7.293a1 1 0 001.414 1.414L14 6z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={insertCode}
          title="Insert Code Block"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onBlur={updateToolbarState}
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        style={{
          lineHeight: '1.6',
          fontSize: '16px'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}


