'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
import { T } from './tokens'

interface Props {
  name: string
  formId: string
  defaultValue?: string
}

export function RichTextEditor({ name, formId, defaultValue = '' }: Props) {
  const [html, setHtml] = useState(defaultValue)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [, setTick] = useState(0)
  const [showLinkBar, setShowLinkBar] = useState(false)
  const [linkInput, setLinkInput] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate({ editor }) {
      setHtml(editor.getHTML())
      setTick(t => t + 1)
    },
    onSelectionUpdate({ editor }) {
      setTick(t => t + 1)
      if (editor.isActive('link')) {
        setLinkInput(editor.getAttributes('link').href ?? '')
        setShowLinkBar(true)
      } else {
        setShowLinkBar(false)
        setLinkInput('')
      }
    },
  })

  const activeBlock =
    editor?.isActive('heading', { level: 2 }) ? 'Heading 2' :
    editor?.isActive('heading', { level: 3 }) ? 'Heading 3' :
    editor?.isActive('heading', { level: 4 }) ? 'Heading 4' :
    editor?.isActive('bulletList')            ? 'Bullet list' :
    editor?.isActive('orderedList')           ? 'Numbered list' :
    editor?.isActive('blockquote')            ? 'Blockquote' :
    editor?.isActive('codeBlock')             ? 'Code block' :
    'Paragraph'

  const activeMarks = [
    editor?.isActive('bold')   && 'Bold',
    editor?.isActive('italic') && 'Italic',
    editor?.isActive('strike') && 'Strike',
    editor?.isActive('code')   && 'Code',
    editor?.isActive('link')   && 'Link',
  ].filter(Boolean) as string[]

  function handleLinkBtn(e: React.MouseEvent) {
    e.preventDefault()
    if (showLinkBar) {
      setShowLinkBar(false)
    } else {
      setLinkInput(editor?.getAttributes('link').href ?? '')
      setShowLinkBar(true)
      editor?.commands.focus()
    }
  }

  function applyLink(e?: React.FormEvent) {
    e?.preventDefault()
    if (!editor) return
    const url = linkInput.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setShowLinkBar(false)
      setLinkInput('')
      return
    }
    const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`
    const { from, to, empty } = editor.state.selection
    if (empty && !editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href })
        .setTextSelection({ from: Math.min(from, to), to: Math.max(from, to) })
        .run()
    }
    setShowLinkBar(false)
    setLinkInput('')
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkBar(false)
    setLinkInput('')
  }

  return (
    <div style={{ border: `1px solid ${T.line2}`, borderRadius: T.radiusSm, overflow: 'hidden', background: T.surface }}>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.line}`, background: T.surfaceAlt,
        padding: '0 8px',
      }}>
        <div style={{ display: 'flex' }}>
          {(['edit', 'preview'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '6px 12px', cursor: 'pointer', border: 'none',
                borderBottom: m === mode ? `2px solid ${T.sienna}` : '2px solid transparent',
                marginBottom: -1,
                background: 'transparent',
                fontFamily: 'var(--sans, system-ui)', fontSize: 12.5, fontWeight: 500,
                color: m === mode ? T.sienna : T.ink3,
                transition: 'color 120ms',
              }}
            >
              {m === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>

        {mode === 'edit' && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingRight: 2 }}>
            <span style={{
              padding: '2px 7px', borderRadius: 4,
              background: T.brassSoft, color: T.ink2,
              fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 500,
            }}>
              {activeBlock}
            </span>
            {activeMarks.map(mark => (
              <span key={mark} style={{
                padding: '2px 6px', borderRadius: 4,
                background: T.siennaSoft, color: T.sienna,
                fontFamily: 'var(--sans, system-ui)', fontSize: 11, fontWeight: 500,
              }}>
                {mark}
              </span>
            ))}
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <>
          {/* ── Toolbar ── */}
          <div style={{
            display: 'flex', gap: 2, padding: '5px 8px',
            borderBottom: `1px solid ${T.line}`, background: T.surfaceAlt,
            flexWrap: 'wrap', alignItems: 'center',
          }}>
            <ToolBtn label="B" title="Bold" bold
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
              active={!!editor?.isActive('bold')} />
            <ToolBtn label="I" title="Italic" italic
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
              active={!!editor?.isActive('italic')} />
            <ToolBtn label="S" title="Strikethrough" strike
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleStrike().run() }}
              active={!!editor?.isActive('strike')} />
            <ToolBtn label="<>" title="Inline code" mono
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleCode().run() }}
              active={!!editor?.isActive('code')} />
            <ToolBtn label="Link" title="Insert / edit link"
              onMouseDown={handleLinkBtn}
              active={!!editor?.isActive('link') || showLinkBar} />

            <Sep />

            <ToolBtn label="H2" title="Heading 2"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run() }}
              active={!!editor?.isActive('heading', { level: 2 })} />
            <ToolBtn label="H3" title="Heading 3"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run() }}
              active={!!editor?.isActive('heading', { level: 3 })} />
            <ToolBtn label="H4" title="Heading 4"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 4 }).run() }}
              active={!!editor?.isActive('heading', { level: 4 })} />

            <Sep />

            <ToolBtn label="• List" title="Bullet list"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
              active={!!editor?.isActive('bulletList')} />
            <ToolBtn label="1. List" title="Numbered list"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
              active={!!editor?.isActive('orderedList')} />

            <Sep />

            <ToolBtn label='" Quote' title="Blockquote"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run() }}
              active={!!editor?.isActive('blockquote')} />
            <ToolBtn label="─ Rule" title="Horizontal rule"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().setHorizontalRule().run() }}
              active={false} />

            <Sep />

            <ToolBtn label="↩ Undo" title="Undo"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().undo().run() }}
              active={false} />
            <ToolBtn label="↪ Redo" title="Redo"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().redo().run() }}
              active={false} />

            <Sep />

            <ToolBtn label="Clear" title="Clear all formatting"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().clearNodes().unsetAllMarks().run() }}
              active={false} />
          </div>

          {/* ── Link bar ── */}
          {showLinkBar && (
            <div
              style={{
                display: 'flex', gap: 6, padding: '5px 10px',
                borderBottom: `1px solid ${T.line}`,
                background: 'rgba(160,74,42,0.05)',
                alignItems: 'center',
              }}
            >
              <span style={{
                fontSize: 11.5, fontWeight: 600, color: T.sienna,
                fontFamily: 'var(--sans, system-ui)', whiteSpace: 'nowrap',
              }}>
                Link URL
              </span>
              <input
                type="text"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                  if (e.key === 'Escape') { e.preventDefault(); setShowLinkBar(false) }
                }}
                placeholder="https://example.com"
                autoFocus
                style={{
                  flex: 1, padding: '3px 8px',
                  border: `1px solid ${T.line2}`, borderRadius: 4,
                  fontSize: 12.5, fontFamily: 'monospace',
                  background: T.surface, color: T.ink, outline: 'none',
                }}
              />
              <LinkActionBtn type="button" onClick={() => applyLink()}>Apply</LinkActionBtn>
              <LinkActionBtn type="button" onClick={removeLink} muted>Remove</LinkActionBtn>
              <LinkActionBtn type="button" onClick={() => setShowLinkBar(false)} muted>Cancel</LinkActionBtn>
            </div>
          )}

          {/* ── Editor area ── */}
          <div style={{ padding: '10px 14px', minHeight: 160 }}>
            <style>{editorStyles}</style>
            <EditorContent editor={editor} />
          </div>
        </>
      )}

      {mode === 'preview' && (
        <>
          <style>{previewStyles}</style>
          <div
            className="rich-preview"
            style={{ padding: '14px 18px', minHeight: 160 }}
            dangerouslySetInnerHTML={{
              __html: html.trim()
                ? html
                : '<p class="rp-empty">Nothing to preview yet…</p>',
            }}
          />
        </>
      )}

      <input type="hidden" name={name} form={formId} value={html} />
    </div>
  )
}

