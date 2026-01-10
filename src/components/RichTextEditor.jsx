import { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export const RichTextEditor = ({ content, onChange }) => {
  const editorRef = useRef(null);
  
  // Sincronizar contenido inicial
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  const execCmd = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
    handleChange();
  };

  const handleChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rich-editor-container">
      <div className="rich-toolbar">
        {/* FORMATO BÁSICO */}
        <button className="toolbar-btn" onClick={() => execCmd("bold")} title="Negrita"><Bold size={16}/></button>
        <button className="toolbar-btn" onClick={() => execCmd("italic")} title="Cursiva"><Italic size={16}/></button>
        <button className="toolbar-btn" onClick={() => execCmd("underline")} title="Subrayado"><Underline size={16}/></button>
        
        <div style={{width: 1, height: 20, background: '#30363d', margin: '0 5px'}}></div>

        {/* ALINEACIÓN */}
        <button className="toolbar-btn" onClick={() => execCmd("justifyLeft")}><AlignLeft size={16}/></button>
        <button className="toolbar-btn" onClick={() => execCmd("justifyCenter")}><AlignCenter size={16}/></button>
        <button className="toolbar-btn" onClick={() => execCmd("justifyRight")}><AlignRight size={16}/></button>
        
        <div style={{width: 1, height: 20, background: '#30363d', margin: '0 5px'}}></div>
        
        {/* LISTAS */}
        <button className="toolbar-btn" onClick={() => execCmd("insertUnorderedList")}><List size={16}/></button>
      </div>

      <div 
        className="rich-editor-content"
        contentEditable
        ref={editorRef}
        onInput={handleChange}
        onBlur={handleChange}
        spellCheck={false}
      ></div>
    </div>
  );
};