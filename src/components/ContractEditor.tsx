import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function ContractEditor({ value, onChange }: any) {

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p>Digite o conteúdo do contrato...</p>",
    onUpdate: ({ editor }) => {
      if (typeof onChange === "function") {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value]);

  if (!editor) return null;

  return (
    <div className="space-y-3">

      {/* TOOLBAR PREMIUM */}
      <div className="flex gap-2 bg-zinc-100 border border-zinc-200 p-2 rounded-xl flex-wrap shadow-sm">
        <button onClick={() => editor.chain().focus().toggleBold().run()}
          className="px-3 py-1 bg-white border rounded-lg text-zinc-700 hover:bg-[#0217ff] hover:text-white transition">
          B
        </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}
          className="px-3 py-1 bg-white border rounded-lg text-zinc-700 hover:bg-[#0217ff] hover:text-white transition">
          I
        </button>

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="px-3 py-1 bg-white border rounded-lg text-zinc-700 hover:bg-[#0217ff] hover:text-white transition">
          H1
        </button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="px-3 py-1 bg-white border rounded-lg text-zinc-700 hover:bg-[#0217ff] hover:text-white transition">
          Lista
        </button>
      </div>

      {/* EDITOR */}
      <div className="border border-zinc-300 p-5 rounded-xl bg-white text-zinc-800 min-h-[300px] leading-relaxed">
        <EditorContent editor={editor} />
      </div>

    </div>
  );
}