function Sep() {
  return <div style={{ width: 1, background: T.line2, margin: '2px 4px', alignSelf: 'stretch' }} />
}

function ToolBtn({ label, title, onMouseDown, active, bold, italic, strike, mono }: {
  label: string
  title: string
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void
  active: boolean
  bold?: boolean
  italic?: boolean
  strike?: boolean
  mono?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      style={{
        padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
        border: `1px solid ${active ? T.sienna : 'transparent'}`,
        background: active ? T.siennaSoft : 'transparent',
        color: active ? T.sienna : T.ink2,
        fontFamily: mono ? 'monospace' : 'var(--sans, system-ui)',
        fontSize: 12.5,
        fontWeight: bold ? 700 : 500,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: strike ? 'line-through' : 'none',
        lineHeight: 1,
        transition: 'background 120ms, border-color 120ms',
      }}
    >
      {label}
    </button>
  )
}

function LinkActionBtn({ children, type, onClick, muted }: {
  children: React.ReactNode
  type: 'submit' | 'button'
  onClick?: () => void
  muted?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
        fontFamily: 'var(--sans, system-ui)', fontWeight: 500, whiteSpace: 'nowrap',
        border: `1px solid ${muted ? T.line2 : T.sienna}`,
        background: muted ? 'transparent' : T.sienna,
        color: muted ? T.ink2 : '#FFF8EE',
      }}
    >
      {children}
    </button>
  )
}

