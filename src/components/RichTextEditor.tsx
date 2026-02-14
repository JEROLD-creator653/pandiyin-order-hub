import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  readOnly?: boolean;
  className?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Enter formatted text...',
  label,
  readOnly = false,
  className = ''
}: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'header', 'list', 'align', 'size', 'color', 'background'
  ];

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
        </Label>
      )}
      <div className="bg-white rounded-md border border-input overflow-hidden">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={readOnly ? {} : modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          className="prose-editor"
        />
      </div>
      <style>{`
        .prose-editor {
          min-height: 250px;
        }
        .prose-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid var(--border);
          background-color: #f5f5f5;
        }
        .prose-editor .ql-container {
          border: none;
          font-size: 16px;
        }
        .prose-editor .ql-editor {
          min-height: 200px;
          padding: 12px 16px;
        }
        .prose-editor .ql-editor.ql-blank::before {
          color: #a0aec0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
