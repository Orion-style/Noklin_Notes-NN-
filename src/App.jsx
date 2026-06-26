import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Folder, FolderOpen, FileText, Cpu, Terminal, Layers, Link, ShieldAlert, Check, HelpCircle, ChevronLeft, ChevronRight, Moon, LogOut, Bold, Italic, Highlighter, Heading1, Heading2, CheckSquare, Code, FilePlus, FolderPlus, Compass, Database, Copy, CornerUpRight, Search, Bookmark, Clipboard, Eye, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "./components/CustomCursor";
import InteractiveBackground from "./components/InteractiveBackground";
import OnboardingWidget from "./components/OnboardingWidget";

// Build a nested directory tree from a flat array of relative file paths
function buildFileTree(files) {
  const root = { name: "root", type: "folder", path: "", children: [] };
  
  files.forEach(file => {
    const normalizedFile = file.replace(/\\/g, "/");
    const parts = normalizedFile.split("/");
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      
      const isLast = i === parts.length - 1;
      
      if (isLast) {
        current.children.push({
          name: part,
          type: "file",
          path: file
        });
      } else {
        let folder = current.children.find(child => child.type === "folder" && child.name === part);
        if (!folder) {
          const folderPath = parts.slice(0, i + 1).join("/");
          folder = {
            name: part,
            type: "folder",
            path: folderPath,
            children: []
          };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  });

  const sortTree = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "ru");
      });
      node.children.forEach(sortTree);
    }
  };
  
  sortTree(root);
  return root;
}