const editorStyles = `
.tiptap { outline: none; }
.tiptap p { margin: 0 0 8px; font-family: var(--sans, system-ui); font-size: 13.5px; line-height: 1.65; color: #1F1A14; }
.tiptap p:last-child { margin-bottom: 0; }
.tiptap h2 { margin: 14px 0 6px; font-family: var(--serif, Georgia, serif); font-size: 18px; font-weight: 600; color: #1F1A14; }
.tiptap h3 { margin: 12px 0 5px; font-family: var(--serif, Georgia, serif); font-size: 15.5px; font-weight: 600; color: #1F1A14; }
.tiptap h4 { margin: 10px 0 4px; font-family: var(--sans, system-ui); font-size: 13.5px; font-weight: 700; letter-spacing: 0.02em; color: #1F1A14; }
.tiptap ul, .tiptap ol { margin: 0 0 8px; padding-left: 20px; font-family: var(--sans, system-ui); font-size: 13.5px; line-height: 1.65; color: #1F1A14; }
.tiptap li { margin: 2px 0; }
.tiptap blockquote { margin: 8px 0; padding: 6px 12px; border-left: 3px solid #A04A2A; background: rgba(160,74,42,0.06); font-style: italic; color: #4A4036; border-radius: 0 4px 4px 0; }
.tiptap blockquote p { margin: 0; }
.tiptap hr { border: none; border-top: 1px solid rgba(31,26,20,0.15); margin: 14px 0; }
.tiptap code { font-family: monospace; font-size: 12.5px; background: rgba(31,26,20,0.07); padding: 1px 4px; border-radius: 3px; color: #8A3F22; }
.tiptap pre { background: rgba(31,26,20,0.06); border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
.tiptap pre code { background: none; padding: 0; color: inherit; }
.tiptap strong { font-weight: 700; }
.tiptap em { font-style: italic; }
.tiptap s { text-decoration: line-through; opacity: 0.6; }
.tiptap a { color: #2563EB; text-decoration: underline; text-underline-offset: 2px; cursor: text; }
`

const previewStyles = `
.rich-preview p { margin: 0 0 8px; font-family: var(--sans, system-ui); font-size: 13.5px; line-height: 1.65; color: #1F1A14; }
.rich-preview p:last-child { margin-bottom: 0; }
.rich-preview h2 { margin: 14px 0 6px; font-family: var(--serif, Georgia, serif); font-size: 18px; font-weight: 600; color: #1F1A14; }
.rich-preview h3 { margin: 12px 0 5px; font-family: var(--serif, Georgia, serif); font-size: 15.5px; font-weight: 600; color: #1F1A14; }
.rich-preview h4 { margin: 10px 0 4px; font-family: var(--sans, system-ui); font-size: 13.5px; font-weight: 700; letter-spacing: 0.02em; color: #1F1A14; }
.rich-preview ul, .rich-preview ol { margin: 0 0 8px; padding-left: 20px; font-family: var(--sans, system-ui); font-size: 13.5px; line-height: 1.65; color: #1F1A14; }
.rich-preview li { margin: 2px 0; }
.rich-preview blockquote { margin: 8px 0; padding: 6px 12px; border-left: 3px solid #A04A2A; background: rgba(160,74,42,0.06); font-style: italic; color: #4A4036; border-radius: 0 4px 4px 0; }
.rich-preview blockquote p { margin: 0; }
.rich-preview hr { border: none; border-top: 1px solid rgba(31,26,20,0.15); margin: 14px 0; }
.rich-preview code { font-family: monospace; font-size: 12.5px; background: rgba(31,26,20,0.07); padding: 1px 4px; border-radius: 3px; color: #8A3F22; }
.rich-preview pre { background: rgba(31,26,20,0.06); border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
.rich-preview pre code { background: none; padding: 0; color: inherit; }
.rich-preview strong { font-weight: 700; }
.rich-preview em { font-style: italic; }
.rich-preview s { text-decoration: line-through; opacity: 0.6; }
.rich-preview a { color: #2563EB; text-decoration: underline; text-underline-offset: 2px; }
.rich-preview .rp-empty { color: #807563; font-style: italic; font-family: var(--sans, system-ui); font-size: 13.5px; }
`
