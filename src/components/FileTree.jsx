import React from "react";
import { FileText, Folder, FolderOpen, Plus } from "lucide-react";

// Build a nested directory tree from a flat array of relative file paths
export function buildFileTree(files) {
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
export function FileTreeNode({ 
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
