'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import {
  QUESTION_FILES_BUCKET,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_TYPES,
  questionFilePath,
  fileUrlFromPath,
} from '@/lib/storage';
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  CodeIcon,
  ImageIcon,
} from '@/components/icons';

function ToolbarButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection on click
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: active ? 'var(--color-primary-tint)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-fg-2)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ name, setId, initialValue = '' }) {
  const [html, setHtml] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: 'rich-content-image' } }),
    ],
    content: initialValue,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => setHtml(ed.getHTML()),
    editorProps: {
      attributes: { class: 'rich-content rich-editor-content' },
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(file);
        return true;
      },
      handlePaste(view, event) {
        const file = Array.from(event.clipboardData?.files ?? [])[0];
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(file);
        return true;
      },
    },
  });

  // Keep the hidden form field in sync even if onUpdate hasn't fired yet
  // (e.g. initial mount) so an immediate submit still carries the content.
  useEffect(() => {
    if (editor) setHtml(editor.getHTML());
  }, [editor]);

  async function uploadAndInsert(file) {
    if (!editor) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('png, jpg, gif, webp 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('이미지는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const path = questionFilePath(setId, file);
      const supabase = createBrowserSupabase();
      const { error } = await supabase.storage
        .from(QUESTION_FILES_BUCKET)
        .upload(path, file, { contentType: file.type });

      if (error) {
        setUploadError('업로드에 실패했습니다.');
        return;
      }

      editor.chain().focus().setImage({ src: fileUrlFromPath(path) }).run();
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) uploadAndInsert(file);
  }

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: 4,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-2)',
        }}
      >
        <ToolbarButton
          label="굵게"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="기울임"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="목록"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="번호 목록"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="코드 블록"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="이미지 첨부"
          active={false}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={16} />
        </ToolbarButton>
        {uploading && (
          <span style={{ fontSize: 12, color: 'var(--color-fg-3)', marginLeft: 4 }}>
            업로드 중…
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={onPickFile}
        style={{ display: 'none' }}
      />

      {uploadError && (
        <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{uploadError}</div>
      )}

      <div
        style={{
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-2)',
          background: 'var(--color-bg-surface)',
          padding: 'var(--space-3) var(--space-4)',
          minHeight: 200,
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