// Recursive Tree Node Renderer
function FileTreeNode({ 
  node, 
  depth, 
  selectedFile, 
  onSelectFile, 
  expandedFolders, 
  onToggleFolder, 
  onDragStart, 
  onDragOver, 
  onDrop,
  sidebarCollapsed,
  showGlobalTooltip,
  hideGlobalTooltip,
  onCreateFile,
  onContextMenu
}) {
  const isSelected = selectedFile === node.path;
  const isNested = depth > 0;
  
  if (node.type === "file") {
    const fileNameOnly = node.name;
    return (
      <button
        draggable
        onDragStart={(e) => onDragStart(e, node.path)}
        onClick={() => onSelectFile(node.path)}
        onContextMenu={(e) => onContextMenu(e, node)}
        onMouseEnter={(e) => {
          if (sidebarCollapsed && showGlobalTooltip) {
            showGlobalTooltip(e, fileNameOnly, isSelected ? "green" : "purple");
          }
        }}
        onMouseLeave={hideGlobalTooltip}
        className={`magnetic-target rounded transition-all flex items-center cursor-none border shrink-0 select-none ${
          sidebarCollapsed 
            ? isNested
              ? "w-7 h-7 justify-center ml-1"
              : "w-8 h-8 justify-center ml-1.5" 
            : "w-[calc(100%-8px)] text-left py-1.5 gap-2 text-xs"
        } ${
          isSelected
            ? "bg-cyber-green/10 border-cyber-green text-cyber-green shadow-[0_0_10px_rgba(0,255,102,0.2)]"
            : "bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-cyber-purple/5"
        }`}
        style={{ paddingLeft: sidebarCollapsed ? undefined : `${depth * 12 + 12}px` }}
      >
        <FileText className={`shrink-0 ${sidebarCollapsed ? (isNested ? "w-4 h-4" : "w-4.5 h-4.5") : "w-3.5 h-3.5"} ${isSelected ? "text-cyber-green" : "text-cyber-purple"}`} />
        {!sidebarCollapsed && <span className="truncate font-mono">{node.name}</span>}
      </button>
    );
  }

  const isExpanded = !!expandedFolders[node.path];
  const isCollapsed = !isExpanded;
  const FolderIcon = isCollapsed ? Folder : FolderOpen;

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => onDragOver(e)}
        onDrop={(e) => onDrop(e, node.path)}
        onClick={() => onToggleFolder(node.path)}
        onContextMenu={(e) => onContextMenu(e, node)}
        onMouseEnter={(e) => {
          if (sidebarCollapsed && showGlobalTooltip) {
            showGlobalTooltip(e, `Папка: ${node.name}`, "green");
          }
        }}
        onMouseLeave={hideGlobalTooltip}
        className={`magnetic-target rounded transition-all flex items-center cursor-none group border border-transparent select-none shrink-0 ${
          sidebarCollapsed 
            ? isNested
              ? "w-7 h-7 justify-center ml-1 hover:border-cyber-purple/15 hover:bg-cyber-purple/5"
              : "w-8 h-8 justify-center ml-1.5 hover:border-cyber-purple/15 hover:bg-cyber-purple/5" 
            : "w-[calc(100%-8px)] py-1.5 justify-between text-xs text-gray-400 hover:text-gray-200 hover:bg-cyber-purple/5 hover:border-cyber-purple/10"
        }`}
        style={{ paddingLeft: sidebarCollapsed ? undefined : `${depth * 12 + 12}px` }}
      >
        <div className={`flex items-center min-w-0 ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
          <FolderIcon className={`text-cyber-green shrink-0 ${sidebarCollapsed ? (isNested ? "w-4 h-4" : "w-4.5 h-4.5") : "w-3.5 h-3.5"}`} />
          {!sidebarCollapsed && <span className="font-mono font-bold truncate">{node.name}</span>}
        </div>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFile(node.path);
              }}
              className="magnetic-target p-0.5 rounded border border-transparent hover:border-cyber-green/45 hover:bg-cyber-green/10 text-cyber-green transition-all opacity-0 group-hover:opacity-100 cursor-none flex items-center justify-center"
              title="Создать файл в этой папке"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-cyber-purple bg-cyber-purple/5 border border-cyber-purple/15 px-1.5 rounded font-mono opacity-60 group-hover:opacity-100 transition-opacity">
              {node.children.filter(c => c.type === "file").length}
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && node.children && (
        <div className={sidebarCollapsed ? "space-y-1.5 py-1 border-l border-cyber-purple/10 ml-3.5" : "space-y-1"}>
          {node.children.map((child, idx) => (
            <FileTreeNode
              key={idx}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              sidebarCollapsed={sidebarCollapsed}
              showGlobalTooltip={showGlobalTooltip}
              hideGlobalTooltip={hideGlobalTooltip}
              onCreateFile={onCreateFile}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [vaultPath, setVaultPath] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const shouldShowConnection = !connected || showConnection;
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("cyber_onboarding_done") !== "true";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isSleeping, setIsSleeping] = useState(false);
  const [tooltip, setTooltip] = useState({ text: "", x: 0, y: 0, theme: "purple", visible: false });
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [savingState, setSavingState] = useState("saved"); // "saved", "saving", "error"
  const saveTimeoutRef = React.useRef(null);
  const [editMode, setEditMode] = useState("preview");
  const [resolvedImageUrls, setResolvedImageUrls] = useState({});
  const resolvedRef = React.useRef({});
  const [highlightColor, setHighlightColor] = useState("green");
  const [zoomPercent, setZoomPercent] = useState(() => {
    const saved = localStorage.getItem("cyber_zoom");
    return saved ? parseInt(saved) : 100;
  });
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    node: null
  });
  const textareaRef = React.useRef(null);

  const editTools = [
    { id: "bold", label: "Жирный текст", desc: "Сделать выделенный текст жирным", shortcut: "Ctrl + B", icon: Bold },
    { id: "italic", label: "Курсивный текст", desc: "Сделать выделенный текст курсивным", shortcut: "Ctrl + I", icon: Italic },
    { id: "highlight", label: "Подсветка маркером", desc: "Выделить текст фоновым маркером", shortcut: "Ctrl + H", icon: Highlighter, hasSettings: true },
    { id: "h1", label: "Заголовок H1", desc: "Превратить строку в заголовок H1", shortcut: "Ctrl + 1", icon: Heading1 },
    { id: "h2", label: "Заголовок H2", desc: "Превратить строку в заголовок H2", shortcut: "Ctrl + 2", icon: Heading2 },
    { id: "checklist", label: "Список задач", desc: "Создать элемент списка задач", shortcut: "Ctrl + L", icon: CheckSquare },
    { id: "code", label: "Встроенный код", desc: "Оформить как программный код", shortcut: "Ctrl + /", icon: Code }
  ];

  const applyEditTool = (toolType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    // Helper to find if the selection (or its immediate surroundings) is wrapped in formatting tags
    const getWrappedRange = (prefixes, suffixes) => {
      // Check if selection itself is wrapped
      for (let i = 0; i < prefixes.length; i++) {
        const p = prefixes[i];
        const s = suffixes[i];
        if (selectedText.startsWith(p) && selectedText.endsWith(s)) {
          return {
            rangeStart: start,
            rangeEnd: end,
            cleanText: selectedText.substring(p.length, selectedText.length - s.length),
            matchedIndex: i
          };
        }
      }
      // Check if surroundings are wrapped
      for (let i = 0; i < prefixes.length; i++) {
        const p = prefixes[i];
        const s = suffixes[i];
        if (start >= p.length && end <= text.length - s.length) {
          if (text.substring(start - p.length, start) === p && text.substring(end, end + s.length) === s) {
            return {
              rangeStart: start - p.length,
              rangeEnd: end + s.length,
              cleanText: selectedText,
              matchedIndex: i
            };
          }
        }
      }
      return null;
    };

    let replacement = "";
    let cursorOffsetStart = 0;
    let cursorOffsetEnd = 0;

    switch (toolType) {
      case "bold": {
        const boldPrefixes = ["**", "__"];
        const boldSuffixes = ["**", "__"];
        const wrapped = getWrappedRange(boldPrefixes, boldSuffixes);
        if (wrapped) {
          const beforeText = text.substring(0, wrapped.rangeStart);
          const afterText = text.substring(wrapped.rangeEnd);
          handleContentChange(beforeText + wrapped.cleanText + afterText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(wrapped.rangeStart, wrapped.rangeStart + wrapped.cleanText.length);
          }, 50);
          return;
        } else {
          replacement = `**${selectedText}**`;
          cursorOffsetStart = 2;
          cursorOffsetEnd = 2;
        }
        break;
      }
      case "italic": {
        const italicPrefixes = ["*", "_"];
        const italicSuffixes = ["*", "_"];
        const wrapped = getWrappedRange(italicPrefixes, italicSuffixes);
        if (wrapped) {
          const beforeText = text.substring(0, wrapped.rangeStart);
          const afterText = text.substring(wrapped.rangeEnd);
          handleContentChange(beforeText + wrapped.cleanText + afterText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(wrapped.rangeStart, wrapped.rangeStart + wrapped.cleanText.length);
          }, 50);
          return;
        } else {
          replacement = `*${selectedText}*`;
          cursorOffsetStart = 1;
          cursorOffsetEnd = 1;
        }
        break;
      }
      case "highlight": {
        const highlightPrefixes = ["==***", "==___", "==**", "==__", "==*", "==_", "=="];
        const highlightSuffixes = ["***==", "___==", "**==", "__==", "*==", "_==", "=="];
        const colorNames = ["purple", "purple", "pink", "pink", "blue", "blue", "green"];
        
        const wrapped = getWrappedRange(highlightPrefixes, highlightSuffixes);
        
        let targetPrefix = "==";
        let targetSuffix = "==";
        let targetOffset = 2;
        if (highlightColor === "purple") {
          targetPrefix = "==***";
          targetSuffix = "***==";
          targetOffset = 5;
        } else if (highlightColor === "pink") {
          targetPrefix = "==**";
          targetSuffix = "**==";
          targetOffset = 4;
        } else if (highlightColor === "blue") {
          targetPrefix = "==*";
          targetSuffix = "*==";
          targetOffset = 3;
        }

        if (wrapped) {
          const wrappedColor = colorNames[wrapped.matchedIndex];
          if (wrappedColor === highlightColor) {
            // Toggle off if the color is the same
            const beforeText = text.substring(0, wrapped.rangeStart);
            const afterText = text.substring(wrapped.rangeEnd);
            handleContentChange(beforeText + wrapped.cleanText + afterText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(wrapped.rangeStart, wrapped.rangeStart + wrapped.cleanText.length);
            }, 50);
            return;
          } else {
            // Change highlight color
            const beforeText = text.substring(0, wrapped.rangeStart);
            const afterText = text.substring(wrapped.rangeEnd);
            replacement = `${targetPrefix}${wrapped.cleanText}${targetSuffix}`;
            handleContentChange(beforeText + replacement + afterText);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(wrapped.rangeStart + targetOffset, wrapped.rangeStart + targetOffset + wrapped.cleanText.length);
            }, 50);
            return;
          }
        } else {
          // Apply new highlight
          replacement = `${targetPrefix}${selectedText}${targetSuffix}`;
          cursorOffsetStart = targetOffset;
          cursorOffsetEnd = targetOffset;
        }
        break;
      }
      case "h1": {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = text.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
        const lineText = text.substring(lineStart, actualLineEnd);
        
        if (lineText.startsWith("# ")) {
          const updatedLine = lineText.substring(2);
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart + updatedLine.length);
          }, 50);
          return;
        } else {
          const updatedLine = `# ${lineText}`;
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart + 2, lineStart + updatedLine.length);
          }, 50);
          return;
        }
      }
      case "h2": {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = text.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
        const lineText = text.substring(lineStart, actualLineEnd);
        
        if (lineText.startsWith("## ")) {
          const updatedLine = lineText.substring(3);
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart + updatedLine.length);
          }, 50);
          return;
        } else {
          const updatedLine = `## ${lineText}`;
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart + 3, lineStart + updatedLine.length);
          }, 50);
          return;
        }
      }
      case "checklist": {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = text.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
        const lineText = text.substring(lineStart, actualLineEnd);
        
        if (lineText.startsWith("- [ ] ")) {
          const updatedLine = lineText.substring(6);
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart + updatedLine.length);
          }, 50);
          return;
        } else {
          const updatedLine = `- [ ] ${lineText}`;
          const before = text.substring(0, lineStart);
          const after = text.substring(actualLineEnd);
          handleContentChange(before + updatedLine + after);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart + 6, lineStart + updatedLine.length);
          }, 50);
          return;
        }
      }
      case "code": {
        const codePrefixes = ["`"];
        const codeSuffixes = ["`"];
        const wrapped = getWrappedRange(codePrefixes, codeSuffixes);
        if (wrapped) {
          const beforeText = text.substring(0, wrapped.rangeStart);
          const afterText = text.substring(wrapped.rangeEnd);
          handleContentChange(beforeText + wrapped.cleanText + afterText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(wrapped.rangeStart, wrapped.rangeStart + wrapped.cleanText.length);
          }, 50);
          return;
        } else {
          replacement = `\`${selectedText}\``;
          cursorOffsetStart = 1;
          cursorOffsetEnd = 1;
        }
        break;
      }
      default:
        return;
    }

    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);
    
    handleContentChange(beforeText + replacement + afterText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffsetStart, start + cursorOffsetStart + selectedText.length);
    }, 50);
  };

  const handleEditorKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      const code = e.code;
      
      let tool = null;
      if (key === "b" || code === "KeyB") tool = "bold";
      else if (key === "i" || code === "KeyI") tool = "italic";
      else if (key === "h" || code === "KeyH") tool = "highlight";
      else if (key === "1" || code === "Digit1") tool = "h1";
      else if (key === "2" || code === "Digit2") tool = "h2";
      else if (key === "l" || code === "KeyL") tool = "checklist";
      else if (key === "/" || code === "Slash") tool = "code";

      if (tool) {
        e.preventDefault();
        applyEditTool(tool);
      }
    }
  };

  React.useEffect(() => {
    resolvedRef.current = resolvedImageUrls;
  }, [resolvedImageUrls]);

  React.useEffect(() => {
    if (!selectedFile) {
      setSelectedFileContent("");
      return;
    }

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri && connected && vaultPath) {
      const loadContent = async () => {
        try {
          const content = await invoke("read_file_content", { 
            vaultPath: vaultPath, 
            relPath: selectedFile 
          });
          setSelectedFileContent(content);
          setSavingState("saved");
        } catch (err) {
          console.error(err);
          setSelectedFileContent(`Error loading file: ${err}`);
        }
      };
      loadContent();
    } else {
      // Demo mode fallback contents
      const demoContents = {
        "Начало работы.md": "# Начало работы\n\nДобро пожаловать в **Cyber-Notes**! Это ваша первая заметка.\n\nЗдесь вы можете делать записи в формате Markdown. Все ваши изменения сохраняются локально.\n\n- Быстро\n- Локально\n- Безопасно",
        "Идеи проектов.md": "# Идеи проектов\n\n1. Разработать ИИ-помощника для IDE.\n2. Создать 3D-визуализатор структуры Obsidian vault.\n3. Сделать оффлайн-переводчик на базе Wasm.",
        "Список задач.md": "# Список задач\n\n- [x] Создать проект Cyber-Notes\n- [ ] Настроить кастомный курсор\n- [ ] Добавить чтение содержимого файлов\n- [ ] Реализовать Markdown редактор",
        "Черновики.md": "# Черновики\n\nРаздел для временных записей и мыслей.\n\n*Всё, что написано здесь, сохраняется только до закрытия вкладки (в демо-режиме).*"
      };
      setSelectedFileContent(demoContents[selectedFile] || `# ${selectedFile.split('/').pop().replace('.md', '')}\n\n[Демо-режим] Содержимое файла...`);
      setSavingState("saved");
    }
  }, [selectedFile, connected, vaultPath]);

  // Resolve Obsidian-style wiki attachments asynchronously
  React.useEffect(() => {
    if (!selectedFileContent) return;

    const regex = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    let match;
    const imagesToResolve = [];
    
    while ((match = regex.exec(selectedFileContent)) !== null) {
      const imageName = match[1].trim();
      if (!resolvedRef.current[imageName] && !imagesToResolve.includes(imageName)) {
        imagesToResolve.push(imageName);
      }
    }

    if (imagesToResolve.length === 0) return;

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri && connected && vaultPath) {
      const resolveImages = async () => {
        for (const imgName of imagesToResolve) {
          try {
            const dataUrl = await invoke("read_image_base64", {
              vaultPath: vaultPath,
              filename: imgName
            });
            setResolvedImageUrls(prev => ({
              ...prev,
              [imgName]: dataUrl
            }));
          } catch (err) {
            console.error(`Failed to resolve image ${imgName}:`, err);
            setResolvedImageUrls(prev => ({
              ...prev,
              [imgName]: "failed"
            }));
          }
        }
      };
      resolveImages();
    } else {
      // Demo mode fallback images (e.g. Unsplash placeholders)
      imagesToResolve.forEach(imgName => {
        setResolvedImageUrls(prev => ({
          ...prev,
          [imgName]: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop"
        }));
      });
    }
  }, [selectedFileContent, connected, vaultPath]);

  const renderWikiImage = (imgName, widthVal, key) => {
    const url = resolvedImageUrls[imgName];
    const widthStyle = widthVal ? { width: `${widthVal}px` } : { maxWidth: "100%", maxHeight: "360px" };

    if (!url) {
      return (
        <div key={key} style={widthStyle} className="my-3 border border-cyber-purple/20 bg-cyber-purple/5 rounded p-4 flex flex-col items-center justify-center gap-2 animate-pulse h-40">
          <span className="w-5 h-5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-cyber-purple font-mono uppercase tracking-wider">RESOLVING ATTACHMENT...</span>
        </div>
      );
    }

    if (url === "failed") {
      return (
        <div key={key} style={widthStyle} className="my-3 border border-red-500/20 bg-red-950/15 rounded p-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div className="font-mono">
            <div className="text-[10px] text-red-400 font-bold uppercase">IMAGE RESOLVE FAILURE</div>
            <div className="text-[9px] text-gray-500 truncate">{imgName}</div>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="my-3 flex flex-col items-center group relative overflow-hidden rounded border border-cyber-purple/10 bg-[#0e091a]/40 p-2 shadow-lg transition-all hover:border-cyber-purple/35 max-w-full">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity" />

        <img
          src={url}
          alt={imgName}
          style={widthStyle}
          className="rounded object-contain select-none max-w-full transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <div className="text-[9px] text-gray-500 font-mono mt-1.5 uppercase tracking-wide truncate max-w-full px-1">
          {imgName}
        </div>
      </div>
    );
  };

  const parseInlineMarkdown = (text) => {
    if (!text) return "";
    
    let html = text;

    // 1. Process wiki images to custom tags
    html = html.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (match, name, width) => {
      const w = width ? ` width="${width.trim()}"` : '';
      return `<wiki-image name="${name.trim()}"${w}></wiki-image>`;
    });

    // 2. Process Highlights (Obsidian compatible, styled as colored markers)
    // Purple highlight: ==***text***==
    html = html.replace(/==\*\*\*([^*=]+)\*\*\*==/g, '<mark-purple>$1</mark-purple>');
    html = html.replace(/==___([^_=]+)___==/g, '<mark-purple>$1</mark-purple>');

    // Pink highlight: ==**text**==
    html = html.replace(/==\*\*([^*=]+)\*\*==/g, '<mark-pink>$1</mark-pink>');
    html = html.replace(/==__([^_=]+)__==/g, '<mark-pink>$1</mark-pink>');

    // Blue highlight: ==*text*==
    html = html.replace(/==\*([^*=]+)\*==/g, '<mark-blue>$1</mark-blue>');
    html = html.replace(/==_([^_=]+)_==/g, '<mark-blue>$1</mark-blue>');

    // Standard green highlight: ==text==
    html = html.replace(/==([^=]+)==/g, '<mark-green>$1</mark-green>');

    // 3. Process Bold Italic (***text*** or ___text___ or **_text_** or __*text*__)
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*_(.+?)_\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__\*(.+?)\*__/g, '<strong><em>$1</em></strong>');

    // 4. Process Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 5. Process Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // 6. Process Inline Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Parse HTML string to React elements
    const regex = /(<mark-green>|<\/mark-green>|<mark-purple>|<\/mark-purple>|<mark-pink>|<\/mark-pink>|<mark-blue>|<\/mark-blue>|<strong>|<\/strong>|<em>|<\/em>|<code>|<\/code>|<wiki-image[^>]*>|<\/wiki-image>)/g;
    const parts = html.split(regex);
    
    const stack = [{ tag: "root", children: [] }];
    
    parts.forEach(part => {
      if (!part) return;
      if (part === "<mark-green>") {
        stack.push({ tag: "mark", props: { className: "bg-cyber-green/20 border border-cyber-green/35 text-cyber-green font-bold px-1.5 py-0.5 rounded not-italic inline-block align-middle my-0.5 shadow-[0_0_8px_rgba(0,255,102,0.15)]" }, children: [] });
      } else if (part === "</mark-green>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "mark") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("mark", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<mark-purple>") {
        stack.push({ tag: "mark", props: { className: "bg-cyber-purple/20 border border-cyber-purple/35 text-white font-bold italic px-1.5 py-0.5 rounded [text-shadow:0_0_8px_rgba(255,255,255,0.25)] not-italic inline-block align-middle my-0.5 shadow-[0_0_8px_rgba(176,38,255,0.15)]" }, children: [] });
      } else if (part === "</mark-purple>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "mark") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("mark", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<mark-pink>") {
        stack.push({ tag: "mark", props: { className: "bg-pink-500/20 border border-pink-500/35 text-pink-300 font-bold px-1.5 py-0.5 rounded not-italic inline-block align-middle my-0.5 shadow-[0_0_8px_rgba(236,72,153,0.15)]" }, children: [] });
      } else if (part === "</mark-pink>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "mark") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("mark", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<mark-blue>") {
        stack.push({ tag: "mark", props: { className: "bg-blue-500/20 border border-blue-500/35 text-blue-300 italic px-1.5 py-0.5 rounded not-italic inline-block align-middle my-0.5 shadow-[0_0_8px_rgba(59,130,246,0.15)]" }, children: [] });
      } else if (part === "</mark-blue>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "mark") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("mark", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<strong>") {
        stack.push({ tag: "strong", props: { className: "font-bold text-white [text-shadow:0_0_8px_rgba(255,255,255,0.25)]" }, children: [] });
      } else if (part === "</strong>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "strong") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("strong", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<em>") {
        stack.push({ tag: "em", props: { className: "italic text-gray-300" }, children: [] });
      } else if (part === "</em>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "em") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("em", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part === "<code>") {
        stack.push({ tag: "code", props: { className: "bg-cyber-purple/10 border border-cyber-purple/35 text-cyber-purple rounded px-1.5 py-0.5 text-[10px] font-mono" }, children: [] });
      } else if (part === "</code>") {
        if (stack.length > 1 && stack[stack.length - 1].tag === "code") {
          const el = stack.pop();
          stack[stack.length - 1].children.push(
            React.createElement("code", { key: Math.random(), ...el.props }, el.children)
          );
        }
      } else if (part.startsWith("<wiki-image")) {
        const nameMatch = part.match(/name="([^"]*)"/);
        const widthMatch = part.match(/width="([^"]*)"/);
        const name = nameMatch ? nameMatch[1] : "";
        const width = widthMatch && widthMatch[1] ? parseInt(widthMatch[1]) : null;
        stack[stack.length - 1].children.push(
          renderWikiImage(name, width, Math.random())
        );
      } else if (part === "</wiki-image>") {
        // Ignore self-closing tag close
      } else {
        stack[stack.length - 1].children.push(part);
      }
    });
    
    while (stack.length > 1) {
      const el = stack.pop();
      stack[stack.length - 1].children.push(
        React.createElement(el.tag, { key: Math.random(), ...el.props }, el.children)
      );
    }
    
    return stack[0].children;
  };

  const parseMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, idx) => {
      // Checklist
      const checklistMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.*)$/i);
      if (checklistMatch) {
        const isChecked = checklistMatch[2].toLowerCase() === "x";
        const content = checklistMatch[3];
        elements.push(
          <div key={idx} className="flex items-center gap-2 py-1 select-none">
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
              isChecked 
                ? "bg-cyber-green/20 border-cyber-green text-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.3)]" 
                : "border-cyber-purple/45 text-transparent hover:border-cyber-purple"
            }`}>
              {isChecked && <Check className="w-2.5 h-2.5" />}
            </span>
            <span className={`font-sans text-xs ${isChecked ? "line-through text-gray-500" : "text-gray-300"}`}>
              {parseInlineMarkdown(content)}
            </span>
          </div>
        );
        return;
      }

      // List
      const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (listMatch) {
        const content = listMatch[2];
        elements.push(
          <div key={idx} className="flex items-start gap-2 py-1 pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green shrink-0 mt-1.5 shadow-[0_0_6px_#00ff66]" />
            <span className="font-sans text-xs text-gray-300 leading-relaxed">
              {parseInlineMarkdown(content)}
            </span>
          </div>
        );
        return;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        const headingClasses = {
          1: "text-lg font-black text-cyber-green tracking-wide border-b border-cyber-green/10 pb-2 mb-3 mt-4 font-mono uppercase neon-text-green",
          2: "text-base font-bold text-cyber-purple tracking-wide mb-2 mt-3 font-mono uppercase neon-text-purple",
          3: "text-sm font-bold text-gray-100 tracking-wide mb-1.5 mt-3 font-mono",
          4: "text-xs font-bold text-gray-200 tracking-wide mb-1 mt-2.5 font-mono",
          5: "text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1 mt-2 font-mono",
          6: "text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1 mt-2 font-mono",
        };
        const HeadingTag = `h${level}`;
        elements.push(
          <HeadingTag key={idx} className={headingClasses[level] || headingClasses[6]}>
            {parseInlineMarkdown(content)}
          </HeadingTag>
        );
        return;
      }

      // Standalone Wiki Images
      const wikiImageMatch = line.match(/^\s*!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]\s*$/);
      if (wikiImageMatch) {
        const imgName = wikiImageMatch[1].trim();
        const widthVal = wikiImageMatch[2] ? parseInt(wikiImageMatch[2]) : null;
        elements.push(renderWikiImage(imgName, widthVal, idx));
        return;
      }

      // Standard line
      elements.push(
        <p key={idx} className="font-sans text-xs leading-relaxed py-1 min-h-[1rem]">
          {parseInlineMarkdown(line)}
        </p>
      );
    });

    return <div className="space-y-1.5 pr-2">{elements}</div>;
  };

  const handleContentChange = (newVal) => {
    setSelectedFileContent(newVal);
    
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri && connected && vaultPath && selectedFile) {
      setSavingState("saving");
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await invoke("write_file_content", {
            vaultPath: vaultPath,
            relPath: selectedFile,
            content: newVal
          });
          setSavingState("saved");
        } catch (err) {
          console.error("Failed to save file:", err);
          setSavingState("error");
        }
      }, 500);
    } else {
      setSavingState("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSavingState("saved");
      }, 300);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && isSleeping) {
        setIsSleeping(false);
        return;
      }

      // Zoom key bindings
      if (e.ctrlKey || e.metaKey) {
        const key = e.key;
        const code = e.code;
        
        if (key === "=" || key === "+" || code === "Equal" || code === "NumpadAdd") {
          e.preventDefault();
          setZoomPercent(prev => {
            const next = Math.min(prev + 10, 200);
            localStorage.setItem("cyber_zoom", next);
            return next;
          });
        } else if (key === "-" || code === "Minus" || code === "NumpadSubtract") {
          e.preventDefault();
          setZoomPercent(prev => {
            const next = Math.max(prev - 10, 70);
            localStorage.setItem("cyber_zoom", next);
            return next;
          });
        } else if (key === "0" || code === "Digit0" || code === "Numpad0") {
          e.preventDefault();
          setZoomPercent(100);
          localStorage.setItem("cyber_zoom", 100);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSleeping]);

  React.useEffect(() => {
    const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 190;
    const menuHeight = 380;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({
      visible: true,
      x: x,
      y: y,
      node: node
    });
  };

  const handleContextAction = async (action) => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    const node = contextMenu.node;
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    
    const getFolderPath = (n) => {
      if (!n) return "";
      return n.type === "folder" ? n.path : n.path.substring(0, n.path.lastIndexOf("/"));
    };

    const currentFolder = getFolderPath(node);
    
    switch (action) {
      case "new-note": {
        handleCreateFile(currentFolder);
        break;
      }
      case "new-folder": {
        const folderName = prompt("Введите имя новой папки:");
        if (!folderName) return;
        const newFolderRelPath = currentFolder ? `${currentFolder}/${folderName}` : folderName;
        
        if (isTauri && connected && vaultPath) {
          try {
            setLoading(true);
            const result = await invoke("create_directory", {
              vaultPath: vaultPath,
              relPath: newFolderRelPath
            });
            setFiles(result);
          } catch (err) {
            console.error(err);
            alert(`Ошибка при создании папки: ${err}`);
          } finally {
            setLoading(false);
          }
        } else {
          // Demo fallback
          const dummyFilePath = `${newFolderRelPath}/.keep`;
          setFiles(prev => [...prev, dummyFilePath]);
        }
        break;
      }
      case "new-canvas": {
        const name = prompt("Введите имя нового холста:", "Без названия.canvas");
        if (!name) return;
        const targetName = name.endsWith(".canvas") ? name : `${name}.canvas`;
        const canvasRelPath = currentFolder ? `${currentFolder}/${targetName}` : targetName;
        
        if (isTauri && connected && vaultPath) {
          try {
            setLoading(true);
            const result = await invoke("create_file", {
              vaultPath: vaultPath,
              relPath: canvasRelPath
            });
            setFiles(result);
          } catch (err) {
            console.error(err);
            alert(`Ошибка при создании холста: ${err}`);
          } finally {
            setLoading(false);
          }
        } else {
          setFiles(prev => [...prev, canvasRelPath]);
        }
        break;
      }
      case "new-db": {
        alert("Создание базы данных доступно в полной версии.");
        break;
      }
      case "copy": {
        if (!node || node.type !== "file") return;
        const separator = node.path.includes("\\") ? "\\" : "/";
        const parts = node.path.split(separator);
        const fileName = parts.pop();
        const baseName = fileName.substring(0, fileName.lastIndexOf("."));
        const ext = fileName.substring(fileName.lastIndexOf("."));
        const newFileName = `${baseName} - копия${ext}`;
        const newRelPath = currentFolder ? `${currentFolder}/${newFileName}` : newFileName;
        
        if (isTauri && connected && vaultPath) {
          try {
            setLoading(true);
            const originalContent = await invoke("read_file_content", {
              vaultPath: vaultPath,
              relPath: node.path
            });
            await invoke("write_file_content", {
              vaultPath: vaultPath,
              relPath: newRelPath,
              content: originalContent
            });
            const result = await invoke("read_vault_files", { path: vaultPath });
            setFiles(result);
          } catch (err) {
            console.error(err);
            alert(`Ошибка при копировании файла: ${err}`);
          } finally {
            setLoading(false);
          }
        } else {
          setFiles(prev => [...prev, newRelPath]);
        }
        break;
      }
      case "move": {
        if (!node) return;
        const targetFolder = prompt("Введите относительный путь к папке назначения (оставьте пустым для корня):", currentFolder);
        if (targetFolder === null) return;
        
        handleMoveFile(node.path, targetFolder);
        break;
      }
      case "search": {
        if (!node) return;
        alert(`Поиск в ${node.name} будет доступен в следующем обновлении.`);
        break;
      }
      case "bookmark": {
        if (!node) return;
        alert(`Файл "${node.name}" добавлен в закладки (симуляция).`);
        break;
      }
      case "copy-path": {
        if (!node) return;
        try {
          await navigator.clipboard.writeText(node.path);
          alert("Путь скопирован в буфер обмена!");
        } catch (err) {
          console.error(err);
        }
        break;
      }
      case "show-in-explorer": {
        if (!node) return;
        if (isTauri && connected && vaultPath) {
          try {
            await invoke("show_in_explorer", {
              vaultPath: vaultPath,
              relPath: node.path
            });
          } catch (err) {
            console.error(err);
            alert(`Не удалось открыть в Проводнике: ${err}`);
          }
        } else {
          alert(`Показ в Проводнике: ${node.path} (Демо-режим)`);
        }
        break;
      }
      case "rename": {
        if (!node) return;
        const separator = node.path.includes("\\") ? "\\" : "/";
        const oldName = node.path.split(separator).pop();
        const newName = prompt(`Переименовать "${oldName}" в:`, oldName);
        if (!newName || newName === oldName) return;
        
        const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
        const newRelPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        if (isTauri && connected && vaultPath) {
          try {
            setLoading(true);
            const result = await invoke("rename_file", {
              vaultPath: vaultPath,
              oldRelPath: node.path,
              newRelPath: newRelPath
            });
            setFiles(result);
            if (selectedFile === node.path) {
              setSelectedFile(newRelPath);
            }
          } catch (err) {
            console.error(err);
            alert(`Ошибка при переименовании: ${err}`);
          } finally {
            setLoading(false);
          }
        } else {
          setFiles(prev => prev.map(f => f === node.path ? newRelPath : f));
          if (selectedFile === node.path) {
            setSelectedFile(newRelPath);
          }
        }
        break;
      }
      case "delete": {
        if (!node) return;
        const confirmDelete = window.confirm(`Вы уверены, что хотите удалить "${node.name}"?`);
        if (!confirmDelete) return;
        
        if (isTauri && connected && vaultPath) {
          try {
            setLoading(true);
            const result = await invoke("delete_file", {
              vaultPath: vaultPath,
              relPath: node.path
            });
            setFiles(result);
            if (selectedFile === node.path) {
              setSelectedFile(null);
            }
          } catch (err) {
            console.error(err);
            alert(`Ошибка при удалении: ${err}`);
          } finally {
            setLoading(false);
          }
        } else {
          setFiles(prev => prev.filter(f => f !== node.path && !f.startsWith(node.path + "/")));
          if (selectedFile === node.path || (selectedFile && selectedFile.startsWith(node.path + "/"))) {
            setSelectedFile(null);
          }
        }
        break;
      }
      default:
        break;
    }
  };

  const handleExitApp = async () => {
    try {
      const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
      if (isTauri) {
        await invoke("exit_app");
      } else {
        alert("Выход из приложения (в веб-версии просто закройте вкладку)");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showGlobalTooltip = (e, text, theme = "purple") => {
    if (!sidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text: text,
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
      theme: theme,
      visible: true
    });
  };

  const hideGlobalTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem("cyber_onboarding_done", "true");
    setShowOnboarding(false);
  };

  const handleToggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleDragStart = (e, filePath) => {
    e.dataTransfer.setData("text/plain", filePath);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, destinationFolder) => {
    e.preventDefault();
    const sourceFilePath = e.dataTransfer.getData("text/plain");
    if (!sourceFilePath) return;

    handleMoveFile(sourceFilePath, destinationFolder);
  };

  const handleMoveFile = async (oldPath, newFolder) => {
    const separator = oldPath.includes("\\") ? "\\" : "/";
    const fileName = oldPath.split(separator).pop();
    const newPath = newFolder ? `${newFolder}/${fileName}` : fileName;
    
    if (oldPath === newPath) return;

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri) {
      try {
        setLoading(true);
        setError("");
        const result = await invoke("move_file", { 
          vaultPath: vaultPath, 
          oldRelPath: oldPath, 
          newRelPath: newFolder 
        });
        setFiles(result);
        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
        }
      } catch (err) {
        console.error(err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    } else {
      // Demo mode fallback
      setFiles(prev => prev.map(f => f === oldPath ? newPath : f));
      if (selectedFile === oldPath) {
        setSelectedFile(newPath);
      }
    }
  };

  const handleCreateFile = async (folderPath) => {
    const fileName = prompt("Введите имя нового файла (например, Заметка.md):", "Новая заметка.md");
    if (!fileName) return;
    const targetFileName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
    
    const relPath = folderPath ? `${folderPath}/${targetFileName}` : targetFileName;
    
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri && connected && vaultPath) {
      try {
        setLoading(true);
        setError("");
        const result = await invoke("create_file", { 
          vaultPath: vaultPath, 
          relPath: relPath 
        });
        setFiles(result);
        if (folderPath) {
          setExpandedFolders(prev => ({
            ...prev,
            [folderPath]: true
          }));
        }
        setSelectedFile(relPath);
        setEditMode("edit");
      } catch (err) {
        console.error(err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    } else {
      // Demo mode fallback
      if (files.includes(relPath)) {
        alert("Файл с таким именем уже существует!");
        return;
      }
      setFiles(prev => [...prev, relPath]);
      if (folderPath) {
        setExpandedFolders(prev => ({
          ...prev,
          [folderPath]: true
        }));
      }
      setSelectedFile(relPath);
      setEditMode("edit");
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!vaultPath.trim()) {
      setError("Please enter a valid path");
      return;
    }

    setLoading(true);
    setError("");

    // Check if running inside Tauri
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

    if (!isTauri) {
      setLoading(false);
      setError("Приложение запущено в браузере. Веб-браузеры не имеют прямого доступа к файловой системе ПК из соображений безопасности. Запустите десктопную версию через: npm run tauri dev");
      return;
    }

    try {
      // Invoke Rust command to read files
      const result = await invoke("read_vault_files", { path: vaultPath });
      setFiles(result);
      setConnected(true);
      setShowConnection(false);
      setExpandedFolders({});
      if (result.length > 0) {
        setSelectedFile(result[0]);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      setError(String(err));
      setConnected(false);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDemo = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      setFiles(["Начало работы.md", "Идеи проектов.md", "Список задач.md", "Черновики.md"]);
      setConnected(true);
      setShowConnection(false);
      setExpandedFolders({});
      setSelectedFile("Начало работы.md");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg select-none relative font-sans text-gray-200">
      {/* Animated interactive background */}
      <InteractiveBackground isSleeping={isSleeping} />

      <AnimatePresence mode="wait">
        {!isSleeping ? (
          <motion.div
            key="active-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex h-full w-full overflow-hidden"
            style={{ zoom: `${zoomPercent}%` }}
          >
            {/* Sidebar */}
            <aside className={`bg-cyber-sidebar/85 backdrop-blur-lg border-r border-cyber-purple/20 flex flex-col justify-between p-5 z-10 relative shadow-[5px_0_25px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-20 items-center px-2" : "w-80"}`}>
              {/* Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="magnetic-target absolute top-6 -right-3 w-6 h-6 rounded-full border border-cyber-purple/30 bg-cyber-sidebar flex items-center justify-center hover:bg-cyber-purple/20 hover:border-cyber-purple/65 transition-all text-cyber-purple hover:text-white cursor-none z-50 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
              >
                {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>

              <div className="flex flex-col h-full w-full overflow-hidden">
                {/* App Header */}
                <div 
                  onMouseEnter={(e) => showGlobalTooltip(e, "CYBER-NOTES TERMINAL", "green")}
                  onMouseLeave={hideGlobalTooltip}
                  className={`flex items-center gap-3 mb-8 shrink-0 ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <div className="w-10 h-10 rounded border border-cyber-green flex items-center justify-center bg-cyber-green/10 shadow-[0_0_10px_rgba(0,255,102,0.3)] shrink-0">
                    <Cpu className="w-6 h-6 text-cyber-green animate-pulse" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
                      <h1 className="text-xl font-black tracking-widest neon-text-green font-mono">
                        CYBER-NOTES
                      </h1>
                      <p className="text-[10px] text-cyber-purple uppercase tracking-widest font-mono">
                        Stage 1 Terminal
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar Main Content */}
                {editMode === "preview" ? (
                  // Preview mode sidebar (File Tree)
                  sidebarCollapsed ? (
                    <div className="flex-1 flex flex-col items-center gap-4 overflow-hidden mt-4 w-full">
                      {/* Files Icon Header */}
                      <div 
                        onMouseEnter={(e) => showGlobalTooltip(e, `ДЕРЕВО ФАЙЛОВ (${files.length})`, "green")}
                        onMouseLeave={hideGlobalTooltip}
                        className="relative group flex items-center justify-center w-10 h-10 rounded border border-cyber-green/20 bg-cyber-green/5 text-cyber-green shrink-0"
                      >
                        <Folder className="w-5 h-5" />
                        <span className="absolute bg-cyber-green/10 text-cyber-green font-bold text-[9px] -bottom-1 -right-1 px-1 rounded border border-cyber-green/30">
                          {files.length}
                        </span>
                      </div>

                      {/* Collapsed File Tree */}
                      <div 
                        onContextMenu={(e) => handleContextMenu(e, null)}
                        className="flex-1 w-full overflow-y-auto space-y-2 flex flex-col items-start pl-2 pr-1 select-none pb-2"
                      >
                        {files.length === 0 ? (
                          <div 
                            onMouseEnter={(e) => showGlobalTooltip(e, "ХРАНИЛИЩЕ НЕ ПОДКЛЮЧЕНО", "purple")}
                            onMouseLeave={hideGlobalTooltip}
                            className="relative group w-10 h-10 rounded border border-dashed border-cyber-purple/20 flex items-center justify-center text-gray-600 shrink-0"
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                        ) : (
                          buildFileTree(files).children.map((child, idx) => (
                            <FileTreeNode
                              key={idx}
                              node={child}
                              depth={0}
                              selectedFile={selectedFile}
                              onSelectFile={setSelectedFile}
                              expandedFolders={expandedFolders}
                              onToggleFolder={handleToggleFolder}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              sidebarCollapsed={true}
                              showGlobalTooltip={showGlobalTooltip}
                              hideGlobalTooltip={hideGlobalTooltip}
                              onCreateFile={handleCreateFile}
                              onContextMenu={handleContextMenu}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Files List Heading / Root Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, "")}
                        onContextMenu={(e) => handleContextMenu(e, null)}
                        className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-400 font-mono mb-3 p-1 rounded border border-transparent hover:border-cyber-green/35 hover:bg-cyber-green/5 transition-all select-none shrink-0"
                        title="Переместить в корень / Создать файл в корне"
                      >
                        <span className="flex items-center gap-1.5">
                          <Folder className="w-4 h-4 text-cyber-green" />
                          Vault Files
                        </span>
                        <div className="flex items-center gap-2">
                          {connected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateFile("");
                                }}
                              className="magnetic-target p-1 rounded border border-transparent hover:border-cyber-green/30 text-gray-400 hover:text-cyber-green hover:bg-cyber-green/5 transition-all cursor-none flex items-center justify-center"
                              title="Создать новый файл в корне"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-cyber-green font-bold bg-cyber-green/10 px-1.5 py-0.5 rounded border border-cyber-green/20">
                            {files.length}
                          </span>
                          {connected && (
                            <button
                              type="button"
                              onClick={() => setShowConnection(!showConnection)}
                              className={`magnetic-target p-1 rounded border transition-all cursor-none ${
                                showConnection
                                  ? "bg-cyber-purple/20 border-cyber-purple/50 text-cyber-purple shadow-[0_0_8px_rgba(176,38,255,0.2)]"
                                  : "bg-transparent border-transparent text-gray-400 hover:text-cyber-green hover:border-cyber-green/30"
                              }`}
                              title={showConnection ? "Скрыть путь к хранилищу" : "Изменить путь к хранилищу"}
                            >
                              <Link className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reactive File List (Tree View) */}
                      <div 
                        onContextMenu={(e) => handleContextMenu(e, null)}
                        className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-none pb-2"
                      >
                        {files.length === 0 ? (
                          <div className="h-32 border border-dashed border-cyber-purple/10 rounded flex flex-col items-center justify-center text-center p-4">
                            <FileText className="w-8 h-8 text-gray-600 mb-2" />
                            <p className="text-xs text-gray-500 font-mono">No active vault linked.</p>
                          </div>
                        ) : (
                          buildFileTree(files).children.map((child, idx) => (
                            <FileTreeNode
                              key={idx}
                              node={child}
                              depth={0}
                              selectedFile={selectedFile}
                              onSelectFile={setSelectedFile}
                              expandedFolders={expandedFolders}
                              onToggleFolder={handleToggleFolder}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              sidebarCollapsed={false}
                              showGlobalTooltip={showGlobalTooltip}
                              hideGlobalTooltip={hideGlobalTooltip}
                              onCreateFile={handleCreateFile}
                              onContextMenu={handleContextMenu}
                            />
                          ))
                        )}
                      </div>
                    </>
                  )
                ) : (
                  // Edit mode sidebar (Text Formatting Tools)
                  sidebarCollapsed ? (
                    <div className="flex-1 flex flex-col items-center gap-4 overflow-hidden mt-4 w-full">
                      {/* Editor Icon Header */}
                      <div 
                        onMouseEnter={(e) => showGlobalTooltip(e, "ИНСТРУМЕНТЫ РЕДАКТОРА", "green")}
                        onMouseLeave={hideGlobalTooltip}
                        className="relative group flex items-center justify-center w-10 h-10 rounded border border-cyber-purple/20 bg-cyber-purple/5 text-cyber-purple shrink-0"
                      >
                        <Terminal className="w-5 h-5" />
                      </div>

                      {/* Collapsed Tool List */}
                      <div className="flex-1 w-full overflow-y-auto space-y-2 flex flex-col items-center pr-0 select-none pb-2">
                        {editTools.map((tool) => {
                          const IconComponent = tool.icon;
                          return (
                            <button
                              key={tool.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyEditTool(tool.id)}
                              onMouseEnter={(e) => showGlobalTooltip(e, `${tool.label} (${tool.shortcut})`, "green")}
                              onMouseLeave={hideGlobalTooltip}
                              className="magnetic-target w-10 h-10 rounded flex items-center justify-center transition-all cursor-none border border-transparent text-gray-400 hover:text-cyber-green hover:border-cyber-green/35 hover:bg-cyber-green/5 relative group shrink-0"
                            >
                              <IconComponent className="w-5 h-5 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Tools Heading */}
                      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-400 font-mono mb-4 select-none shrink-0">
                        <Terminal className="w-4 h-4 text-cyber-purple" />
                        Инструменты текста
                      </div>

                      {/* Tools List */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 select-none pb-2">
                        {editTools.map((tool) => {
                          const IconComponent = tool.icon;
                          const isHighlight = tool.id === "highlight";
                          return (
                            <div 
                              key={tool.id} 
                              className="border border-cyber-purple/15 bg-[#0e091a]/30 rounded p-3 flex flex-col gap-2.5 hover:border-cyber-purple/35 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => applyEditTool(tool.id)}
                                  className="magnetic-target w-8 h-8 rounded border border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple hover:text-cyber-green hover:border-cyber-green/55 hover:bg-cyber-green/5 flex items-center justify-center shrink-0 cursor-none transition-all shadow-[0_0_8px_rgba(176,38,255,0.1)] hover:shadow-[0_0_12px_rgba(0,255,102,0.2)]"
                                  title={`Применить: ${tool.label}`}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-bold text-gray-200 truncate">{tool.label}</span>
                                    <span className="font-mono text-[9px] text-cyber-purple bg-cyber-purple/5 border border-cyber-purple/15 px-1.5 py-0.5 rounded shrink-0">{tool.shortcut}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5">{tool.desc}</p>
                                </div>
                              </div>

                              {/* Custom Settings (for highlighter color setting) */}
                              {isHighlight && (
                                <div className="pl-11 border-t border-cyber-purple/5 pt-2 flex flex-col gap-1.5">
                                  <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Цвет маркера:</span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => setHighlightColor("green")}
                                      className={`magnetic-target flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-none ${
                                        highlightColor === "green"
                                          ? "bg-cyber-green/10 border-cyber-green text-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                                          : "bg-transparent border-cyber-purple/15 text-gray-400 hover:text-gray-200 hover:border-cyber-purple/35"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
                                      Зеленый
                                    </button>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => setHighlightColor("blue")}
                                      className={`magnetic-target flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-none ${
                                        highlightColor === "blue"
                                          ? "bg-blue-500/10 border-blue-500/50 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                                          : "bg-transparent border-cyber-purple/15 text-gray-400 hover:text-gray-200 hover:border-cyber-purple/35"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                      Синий
                                    </button>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => setHighlightColor("pink")}
                                      className={`magnetic-target flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-none ${
                                        highlightColor === "pink"
                                          ? "bg-pink-500/10 border-pink-500/50 text-pink-300 shadow-[0_0_8px_rgba(236,72,153,0.15)]"
                                          : "bg-transparent border-cyber-purple/15 text-gray-400 hover:text-gray-200 hover:border-cyber-purple/35"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                      Розовый
                                    </button>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => setHighlightColor("purple")}
                                      className={`magnetic-target flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-none ${
                                        highlightColor === "purple"
                                          ? "bg-cyber-purple/15 border-cyber-purple text-cyber-purple shadow-[0_0_8px_rgba(176,38,255,0.15)]"
                                          : "bg-transparent border-cyber-purple/15 text-gray-400 hover:text-gray-200 hover:border-cyber-purple/35"
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple" />
                                      Фиолетовый
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )
                )}

                {/* Separator (only shown if connection panel is visible) */}
                {shouldShowConnection && (
                  <div className="h-[1px] bg-cyber-purple/10 w-full my-3 shrink-0" />
                )}

                {/* Connection Input Panel / Button */}
                {shouldShowConnection && (
                  sidebarCollapsed ? (
                    <div className="mb-6 flex justify-center shrink-0">
                      <button
                        onClick={() => setSidebarCollapsed(false)}
                        onMouseEnter={(e) => showGlobalTooltip(e, "ПОДКЛЮЧИТЬ VAULT", "purple")}
                        onMouseLeave={hideGlobalTooltip}
                        className="magnetic-target w-10 h-10 rounded border bg-[#06040c]/40 hover:bg-cyber-purple/10 flex items-center justify-center transition-all group relative shrink-0 border-cyber-purple/30 text-cyber-purple shadow-[0_0_10px_rgba(176,38,255,0.15)]"
                      >
                        <Link className="w-5 h-5 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConnect} className="mb-6 bg-[#06040c]/60 backdrop-blur-md p-4 rounded border border-cyber-purple/25 shadow-lg shrink-0">
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-cyber-purple" />
                        Obsidian Vault Path
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={vaultPath}
                          onChange={(e) => setVaultPath(e.target.value)}
                          placeholder="C:\Users\name\Vault"
                          className="w-full bg-[#06040c]/80 border border-cyber-purple/40 text-cyber-green placeholder-gray-600 focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green rounded px-3 py-2 text-xs transition-all font-mono shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)]"
                        />
                        
                        <button
                          type="submit"
                          disabled={loading}
                          className="magnetic-target w-full bg-cyber-green text-[#06040c] font-black rounded py-2.5 px-4 shadow-[0_0_12px_rgba(0,255,102,0.35)] hover:shadow-[0_0_20px_rgba(0,255,102,0.65)] hover:bg-[#15ff7a] transition-all text-xs font-mono flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-[#06040c] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Terminal className="w-4 h-4" />
                              CONNECT VAULT
                            </>
                          )}
                        </button>
                      </div>

                      {/* Error Message */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 p-2.5 bg-red-950/40 border border-red-500/30 rounded text-[11px] text-red-400 flex flex-col gap-2 font-mono"
                          >
                            <div className="flex items-start gap-1.5">
                              <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
                              <span>{error}</span>
                            </div>
                            {error.includes("браузере") && (
                              <button
                                type="button"
                                onClick={handleStartDemo}
                                className="magnetic-target mt-1 w-full bg-cyber-purple/20 border border-cyber-purple/45 text-cyber-purple hover:bg-cyber-purple/35 hover:text-white font-bold rounded py-1.5 px-2.5 transition-all text-[10px] cursor-none"
                              >
                                ЗАПУСТИТЬ ДЕМО-РЕЖИМ
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Connection Success Tag */}
                      {connected && !error && (
                        <div className="mt-3 p-1.5 bg-cyber-green/10 border border-cyber-green/30 rounded text-[11px] text-cyber-green flex items-center gap-1.5 font-mono">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>CONNECTED SECURELY</span>
                        </div>
                      )}
                    </form>
                  )
                )}
              </div>

              {/* Footer */}
              {sidebarCollapsed ? (
                <div className="mt-4 pt-4 border-t border-cyber-purple/10 flex flex-col items-center justify-center gap-2 w-full">
                  <div 
                    onMouseEnter={(e) => showGlobalTooltip(e, "СОЕДИНЕНИЕ ЗАЩИЩЕНО (SECURE LINK)", "green")}
                    onMouseLeave={hideGlobalTooltip}
                    className="relative group flex items-center justify-center w-6 h-6"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse shadow-[0_0_8px_#00ff66]" />
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-cyber-purple/10 text-[10px] text-gray-500 font-mono flex justify-between items-center w-full">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                    SECURE LINK
                  </span>
                  <span>V1.0.0</span>
                </div>
              )}
            </aside>

            {/* Main Workspace Preview Pane */}
            <main className="flex-1 flex flex-col h-full relative z-0">
              {/* Workspace Top Header Bar */}
              <header className="h-16 border-b border-cyber-purple/20 bg-cyber-sidebar/65 backdrop-blur-md flex items-center justify-between px-8 z-10 relative">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-cyber-purple">workspace:</span>
                  <span className="text-gray-400">/local-vault</span>
                  {selectedFile && (
                    <>
                      <span className="text-cyber-purple">/</span>
                      <span className="text-cyber-green font-bold">{selectedFile}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="magnetic-target flex items-center gap-1.5 text-xs text-cyber-green bg-cyber-green/5 border border-cyber-green/20 hover:bg-cyber-green/10 hover:border-cyber-green/50 px-2.5 py-1 rounded font-mono transition-all cursor-none"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    СПРАВКА
                  </button>
                  
                  <div className="flex items-center gap-1.5 text-xs text-cyber-purple bg-cyber-purple/5 border border-cyber-purple/20 px-2.5 py-1 rounded font-mono">
                    <Layers className="w-3.5 h-3.5" />
                    STAGE 1 RUNTIME
                  </div>

                  {/* System Control Widget */}
                  <div className="flex items-center gap-1 bg-[#06040c]/50 border border-cyber-purple/25 p-1 rounded font-mono shadow-[0_0_10px_rgba(176,38,255,0.1)]">
                    <button
                      type="button"
                      onClick={() => setIsSleeping(true)}
                      className="magnetic-target p-1.5 text-xs text-cyber-purple hover:text-white hover:bg-cyber-purple/20 border border-transparent hover:border-cyber-purple/35 rounded transition-all cursor-none flex items-center gap-1"
                      title="Войти в спящий режим"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider hidden md:inline">SLEEP</span>
                    </button>
                    <div className="w-[1px] h-4 bg-cyber-purple/20" />
                    <button
                      type="button"
                      onClick={handleExitApp}
                      className="magnetic-target p-1.5 text-xs text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/35 rounded transition-all cursor-none flex items-center gap-1"
                      title="Выйти из приложения"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider hidden md:inline">EXIT</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* Workspace Content Viewport */}
              <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
                {selectedFile ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedFile}
                    className="w-full max-w-3xl h-full flex flex-col bg-cyber-sidebar/65 border border-cyber-purple/20 rounded-lg p-6 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md relative overflow-hidden z-10"
                  >
                    {/* Corner Glowing Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-green" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-green" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-green" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-green" />

                    <div className="flex items-center justify-between border-b border-cyber-purple/10 pb-3 mb-4 font-mono">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-cyber-green">FILENAME:</span>
                          <span className="text-sm font-bold text-gray-100">{selectedFile.split('/').pop()}</span>
                        </div>
                        {/* Sync status badge */}
                        <div className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-all ${
                          savingState === "saving" 
                            ? "text-cyber-purple border-cyber-purple/30 bg-cyber-purple/10" 
                            : savingState === "saved"
                              ? "text-cyber-green border-cyber-green/30 bg-cyber-green/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                              : "text-red-400 border-red-500/30 bg-red-950/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            savingState === "saving" 
                              ? "bg-cyber-purple animate-pulse" 
                              : savingState === "saved"
                                ? "bg-cyber-green"
                                : "bg-red-500"
                          }`} />
                          {savingState}
                        </div>
                      </div>

                      {/* Tab Toggles: EDIT vs PREVIEW */}
                      <div className="flex items-center gap-3">
                        <div className="flex bg-[#06040c]/60 border border-cyber-purple/20 p-0.5 rounded font-mono">
                          <button
                            type="button"
                            onClick={() => setEditMode("edit")}
                            className={`magnetic-target px-2.5 py-1 text-[10px] rounded transition-all cursor-none ${
                              editMode === "edit"
                                ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.2)] font-bold"
                                : "border border-transparent text-gray-400 hover:text-white"
                            }`}
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMode("preview")}
                            className={`magnetic-target px-2.5 py-1 text-[10px] rounded transition-all cursor-none ${
                              editMode === "preview"
                                ? "bg-cyber-purple/15 border border-cyber-purple/30 text-cyber-purple shadow-[0_0_8px_rgba(176,38,255,0.2)] font-bold"
                                : "border border-transparent text-gray-400 hover:text-white"
                            }`}
                          >
                            PREVIEW
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono hidden md:inline">
                          PATH: {selectedFile}
                        </div>
                      </div>
                    </div>

                    {/* Cyberpunk Text Editor View / Preview View */}
                    <div className="flex-1 flex flex-col font-mono text-sm text-gray-300 overflow-hidden relative">
                      {editMode === "edit" ? (
                        <>
                          <div className="absolute top-2 right-4 flex gap-1.5 pointer-events-none opacity-40 z-20">
                            <span className="text-[9px] text-cyber-purple uppercase tracking-widest font-mono">
                              UTF-8 Markdown Editor
                            </span>
                          </div>
                          <textarea
                            ref={textareaRef}
                            value={selectedFileContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleEditorKeyDown}
                            className="flex-1 w-full bg-[#050308]/65 border border-cyber-purple/20 focus:border-cyber-green/55 focus:ring-1 focus:ring-cyber-green/20 rounded-md p-5 text-xs font-mono text-gray-200 focus:outline-none resize-none overflow-y-auto leading-relaxed shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] cursor-text select-text z-10"
                            placeholder="Start typing your notes here in Markdown format..."
                          />
                        </>
                      ) : (
                        <div className="flex-1 w-full bg-[#050308]/40 border border-cyber-purple/10 rounded-md p-5 text-xs text-gray-300 overflow-y-auto leading-relaxed shadow-[inset_0_2px_12px_rgba(0,0,0,0.7)] z-10 selection:bg-cyber-purple/25 font-sans">
                          {parseMarkdown(selectedFileContent)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col xl:flex-row gap-8 items-center justify-center max-w-5xl w-full z-10">
                    {/* Awaiting Connection Dashboard */}
                    <div className="text-center max-w-sm p-8 rounded-2xl bg-[#0e091a]/40 border border-cyber-purple/20 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex-shrink-0">
                      <motion.div
                        animate={{
                          scale: [1, 1.03, 1],
                          rotateY: [0, 6, 0],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-40 h-40 mx-auto mb-6 relative"
                      >
                        <div className="absolute inset-0 rounded-full border border-cyber-purple/40 animate-spin" style={{ animationDuration: '12s' }} />
                        <div className="absolute inset-2.5 rounded-full border border-dashed border-cyber-green/45 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
                        <div className="absolute inset-7 rounded-full bg-cyber-sidebar/85 border border-cyber-purple/45 flex items-center justify-center shadow-[0_0_40px_rgba(176,38,255,0.3)]">
                          <Cpu className="w-12 h-12 text-cyber-purple animate-pulse filter drop-shadow-[0_0_10px_rgba(176,38,255,0.6)]" />
                        </div>
                      </motion.div>
                      <h2 className="text-xl font-black tracking-widest text-cyber-purple font-mono uppercase mb-2 neon-text-purple">
                        Awaiting Connection
                      </h2>
                      <p className="text-[11px] text-gray-400 font-mono leading-relaxed px-2">
                        Enter your Obsidian Vault local folder path in the sidebar and press Connect to initialize the workspace indexer.
                      </p>
                    </div>

                    {/* Onboarding Wizard Widget moved to root of active-ui */}
                  </div>
                )}
              </div>
            </main>

            <AnimatePresence>
              {showOnboarding && (
                <OnboardingWidget onClose={handleCloseOnboarding} />
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="sleep-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-between p-12 z-20 pointer-events-none"
          >
            {/* Top status */}
            <div className="text-center font-mono text-[10px] text-cyber-purple/50 tracking-[0.25em] uppercase select-none animate-pulse">
              // DEEP SLEEP MODE ACTIVE
            </div>

            {/* Bottom Wake Up Hint */}
            <div className="text-center font-mono text-[11px] text-cyber-green/70 tracking-[0.2em] uppercase select-none animate-pulse">
              PRESS <span className="text-white border border-cyber-green/40 px-2 py-0.5 rounded bg-cyber-green/10 font-bold mx-1">ENTER</span> TO WAKE UP SYSTEM
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Tooltip for Collapsed Sidebar */}
      <AnimatePresence>
        {tooltip.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 5 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 5 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`fixed bg-[#0e091a]/95 text-[10px] font-mono py-1.5 px-3 rounded pointer-events-none z-[9999] whitespace-nowrap border transition-all duration-200 ${
              tooltip.theme === "green"
                ? "border-cyber-green/50 text-cyber-green shadow-[0_0_12px_rgba(0,255,102,0.3)] [text-shadow:0_0_5px_rgba(0,255,102,0.5)]"
                : "border-cyber-purple/50 text-cyber-purple shadow-[0_0_12px_rgba(176,38,255,0.3)] [text-shadow:0_0_5px_rgba(176,38,255,0.5)]"
            }`}
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translateY(-50%)",
            }}
          >
            {/* Left pointer arrow */}
            <div className={`absolute top-1/2 -left-1 w-1.5 h-1.5 bg-[#0e091a] rotate-45 -translate-y-1/2 border-l border-b ${
              tooltip.theme === "green" ? "border-cyber-green/50" : "border-cyber-purple/50"
            }`} />
            {tooltip.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed bg-[#0e091a]/95 border border-cyber-purple/35 text-xs text-gray-300 py-1.5 px-1 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.7)] z-[9999] min-w-[190px] backdrop-blur-md select-none font-sans"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Top section: Creation */}
            <button
              onClick={() => handleContextAction("new-note")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-cyber-green" />
              <span>Новая заметка</span>
            </button>
            <button
              onClick={() => handleContextAction("new-folder")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-cyber-purple" />
              <span>Новая папка</span>
            </button>
            <button
              onClick={() => handleContextAction("new-canvas")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-gray-400" />
              <span>Новый холст</span>
            </button>
            <button
              onClick={() => handleContextAction("new-db")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-gray-400" />
              <span>Создать базу данных</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Middle section: File operations */}
            <button
              onClick={() => handleContextAction("copy")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Создать копию</span>
            </button>
            <button
              onClick={() => handleContextAction("move")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <CornerUpRight className="w-3.5 h-3.5 text-gray-400" />
              <span>Переместить...</span>
            </button>
            <button
              onClick={() => handleContextAction("search")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>Искать в папке</span>
            </button>
            <button
              onClick={() => handleContextAction("bookmark")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-gray-400" />
              <span>Добавить в закладки...</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Path operations */}
            <button
              onClick={() => handleContextAction("copy-path")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center justify-between cursor-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                <span>Копировать путь</span>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Explorer action */}
            <button
              onClick={() => handleContextAction("show-in-explorer")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>Показать в Проводнике</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Rename and delete */}
            <button
              onClick={() => handleContextAction("rename")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 cursor-none transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Переименовать</span>
            </button>
            <button
              onClick={() => handleContextAction("delete")}
              className="magnetic-target w-full text-left py-1.5 px-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded flex items-center gap-2 cursor-none transition-colors font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Удалить</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fluid Custom Slime Cursor */}
      <CustomCursor isSleeping={isSleeping} />
    </div>
  );
}
