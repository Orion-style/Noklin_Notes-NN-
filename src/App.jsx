import React, { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { X, RefreshCw, BarChart2, Grid, Plus, Folder, FolderOpen, FileText, Cpu, Terminal, Layers, Link, ShieldAlert, Check, HelpCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Moon, Sun, LogOut, Bold, Italic, Highlighter, Heading1, Heading2, CheckSquare, Code, FilePlus, FolderPlus, Compass, Database, Copy, CornerUpRight, Search, Bookmark, Clipboard, Eye, Edit2, Trash2, Gamepad2, Swords, Play, Sparkles, Clock, Gamepad, Settings, Mail, Bell, Activity, HardDrive, Crop, Square, Calendar, Zap, Flame, Shuffle, Pause, RotateCcw, User, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveBackground from "./components/InteractiveBackground";
import OnboardingWidget from "./components/OnboardingWidget";

// Obsidian crystalline SVG icon
const ObsidianIcon = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 2L88 35L50 98L12 35Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M50 2L50 52" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L88 35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L12 35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L50 98" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M50 2L88 35L50 52Z" fill="currentColor" fillOpacity="0.18" />
    <path d="M50 52L12 35L50 2Z" fill="currentColor" fillOpacity="0.08" />
    <path d="M50 52L50 98L12 35Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M50 52L88 35L50 98Z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// Endfield styled game target/crosshair icon
const GameModeIcon = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4" strokeDasharray="12 8" />
    <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" />
    <path d="M50 15V32M50 68V85M15 50H32M68 50H85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 38L44 44M62 38L56 44M62 62L56 56M38 62L44 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="50" cy="50" r="6" fill="currentColor" />
  </svg>
);

// Translation helper function
const t = (ru, en) => ru || en;

const formatPlayTime = (hoursValue) => {
  const time = typeof hoursValue === 'number' ? hoursValue : parseFloat(hoursValue);
  if (isNaN(time) || time <= 0) return '0 мин.';
  const totalMinutes = Math.round(time * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) {
    return `${h} ч. ${m} мин.`;
  } else if (h > 0) {
    return `${h} ч.`;
  } else {
    return `${m} мин.`;
  }
};

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
        className={`rounded transition-colors flex items-center shrink-0 select-none ${ sidebarCollapsed ? (isNested ? "w-7 h-7 justify-center ml-1" : "w-8 h-8 justify-center ml-1.5") : "w-[calc(100%-8px)] text-left h-7 px-2 gap-2 text-xs" } ${ isSelected ? "bg-cyber-green/15 text-cyber-green font-bold border-l-2 border-l-cyber-green border-t-transparent border-r-transparent border-b-transparent" : "bg-transparent border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5" }`}
        style={{ paddingLeft: sidebarCollapsed ? undefined : `${depth * 12 + 8}px` }}
      >
        <FileText className={`shrink-0 ${sidebarCollapsed ? (isNested ? "w-4 h-4" : "w-4.5 h-4.5") : "w-3.5 h-3.5"} ${isSelected ? "text-cyber-green" : "text-cyber-purple"}`} />
        {!sidebarCollapsed && <span className="truncate font-mono whitespace-nowrap">{node.name}</span>}
      </button>
    );
  }

  const isExpanded = !!expandedFolders[node.path];
  const isCollapsed = !isExpanded;
  const FolderIcon = isCollapsed ? Folder : FolderOpen;

  return (
    <div className="space-y-0.5">
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
        className={`rounded transition-colors flex items-center group border border-transparent select-none shrink-0 ${ sidebarCollapsed ? (isNested ? "w-7 h-7 justify-center ml-1 hover:border-cyber-purple/15 hover:bg-cyber-purple/5" : "w-8 h-8 justify-center ml-1.5 hover:border-cyber-purple/15 hover:bg-cyber-purple/5") : "w-[calc(100%-8px)] h-7 px-2 justify-between text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5" }`}
        style={{ paddingLeft: sidebarCollapsed ? undefined : `${depth * 12 + 8}px` }}
      >
        <div className={`flex items-center min-w-0 ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
          <FolderIcon className={`text-cyber-green shrink-0 ${sidebarCollapsed ? (isNested ? "w-4 h-4" : "w-4.5 h-4.5") : "w-3.5 h-3.5"}`} />
          {!sidebarCollapsed && <span className="font-mono font-bold truncate whitespace-nowrap">{node.name}</span>}
        </div>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFile(node.path);
              }}
              className="p-0.5 rounded border border-transparent hover:border-cyber-green/45 hover:bg-cyber-green/10 text-cyber-green transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
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
  const [customImagesPath, setCustomImagesPath] = useState(() => {
    return localStorage.getItem("cyber_custom_images_path") || "";
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
  const [sidebarTab, setSidebarTab] = useState(() => {
    const saved = localStorage.getItem("cyber_sidebar_tab");
    return (saved && saved !== "tools") ? saved : "files";
  });
  React.useEffect(() => {
    localStorage.setItem("cyber_sidebar_tab", sidebarTab);
  }, [sidebarTab]);

  const openFileInObsidian = (relPath) => {
    if (!relPath) return;
    
    // Normalize path separators
    const cleanRelPath = relPath.replace(/\\/g, '/').replace(/^\//, '');
    let obsidianUrl = '';

    if (vaultPath) {
      const normalizedVault = vaultPath.replace(/\\/g, '/').replace(/\/$/, '');
      const fullPath = `${normalizedVault}/${cleanRelPath}`;
      // Obsidian URI format 1: obsidian://open?path=C%3A%2Fpath%2Fto%2Ffile.md
      obsidianUrl = `obsidian://open?path=${encodeURIComponent(fullPath)}`;
    } else {
      // Obsidian URI format 2: obsidian://open?file=file.md
      obsidianUrl = `obsidian://open?file=${encodeURIComponent(cleanRelPath)}`;
    }

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri) {
      invoke("open_url", { url: obsidianUrl }).catch(err => console.error("Failed to open file in Obsidian:", err));
    } else {
      window.open(obsidianUrl, '_blank');
    }
  };

  const handleOpenSelectedInObsidian = () => {
    if (selectedFile) {
      openFileInObsidian(selectedFile);
    }
  };

  // Focus Timer & Daily Goals States
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [focusInitialTime, setFocusInitialTime] = useState(25 * 60);
  const [focusIsRunning, setFocusIsRunning] = useState(false);
  const [focusMode, setFocusMode] = useState("work"); // "work", "short", "long"

  const [dailyGoals, setDailyGoals] = useState(() => {
    const saved = localStorage.getItem("cyber_daily_goals");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "1", title: "Провести 1 фокус-сессию (25 минут)", category: "ФОКУС", completed: false },
      { id: "2", title: "Запустить игру или проверить обновления", category: "ИГРЫ", completed: false },
      { id: "3", title: "Создать или обновить заметку в Obsidian", category: "ЗАМЕТКИ", completed: false }
    ];
  });

  const [newGoalText, setNewGoalText] = useState("");

  React.useEffect(() => {
    localStorage.setItem("cyber_daily_goals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  const toggleDailyGoal = (goalId) => {
    setDailyGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g));
  };

  const handleAddCustomGoal = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newGoal = {
      id: Date.now().toString(),
      title: newGoalText.trim(),
      category: "ПОЛЬЗОВАТЕЛЬСКАЯ",
      completed: false
    };
    setDailyGoals(prev => [...prev, newGoal]);
    setNewGoalText("");
  };

  React.useEffect(() => {
    let timer = null;
    if (focusIsRunning && focusTime > 0) {
      timer = setInterval(() => {
        setFocusTime(prev => prev - 1);
      }, 1000);
    } else if (focusTime === 0 && focusIsRunning) {
      setFocusIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [focusIsRunning, focusTime]);

  const setTimerPreset = (minutes, modeName) => {
    const secs = minutes * 60;
    setFocusMode(modeName);
    setFocusInitialTime(secs);
    setFocusTime(secs);
    setFocusIsRunning(false);
  };

  const [expandedFolders, setExpandedFolders] = useState({});
  const [isSleeping, setIsSleeping] = useState(false);
  const [tooltip, setTooltip] = useState({ text: "", x: 0, y: 0, theme: "purple", visible: false });
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [savingState, setSavingState] = useState("saved"); // "saved", "saving", "error"
  const saveTimeoutRef = React.useRef(null);
  const [editMode, setEditMode] = useState("preview");
  const [imageStateMap, setImageStateMap] = useState({});
  const resolvedRef = React.useRef({});

  const activeFileRef = React.useRef(selectedFile);
  const [highlightColor, setHighlightColor] = useState("green");
  const [zoomPercent, setZoomPercent] = useState(() => {
    const saved = localStorage.getItem("cyber_zoom");
    return saved ? parseInt(saved) : 100;
  });

  // Update Tauri window size programmatically when zoom level changes
  React.useEffect(() => {
    const updateWindowSize = async () => {
      const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
      if (isTauri) {
        try {
          const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
          const appWindow = getCurrentWindow();
          if (!appWindow) return;
          
          // Base window dimensions configured in tauri.conf.json
          const baseW = 800;
          const baseH = 600;
          
          // Scale size proportionally to zoomPercent
          const scale = zoomPercent / 100;
          const newW = Math.round(baseW * scale);
          const newH = Math.round(baseH * scale);
          
          await appWindow.setSize(new LogicalSize(newW, newH));
        } catch (err) {
          console.warn("Window resize skipped or failed:", err);
        }
      }
    };
    updateWindowSize();
  }, [zoomPercent]);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    node: null
  });
  const textareaRef = React.useRef(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("cyber_theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("cyber_theme", theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const [activeMode, setActiveMode] = useState(() => {
    const savedMode = localStorage.getItem("cyber_active_mode");
    return savedMode === "notebook" || !savedMode ? "game_manager" : savedMode;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState(null);
  
  // Games state loaded from localStorage
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("cyber_games");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "1",
        name: "Arknights: Endfield",
        path: "C:\\Games\\ArknightsEndfield\\Endfield.exe",
        category: "RPG / Strategy",
        playTime: 124,
        lastPlayed: "2026-06-25",
        coverTheme: "yellow"
      },
      {
        id: "2",
        name: "Cyberpunk 2077",
        path: "C:\\Games\\Cyberpunk2077\\bin\\x64\\Cyberpunk2077.exe",
        category: "Action RPG",
        playTime: 256,
        lastPlayed: "2026-06-24",
        coverTheme: "purple"
      },
      {
        id: "3",
        name: "Genshin Impact",
        path: "C:\\Program Files\\Genshin Impact\\GenshinImpact.exe",
        category: "Action RPG",
        playTime: 512,
        lastPlayed: "2026-06-26",
        coverTheme: "green"
      }
    ];
  });

  const [addGameOpen, setAddGameOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState(null);
  const [newGameName, setNewGameName] = useState("");
  const [newGamePath, setNewGamePath] = useState("");
  const [newGameCategory, setNewGameCategory] = useState("RPG / Action");
  const [newGameTheme, setNewGameTheme] = useState("yellow");
  const [newGameIcon, setNewGameIcon] = useState(null);
  const [selectedGameActions, setSelectedGameActions] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("parameters");
  const [newGameUrls, setNewGameUrls] = useState([]);
  const [inlineGameUrl, setInlineGameUrl] = useState("");
  const [launchingGame, setLaunchingGame] = useState(null);
  const [launchLogs, setLaunchLogs] = useState([]);

  // Activity tracking and custom news states
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameActivities, setGameActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("cyber_game_activities");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });
  const [gameNews, setGameNews] = useState(() => {
    try {
      const saved = localStorage.getItem("cyber_game_news");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const [gameTasks, setGameTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("cyber_game_tasks");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });
  const [newTaskText, setNewTaskText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({});

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");

  const [obsidianNewsPaths, setObsidianNewsPaths] = useState(() => {
    try {
      const saved = localStorage.getItem("obsidian_news_paths");
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem("obsidian_news_path");
      return legacy ? { legacy } : {};
    } catch (_) {
      return {};
    }
  });
  const currentObsidianNewsPath = selectedGameId ? (obsidianNewsPaths[selectedGameId] || "") : "";
  const setObsidianNewsPath = (path) => {
    if (!selectedGameId) return;
    setObsidianNewsPaths(prev => ({
      ...prev,
      [selectedGameId]: path
    }));
  };

  const [isNewsPathPromptOpen, setIsNewsPathPromptOpen] = useState(false);
  const [selectedNewsPost, setSelectedNewsPost] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [chartType, setChartType] = useState(() => {
    return localStorage.getItem("cyber_chart_type") || "bar";
  });
  const [chartPeriod, setChartPeriod] = useState(() => {
    return localStorage.getItem("cyber_chart_period") || "week";
  });

  const [newActHours, setNewActHours] = useState("");
  const [newActNotes, setNewActNotes] = useState("");
  const [newActDate, setNewActDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [activeDaysCount, setActiveDaysCount] = useState(1);
  const [consecutiveStreak, setConsecutiveStreak] = useState(1);

  React.useEffect(() => {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayTime = new Date(todayStr).getTime();

      let savedDays = [];
      try {
        savedDays = JSON.parse(localStorage.getItem("noklin_active_days") || "[]");
      } catch (_) {}

      if (!savedDays.includes(todayStr)) {
        savedDays.push(todayStr);
        localStorage.setItem("noklin_active_days", JSON.stringify(savedDays));
      }
      setActiveDaysCount(savedDays.length);

      let streakData = { streak: 1, lastVisitDate: todayStr };
      try {
        const savedStreak = localStorage.getItem("noklin_streak_data");
        if (savedStreak) streakData = JSON.parse(savedStreak);
      } catch (_) {}

      if (streakData.lastVisitDate && streakData.lastVisitDate !== todayStr) {
        const lastVisitTime = new Date(streakData.lastVisitDate).getTime();
        const diffInDays = Math.round((todayTime - lastVisitTime) / (1000 * 60 * 60 * 24));

        if (diffInDays === 1) {
          streakData.streak += 1;
          streakData.lastVisitDate = todayStr;
        } else if (diffInDays >= 2) {
          streakData.streak = 1;
          streakData.lastVisitDate = todayStr;
        }
      } else if (!streakData.lastVisitDate) {
        streakData = { streak: 1, lastVisitDate: todayStr };
      }

      localStorage.setItem("noklin_streak_data", JSON.stringify(streakData));
      setConsecutiveStreak(streakData.streak);
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem("cyber_game_activities", JSON.stringify(gameActivities));
  }, [gameActivities]);

  React.useEffect(() => {
    localStorage.setItem("cyber_game_news", JSON.stringify(gameNews));
  }, [gameNews]);

  React.useEffect(() => {
    localStorage.setItem("cyber_game_tasks", JSON.stringify(gameTasks));
  }, [gameTasks]);

  React.useEffect(() => {
    localStorage.setItem("obsidian_news_paths", JSON.stringify(obsidianNewsPaths));
  }, [obsidianNewsPaths]);

  React.useEffect(() => {
    localStorage.setItem("cyber_chart_type", chartType);
  }, [chartType]);

  React.useEffect(() => {
    localStorage.setItem("cyber_chart_period", chartPeriod);
  }, [chartPeriod]);

  React.useEffect(() => {
    if (selectedGameId && !games.some(g => g.id === selectedGameId)) {
      setSelectedGameId(null);
    }
    setSelectedNewsPost(null);
  }, [games, selectedGameId]);

  const handleOpenObsidian = () => {
    if (!currentObsidianNewsPath.trim()) {
      setIsNewsPathPromptOpen(true);
    } else {
      const pathParam = currentObsidianNewsPath ? `?path=${encodeURIComponent(currentObsidianNewsPath)}` : "";
      invoke("open_url", { url: `obsidian://open${pathParam}` })
        .catch(err => console.error("Failed to open Obsidian:", err));
    }
  };

  const handleSyncObsidianNews = async () => {
    if (!currentObsidianNewsPath || !selectedGameId) return;
    setIsSyncing(true);
    try {
      const filesList = await invoke("read_vault_files", { path: currentObsidianNewsPath });
      const newPosts = [];
      
      for (const relPath of filesList) {
        if (relPath.endsWith(".md")) {
          try {
            const content = await invoke("read_file_content", {
              vaultPath: currentObsidianNewsPath,
              relPath: relPath
            });
            
            const parts = relPath.split('/');
            const fileName = parts[parts.length - 1].replace(/\.md$/i, "");
            
            let title = fileName;
            let body = content;
            
            const lines = content.split("\n");
            if (lines.length > 0 && lines[0].startsWith("# ")) {
              title = lines[0].replace(/^#\s+/, "").trim();
              body = lines.slice(1).join("\n").trim();
            }

            newPosts.push({
              id: relPath,
              title: title,
              text: body,
              imageUrl: "",
              date: "OBSIDIAN NOTE"
            });
          } catch (err) {
            console.error("Failed to read file:", relPath, err);
          }
        }
      }

      setGameNews(prev => {
        const current = prev[selectedGameId] || [];
        const manualPosts = current.filter(p => !p.id.endsWith(".md"));
        return {
          ...prev,
          [selectedGameId]: [...newPosts, ...manualPosts]
        };
      });
    } catch (err) {
      console.error("Failed to scan Obsidian files:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateDailyNote = async () => {
    if (!currentObsidianNewsPath || !currentObsidianNewsPath.trim() || !selectedGameId) {
      setIsNewsPathPromptOpen(true);
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const relPath = `${todayStr}.md`;

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

    try {
      if (isTauri) {
        try {
          await invoke("create_file", { vaultPath: currentObsidianNewsPath, relPath: relPath });
        } catch (e) {
          console.log("Daily note file already exists or notice:", e);
        }
      }
      await handleSyncObsidianNews();

      let targetPath = currentObsidianNewsPath.replace(/\\/g, '/');
      if (!targetPath.endsWith('/')) {
        targetPath += '/';
      }
      const fullNotePath = `${targetPath}${relPath}`;
      const pathParam = `?path=${encodeURIComponent(fullNotePath)}`;

      if (isTauri) {
        await invoke("open_url", { url: `obsidian://open${pathParam}` }).catch(err => {
          console.error("Failed to open Obsidian daily note:", err);
        });
      } else {
        window.open(`obsidian://open${pathParam}`, '_blank');
      }
    } catch (err) {
      console.error("Failed to create or open daily note:", err);
    }
  };

  const handleRenameNote = async (post, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === post.title) {
      setEditingNoteId(null);
      return;
    }

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    const isObsidianFile = post.id && post.id.endsWith(".md");

    if (isTauri && isObsidianFile && currentObsidianNewsPath) {
      try {
        const parts = post.id.split('/');
        parts[parts.length - 1] = `${trimmed}.md`;
        const newRelPath = parts.join('/');

        await invoke("rename_file", {
          vaultPath: currentObsidianNewsPath,
          oldRelPath: post.id,
          newRelPath: newRelPath
        });

        try {
          const content = await invoke("read_file_content", {
            vaultPath: currentObsidianNewsPath,
            relPath: newRelPath
          });
          const lines = content.split('\n');
          if (lines.length > 0 && lines[0].startsWith('# ')) {
            lines[0] = `# ${trimmed}`;
            await invoke("write_file_content", {
              vaultPath: currentObsidianNewsPath,
              relPath: newRelPath,
              content: lines.join('\n')
            });
          }
        } catch (e) {
          console.error("Failed to update H1 header in renamed note:", e);
        }

        await handleSyncObsidianNews();
      } catch (err) {
        console.error("Failed to rename note in Obsidian:", err);
      }
    } else {
      setGameNews(prev => ({
        ...prev,
        [selectedGameId]: (prev[selectedGameId] || []).map(p =>
          p.id === post.id ? { ...p, title: trimmed } : p
        )
      }));
    }

    setEditingNoteId(null);
  };

  const handleDeleteNote = async (post, e) => {
    if (e) e.stopPropagation();
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    const isObsidianFile = post.id && post.id.endsWith(".md");

    if (isTauri && isObsidianFile && currentObsidianNewsPath) {
      try {
        await invoke("delete_file", {
          vaultPath: currentObsidianNewsPath,
          relPath: post.id
        });
        await handleSyncObsidianNews();
      } catch (err) {
        console.error("Failed to delete note from Obsidian:", err);
      }
    } else {
      setGameNews(prev => ({
        ...prev,
        [selectedGameId]: (prev[selectedGameId] || []).filter(p => p.id !== post.id)
      }));
    }
  };

  const getChartData = () => {
    const logs = gameActivities[selectedGameId] || [];
    const hoursByDate = {};
    logs.forEach(log => {
      const d = log.date;
      hoursByDate[d] = (hoursByDate[d] || 0) + log.hours;
    });

    const now = new Date();
    const getLocalDateStr = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (chartPeriod === "week") {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = getLocalDateStr(d);
        const label = d.toLocaleDateString("ru-RU", { weekday: "short" });
        data.push({
          date: dateStr,
          label: label.toUpperCase(),
          hours: hoursByDate[dateStr] || 0
        });
      }
      return data;
    } else if (chartPeriod === "month") {
      const data = [];
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = getLocalDateStr(d);
        const label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" });
        data.push({
          date: dateStr,
          label: label,
          hours: hoursByDate[dateStr] || 0
        });
      }
      return data;
    } else {
      if (chartType === "github") {
        const data = [];
        for (let i = 364; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dateStr = getLocalDateStr(d);
          data.push({
            date: dateStr,
            hours: hoursByDate[dateStr] || 0
          });
        }
        return data;
      } else {
        const data = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(now.getMonth() - i);
          const year = d.getFullYear();
          const month = d.getMonth();
          const label = d.toLocaleDateString("ru-RU", { month: "short" }).toUpperCase();
          
          let monthHours = 0;
          logs.forEach(log => {
             const logDate = new Date(log.date);
             if (logDate.getFullYear() === year && logDate.getMonth() === month) {
               monthHours += log.hours;
             }
          });

          data.push({
            label: label,
            hours: monthHours
          });
        }
        return data;
      }
    }
  };

  // Automatic news scanning from Obsidian folder path
  React.useEffect(() => {
    handleSyncObsidianNews();
  }, [selectedGameId, currentObsidianNewsPath]);

  // Effect to scan all news posts and resolve images using currentObsidianNewsPath
  React.useEffect(() => {
    if (!selectedGameId || !currentObsidianNewsPath) return;
    const posts = gameNews[selectedGameId] || [];
    const imagesToResolve = [];
    const regex = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    
    posts.forEach(post => {
      let match;
      while ((match = regex.exec(post.text)) !== null) {
        const imageName = match[1].trim();
        if (!resolvedRef.current[imageName] && !imagesToResolve.includes(imageName)) {
          imagesToResolve.push(imageName);
        }
      }
    });

    if (imagesToResolve.length === 0) return;

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (isTauri) {
      const resolveImages = async () => {
        await Promise.all(
          imagesToResolve.map(async (imgName) => {
            try {
              const dataUrl = await invoke("read_image_base64", {
                vaultPath: currentObsidianNewsPath,
                filename: imgName
              });
              setResolvedImageUrls(prev => ({
                ...prev,
                [imgName]: dataUrl
              }));
            } catch (err) {
              console.error(`Failed to resolve news image ${imgName}:`, err);
              setResolvedImageUrls(prev => ({
                ...prev,
                [imgName]: "failed"
              }));
            }
          })
        );
      };
      resolveImages();
    }
  }, [gameNews, selectedGameId, currentObsidianNewsPath]);

  // Launch action selections
  const [executeLaunchGame, setExecuteLaunchGame] = useState(true);
  const [executeUrls, setExecuteUrls] = useState({});
  const [gameToDelete, setGameToDelete] = useState(null);

  React.useEffect(() => {
    if (selectedGameActions) {
      setExecuteLaunchGame(true);
      const urlChecks = {};
      if (selectedGameActions.urls) {
        selectedGameActions.urls.forEach((_, idx) => {
          urlChecks[idx] = true;
        });
      }
      setExecuteUrls(urlChecks);
    }
  }, [selectedGameActions]);

  // User Profile state
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("cyber_user_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      nickname: "Пользователь",
      birthDate: "",
      avatar: null
    };
  });

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");
  const [tempProfileBirthDate, setTempProfileBirthDate] = useState("");

  const [cropTarget, setCropTarget] = useState("gameIcon"); // "gameIcon" | "userAvatar"

  React.useEffect(() => {
    localStorage.setItem("cyber_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  const getDaysUntilBirthday = (birthDateStr) => {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split("-");
    if (parts.length !== 3) return null;
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    if (isNaN(birthMonth) || isNaN(birthDay)) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextBday = new Date(today.getFullYear(), birthMonth, birthDay);
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBday.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatBirthDate = (birthDateStr) => {
    if (!birthDateStr) return "";
    const parts = birthDateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return birthDateStr;
  };

  // Icon cropping states
  const [cropSrc, setCropSrc] = useState(null);
  const [imageAspect, setImageAspect] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (cropSrc) {
      const img = new Image();
      img.src = cropSrc;
      img.onload = () => {
        setImageAspect(img.width / img.height);
        setZoom(1);
        setDragPos({ x: 0, y: 0 });
      };
    }
  }, [cropSrc]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartDrag({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragPos({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartDrag({ x: e.touches[0].clientX - dragPos.x, y: e.touches[0].clientY - dragPos.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setDragPos({
      x: e.touches[0].clientX - startDrag.x,
      y: e.touches[0].clientY - startDrag.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropSave = () => {
    const img = new Image();
    img.src = cropSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      let renderW, renderH;
      const aspect = img.width / img.height;
      if (aspect > 1) {
        renderH = 160;
        renderW = 160 * aspect;
      } else {
        renderW = 160;
        renderH = 160 / aspect;
      }

      // Keep background transparent instead of black fill
      ctx.clearRect(0, 0, 256, 256);

      ctx.translate(128, 128);
      const scale = 256 / 160;
      ctx.translate(dragPos.x * scale, dragPos.y * scale);
      ctx.scale(zoom * scale, zoom * scale);
      
      ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

      const croppedBase64 = canvas.toDataURL("image/png");
      if (cropTarget === "userAvatar") {
        setUserProfile(prev => ({ ...prev, avatar: croppedBase64 }));
      } else {
        setNewGameIcon(croppedBase64);
      }
      setCropSrc(null);
    };
  };

  const [runningGames, setRunningGames] = useState(() => {
    const saved = localStorage.getItem("cyber_running_games");
    return saved ? JSON.parse(saved) : {};
  });
  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    localStorage.setItem("cyber_running_games", JSON.stringify(runningGames));
  }, [runningGames]);

  React.useEffect(() => {
    const hasRunning = Object.values(runningGames).some(Boolean);
    if (!hasRunning) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningGames]);

  const formatElapsed = (ms) => {
    if (!ms || ms < 0) return "00:00:00";
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  React.useEffect(() => {
    localStorage.setItem("cyber_games", JSON.stringify(games));
  }, [games]);

  React.useEffect(() => {
    localStorage.setItem("cyber_active_mode", activeMode);
  }, [activeMode]);

  // Active game playtime trackers
  const activeTrackers = React.useRef({});

  React.useEffect(() => {
    Object.keys(runningGames).forEach(gameId => {
      activeTrackers.current[gameId] = true;
    });
  }, []);

  // Helper to stop tracking and log the session
  const stopTrackingAndLog = React.useCallback((gameId) => {
    delete activeTrackers.current[gameId];

    setRunningGames(prev => {
      const startTime = prev[gameId];
      if (startTime) {
        const endTime = Date.now();
        const finalSessionHours = (endTime - startTime) / (3600 * 1000);

        if (finalSessionHours >= 0.0001) {
          const newSession = {
            id: Date.now().toString(),
            hours: Number(finalSessionHours.toFixed(5)),
            notes: "Автоматическая сессия",
            date: new Date().toISOString().split('T')[0]
          };

          setGameActivities(prevAct => {
            const current = prevAct[gameId] || [];
            return {
              ...prevAct,
              [gameId]: [newSession, ...current]
            };
          });

          setGames(prevGames => prevGames.map(g => {
            if (g.id === gameId) {
              const currentPlayTime = typeof g.playTime === 'number' ? g.playTime : 0;
              return {
                ...g,
                playTime: Number((currentPlayTime + finalSessionHours).toFixed(5)),
                lastPlayed: newSession.date
              };
            }
            return g;
          }));
        }
      }
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }, []);

  const handleStopGame = async (game) => {
    try {
      await invoke("stop_game", { path: game.path });
      stopTrackingAndLog(game.id);
    } catch (e) {
      console.error("Failed to stop game:", e);
      // Fallback: log session anyway if process failed to stop (e.g. process already exited)
      stopTrackingAndLog(game.id);
    }
  };

  // Start tracking playtime for a specific game
  const startTracking = React.useCallback((game) => {
    const startTime = Date.now();
    setRunningGames(prev => ({
      ...prev,
      [game.id]: startTime
    }));
    activeTrackers.current[game.id] = true;
  }, []);

  // Fetch missing icons for existing games on mount
  React.useEffect(() => {
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (!isTauri) return;

    const fetchMissingIcons = async () => {
      setGames(prev => {
        const hasMissing = prev.some(g => !g.icon && g.path);
        if (!hasMissing) return prev;

        Promise.all(prev.map(async (game) => {
          if (!game.icon && game.path) {
            try {
              const iconData = await invoke("get_game_icon", { path: game.path });
              return { ...game, icon: iconData };
            } catch (e) {
              console.error(`Failed to fetch icon for ${game.name}:`, e);
            }
          }
          return game;
        })).then(newGames => {
          const changed = newGames.some((g, i) => g.icon !== prev[i].icon);
          if (changed) {
            setGames(newGames);
          }
        });

        return prev;
      });
    };

    fetchMissingIcons();
  }, []);

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGameName || !newGamePath) return;

    let iconData = newGameIcon;
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    if (!iconData && isTauri) {
      try {
        iconData = await invoke("get_game_icon", { path: newGamePath });
      } catch (err) {
        console.error("Error getting game icon:", err);
      }
    }
    
    if (editingGameId) {
      setGames(prev => prev.map(g => {
        if (g.id === editingGameId) {
          return {
            ...g,
            name: newGameName,
            path: newGamePath,
            category: newGameCategory,
            coverTheme: newGameTheme,
            icon: iconData || g.icon,
            urls: newGameUrls
          };
        }
        return g;
      }));
      setEditingGameId(null);
    } else {
      const newGame = {
        id: Date.now().toString(),
        name: newGameName,
        path: newGamePath,
        category: newGameCategory,
        playTime: 0,
        lastPlayed: "Ни разу",
        coverTheme: newGameTheme,
        icon: iconData,
        urls: newGameUrls
      };
      setGames(prev => [...prev, newGame]);
    }
    
    setNewGameName("");
    setNewGamePath("");
    setNewGameCategory("RPG / Strategy");
    setNewGameTheme("yellow");
    setNewGameIcon(null);
    setNewGameUrls([]);
    setActiveModalTab("parameters");
    setAddGameOpen(false);
  };

  const handleDeleteGame = (id, e) => {
    if (e) e.stopPropagation();
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const handleAddGameOpenClick = () => {
    setEditingGameId(null);
    setNewGameName("");
    setNewGamePath("");
    setNewGameCategory("RPG / Strategy");
    setNewGameTheme("yellow");
    setNewGameIcon(null);
    setNewGameUrls([]);
    setActiveModalTab("parameters");
    setAddGameOpen(true);
  };

  const handleEditGameClick = (game) => {
    setEditingGameId(game.id);
    setNewGameName(game.name);
    setNewGamePath(game.path);
    setNewGameCategory(game.category);
    setNewGameTheme(game.coverTheme || "yellow");
    setNewGameIcon(game.icon || null);
    setNewGameUrls(game.urls || []);
    setActiveModalTab("parameters");
    setAddGameOpen(true);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleGameContextMenu = (e, game) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 190;
    const menuHeight = 100;
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
      node: game,
      isGame: true
    });
  };

  const handleGameContextAction = (action) => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    const game = contextMenu.node;
    if (!game) return;
    
    if (action === "delete") {
      setGameToDelete(game);
    } else if (action === "edit") {
      handleEditGameClick(game);
    }
  };

  const handleLaunchGame = async (game, runExecutable = true, urlsToOpen = []) => {
    setLaunchingGame(game);
    setLaunchLogs([
      "ИНИЦИАЛИЗАЦИЯ СИСТЕМНЫХ ПРОТОКОЛОВ...",
      `ПОДКЛЮЧЕНИЕ К ПРИЛОЖЕНИЮ: ${game.name.toUpperCase()}`,
      runExecutable ? `ИСПОЛНЯЕМЫЙ ФАЙЛ: ${game.path}` : "ЗАПУСК ИСПОЛНЯЕМОГО ФАЙЛА ОТМЕНЕН ПОЛЬЗОВАТЕЛЕМ.",
    ]);

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    await delay(700);
    setLaunchLogs(prev => [...prev, "ВЫДЕЛЕНИЕ ВИРТУАЛЬНОГО ПРОСТРАНСТВА..."]);
    await delay(600);
    setLaunchLogs(prev => [...prev, "ПРОВЕРКА БЕЗОПАСНОСТИ... СТАТУС: ОК"]);
    await delay(500);
    
    if (runExecutable) {
      setLaunchLogs(prev => [...prev, "ЗАПУСК ПРОЦЕССА..."]);
    } else {
      setLaunchLogs(prev => [...prev, "ПРОПУСК ЗАПУСКА ПРОЦЕССА (ТОЛЬКО ВЕБ-РЕЖИМ)..."]);
    }
    
    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
    
    if (isTauri) {
      try {
        if (runExecutable) {
          await invoke("launch_game", { path: game.path });
          setLaunchLogs(prev => [...prev, "УСПЕШНО: ДВИЖОК БЕЗОПАСНО ЗАПУЩЕН."]);
        }

        // Open selected URLs
        if (urlsToOpen.length > 0) {
          setLaunchLogs(prev => [...prev, "ОТКРЫТИЕ НАСТРОЕННЫХ ВЕБ-РЕСУРСОВ..."]);
          for (const url of urlsToOpen) {
            if (url && url.trim() !== "") {
              try {
                await invoke("open_url", { url });
                setLaunchLogs(prev => [...prev, `ОТКРЫТО: ${url}`]);
              } catch (e) {
                console.error("Failed to open URL:", e);
                setLaunchLogs(prev => [...prev, `ОШИБКА ОТКРЫТИЯ URL: ${url}`]);
              }
            }
          }
        }
        
        if (runExecutable) {
          setGames(prev => prev.map(g => {
            if (g.id === game.id) {
              return {
                ...g,
                lastPlayed: new Date().toISOString().split('T')[0]
              };
            }
            return g;
          }));

          setTimeout(() => {
            startTracking(game);
          }, 5000);
        }
        
        await delay(1000);
        setLaunchingGame(null);
      } catch (err) {
        setLaunchLogs(prev => [...prev, `КРИТИЧЕСКАЯ ОШИБКА: ${err}`]);
        await delay(3000);
        setLaunchingGame(null);
      }
    } else {
      setLaunchLogs(prev => [
        ...prev,
        "[ДЕМО РЕЖИМ] ТАУРИ ДВИЖОК НЕ ОБНАРУЖЕН.",
        runExecutable ? `[ДЕМО РЕЖИМ] СОЗДАН ЭМУЛИРУЕМЫЙ ПРОЦЕСС В ФОНЕ.` : `[ДЕМО РЕЖИМ] ПРОЦЕСС ПРОПУЩЕН.`,
        "УСПЕШНО: ИМИТАЦИЯ ПРОТОКОЛА ЗАПУСКА СВЕРШЕНА."
      ]);

      if (urlsToOpen.length > 0) {
        setLaunchLogs(prev => [
          ...prev,
          "[ДЕМО РЕЖИМ] ИМИТАЦИЯ ОТКРЫТИЯ ВЕБ-РЕСУРСОВ...",
          ...urlsToOpen.map(url => `[ДЕМО] ОТКРЫТО: ${url}`)
        ]);
      }
      
      if (runExecutable) {
        setGames(prev => prev.map(g => {
          if (g.id === game.id) {
            return {
              ...g,
              lastPlayed: new Date().toISOString().split('T')[0]
            };
          }
          return g;
        }));

        // In demo mode, simulate adding 0.05 hours after 5 seconds
        setTimeout(() => {
          setGames(prev => prev.map(g => {
            if (g.id === game.id) {
              const currentPlayTime = typeof g.playTime === 'number' ? g.playTime : 0;
              return {
                ...g,
                playTime: Number((currentPlayTime + 0.05).toFixed(5))
              };
            }
            return g;
          }));
        }, 5000);
      }
      
      await delay(1800);
      setLaunchingGame(null);
    }
  };

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


  // Track current active file ref to cancel stale requests when switching notes
  React.useEffect(() => {
    activeFileRef.current = selectedFile;
  }, [selectedFile]);

  // Helper to check valid image extensions
  const isImageExtension = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "avif"].includes(ext);
  };

  const normalizeImageReference = (value = "") => {
    let result = String(value).trim();
    try {
      result = decodeURIComponent(result);
    } catch (_) {}
    result = result.replace(/\\/g, "/").replace(/^<|>$/g, "");
    const pipeIndex = result.indexOf("|");
    if (pipeIndex !== -1) {
      result = result.slice(0, pipeIndex);
    }
    return result.trim();
  };

  const createImageStateKey = (notePath, imageReference) => {
    return [
      notePath || "unknown-note",
      normalizeImageReference(imageReference),
    ].join("::");
  };

  const imageRequestsRef = React.useRef(new Set());
  const imageObjectUrlsRef = React.useRef(new Set());
  const imageEffectRunCountRef = React.useRef(0);

  const setImageLoading = (imageKey) => {
    if (import.meta.env.DEV) {
      console.error("[IMAGE STATE] loading", { imageKey });
    }
    setImageStateMap((prev) => ({
      ...prev,
      [imageKey]: { status: "loading" },
    }));
  };

  const setImageSuccess = (imageKey, url) => {
    if (import.meta.env.DEV) {
      console.error("[IMAGE STATE] success", { imageKey, url });
    }
    setImageStateMap((prev) => ({
      ...prev,
      [imageKey]: { status: "success", url },
    }));
  };

  const setImageError = (imageKey, message) => {
    if (import.meta.env.DEV) {
      console.error("[IMAGE STATE] error", { imageKey, message });
    }
    setImageStateMap((prev) => ({
      ...prev,
      [imageKey]: {
        status: "error",
        message: message || "Не удалось загрузить изображение",
      },
    }));
  };

  const normalizeImageBytes = (result) => {
    if (result instanceof Uint8Array) {
      return result;
    }
    if (result instanceof ArrayBuffer) {
      return new Uint8Array(result);
    }
    if (Array.isArray(result)) {
      return Uint8Array.from(result);
    }
    if (result && typeof result === "object" && Array.isArray(result.data)) {
      return Uint8Array.from(result.data);
    }
    throw new Error(
      `Неизвестный формат бинарного ответа: ${
        result?.constructor?.name ?? typeof result
      }`
    );
  };

  const getImageMimeType = (path) => {
    const cleanPath = path.split("|")[0].toLowerCase();
    if (cleanPath.endsWith(".png")) return "image/png";
    if (cleanPath.endsWith(".jpg") || cleanPath.endsWith(".jpeg")) return "image/jpeg";
    if (cleanPath.endsWith(".webp")) return "image/webp";
    if (cleanPath.endsWith(".gif")) return "image/gif";
    if (cleanPath.endsWith(".bmp")) return "image/bmp";
    if (cleanPath.endsWith(".avif")) return "image/avif";
    if (cleanPath.endsWith(".svg")) return "image/svg+xml";
    throw new Error("Формат изображения не поддерживается");
  };

  const loadLocalImage = async (imageReference, vPath, notePath) => {
    const normalizedReference = normalizeImageReference(imageReference);
    const imageKey = createImageStateKey(notePath, normalizedReference);

    if (import.meta.env.DEV) {
      console.error("[IMAGE REFERENCE]", {
        originalReference: imageReference,
        normalizedReference,
        notePath,
        imageKey,
      });
    }

    if (imageRequestsRef.current.has(imageKey)) {
      if (import.meta.env.DEV) {
        console.error("[IMAGE LOAD SKIPPED] already requested", imageKey);
      }
      return;
    }
    imageRequestsRef.current.add(imageKey);

    const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

    if (import.meta.env.DEV) {
      console.error("[IMAGE LOAD START]", {
        imageKey,
        originalReference: imageReference,
        normalizedReference,
        notePath,
        vaultPath: vPath,
        isTauri,
      });
    }

    setImageLoading(imageKey);

    if (!isTauri) {
      const demoUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop";
      setImageSuccess(imageKey, demoUrl);
      return;
    }

    if (!vPath) {
      setImageError(imageKey, "Путь к Obsidian-хранилищу не настроен");
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.error("[IMAGE BEFORE INVOKE]", {
          command: "load_note_image_bytes",
          arguments: {
            vaultPath: vPath,
            notePath: notePath || null,
            imgRef: normalizedReference,
            customImagesPath: customImagesPath.trim() || null,
          },
        });
      }

      const result = await Promise.race([
        invoke("load_note_image_bytes", {
          vaultPath: vPath,
          notePath: notePath || null,
          imgRef: normalizedReference,
          customImagesPath: customImagesPath.trim() || null,
        }),
        new Promise((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("Загрузка изображения превысила 10 секунд"));
          }, 10000);
        }),
      ]);

      if (import.meta.env.DEV) {
        console.error("[IMAGE INVOKE RESOLVED]", {
          type: typeof result,
          constructor: result?.constructor?.name,
          isArray: Array.isArray(result),
          length: result?.length,
          byteLength: result?.byteLength,
          keys: result && typeof result === "object" ? Object.keys(result) : [],
        });
      }

      const bytes = normalizeImageBytes(result);

      if (import.meta.env.DEV) {
        console.error("[IMAGE BYTES]", {
          length: bytes.length,
          firstBytes: Array.from(bytes.slice(0, 16)),
        });
      }

      if (bytes.length === 0) {
        throw new Error("Получен пустой файл");
      }

      const mimeType = getImageMimeType(normalizedReference);
      const blob = new Blob([bytes], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      imageObjectUrlsRef.current.add(objectUrl);

      if (import.meta.env.DEV) {
        console.error("[IMAGE BLOB]", {
          size: blob.size,
          type: blob.type,
          objectUrl,
        });
      }

      setImageSuccess(imageKey, objectUrl);
    } catch (error) {
      imageRequestsRef.current.delete(imageKey);
      const message = error instanceof Error ? error.message : String(error);
      console.error("[IMAGE LOAD] failed", { imageKey, error });
      setImageError(imageKey, message);
    }
  };

  // Revoke Blob URLs on unmount only
  React.useEffect(() => {
    return () => {
      for (const url of imageObjectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      imageObjectUrlsRef.current.clear();
    };
  }, []);

  // Clear request cache when switching selected file
  React.useEffect(() => {
    imageRequestsRef.current.clear();
  }, [selectedFile]);

  // Resolve Obsidian-style wiki & standard markdown attachments asynchronously for active note
  React.useEffect(() => {
    if (!selectedFileContent) return;

    imageEffectRunCountRef.current += 1;
    if (import.meta.env.DEV) {
      console.error("[IMAGE EFFECT RUN]", {
        count: imageEffectRunCountRef.current,
        selectedFile,
        vaultPath,
      });
    }

    const currentFile = selectedFile;
    const regex = /!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]|!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    const imagesToResolve = [];

    while ((match = regex.exec(selectedFileContent)) !== null) {
      const isWiki = !!match[1];
      const rawPath = (isWiki ? match[1] : match[4] || '').trim();

      if (!rawPath) continue;
      if (rawPath.startsWith("http://") || rawPath.startsWith("https://") || rawPath.startsWith("data:")) continue;

      if (isWiki && !isImageExtension(rawPath)) {
        continue;
      }

      const normalizedRef = normalizeImageReference(rawPath);
      const key = createImageStateKey(currentFile, normalizedRef);
      if (!imageStateMap[key] && !imagesToResolve.includes(rawPath)) {
        imagesToResolve.push(rawPath);
      }
    }

    if (imagesToResolve.length === 0) return;

    imagesToResolve.forEach((imgRef) => {
      loadLocalImage(imgRef, vaultPath, currentFile);
    });
  }, [selectedFileContent, selectedFile, vaultPath, customImagesPath]);

  const renderWikiImage = (imgRef, altOrWidth, key) => {
    const normalizedReference = normalizeImageReference(imgRef);
    const imageKey = createImageStateKey(selectedFile, normalizedReference);
    const state = imageStateMap[imageKey];

    if (import.meta.env.DEV) {
      console.error("[IMAGE RENDER]", {
        imgRef,
        normalizedReference,
        imageKey,
        state,
        availableKeys: Object.keys(imageStateMap),
      });
    }

    let widthVal = null;
    let altText = null;

    if (altOrWidth) {
      const trimmed = altOrWidth.trim();
      if (/^\d+$/.test(trimmed)) {
        widthVal = parseInt(trimmed, 10);
      } else {
        altText = trimmed;
      }
    }

    if (!state) {
      return (
        <div
          key={key}
          style={widthVal ? { width: `${widthVal}px` } : { maxWidth: "100%" }}
          className="my-3 border border-cyber-purple/20 bg-[#0c0818]/60 rounded-lg p-3 flex items-center justify-center gap-2 text-cyber-purple font-mono text-[10px] uppercase tracking-wider"
        >
          <span className="w-3 h-3 border border-cyber-purple border-t-transparent rounded-full animate-spin shrink-0" />
          <span>ПОДГОТОВКА ИЗОБРАЖЕНИЯ...</span>
        </div>
      );
    }

    if (state.status === "loading") {
      return (
        <div
          key={key}
          style={widthVal ? { width: `${widthVal}px` } : { maxWidth: "100%" }}
          className="my-3 border border-cyber-purple/30 bg-[#0c0818]/90 rounded-lg p-4 flex flex-col items-center justify-center gap-2.5 h-36 shadow-lg min-w-[240px]"
        >
          <div className="flex items-center gap-2 text-cyber-purple font-mono text-[10px] font-bold uppercase tracking-wider">
            <span className="w-3.5 h-3.5 border-2 border-cyber-purple border-t-transparent rounded-full animate-spin shrink-0" />
            <span>ЗАГРУЗКА ИЗОБРАЖЕНИЯ...</span>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyber-purple/20 p-0.5">
            <div className="h-full bg-gradient-to-r from-cyber-purple to-cyber-green rounded-full animate-pulse shadow-[0_0_8px_rgba(176,38,255,0.5)] w-full" />
          </div>
          <span className="text-[9px] text-gray-400 font-mono truncate max-w-full px-2 bg-black/40 py-0.5 rounded border border-white/5">
            {normalizedReference}
          </span>
        </div>
      );
    }

    if (state.status === "error") {
      return (
        <div
          key={key}
          style={widthVal ? { width: `${widthVal}px` } : { maxWidth: "100%" }}
          className="my-3 border border-red-500/30 bg-red-950/20 rounded-lg p-3 flex items-center gap-3 text-red-300 shadow-md max-w-full"
        >
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <div className="font-mono text-xs overflow-hidden">
            <div className="font-bold text-red-400 uppercase tracking-wide text-[11px]">
              НЕ УДАЛОСЬ ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
            </div>
            <div className="text-[10px] text-gray-400 truncate mt-0.5">
              {normalizedReference}
            </div>
            {import.meta.env.DEV && (
              <div className="text-[9px] text-red-500/80 mt-1 font-mono">
                {state.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <img
        key={key}
        src={state.url}
        alt={altText || normalizedReference}
        style={{ width: widthVal || 'auto' }}
        className="max-w-full rounded block"
      />
    );
  };

  const parseInlineMarkdown = (text) => {
    if (!text) return "";
    
    let html = text;

    // 1. Process wiki images (ONLY if valid image extension)
    // ![[img/screenshot.png|500]] or ![[screenshot.png|Описание]] or ![[img/screenshot.png]]
    html = html.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (match, path, meta) => {
      const cleanPath = path.trim();
      if (!isImageExtension(cleanPath)) {
        return match; // Keep unchanged if it's a note embed like ![[Note]]
      }
      const metaAttr = meta ? ` meta="${meta.trim()}"` : '';
      return `<wiki-image ref="${cleanPath}"${metaAttr}></wiki-image>`;
    });

    // Standard markdown images: ![alt](img/screenshot.png) or ![alt](https://...)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const cleanSrc = src.trim();
      if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://") || cleanSrc.startsWith("data:")) {
        return `<img src="${cleanSrc}" alt="${alt}" style="max-width:100%;max-height:480px;" class="my-3 rounded" />`;
      }
      const metaAttr = alt ? ` meta="${alt.trim()}"` : '';
      return `<wiki-image ref="${cleanSrc}"${metaAttr}></wiki-image>`;
    });

    // 2. Process Highlights (Obsidian compatible, styled as colored markers)
    html = html.replace(/==\*\*\*([^*=]+)\*\*\*==/g, '<mark-purple>$1</mark-purple>');
    html = html.replace(/==___([^_=]+)___==/g, '<mark-purple>$1</mark-purple>');
    html = html.replace(/==\*\*([^*=]+)\*\*==/g, '<mark-pink>$1</mark-pink>');
    html = html.replace(/==__([^_=]+)__==/g, '<mark-pink>$1</mark-pink>');
    html = html.replace(/==\*([^*=]+)\*==/g, '<mark-blue>$1</mark-blue>');
    html = html.replace(/==_([^_=]+)_==/g, '<mark-blue>$1</mark-blue>');
    html = html.replace(/==([^=]+)==/g, '<mark-green>$1</mark-green>');

    // 3. Process Bold Italic
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*_(.+?)_\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__\*(.+?)\*__/g, '<strong><em>$1</em></strong>');

    // 4. Process Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 5. Process Italic
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
        const refMatch = part.match(/ref="([^"]*)"/);
        const metaMatch = part.match(/meta="([^"]*)"/);
        const ref = refMatch ? refMatch[1] : "";
        const meta = metaMatch ? metaMatch[1] : "";
        stack[stack.length - 1].children.push(
          renderWikiImage(ref, meta, Math.random())
        );
      } else if (part === "</wiki-image>") {
        // Ignore
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
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${ isChecked ? "bg-cyber-green/20 border-cyber-green text-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.3)]" : "border-cyber-purple/45 text-transparent hover:border-cyber-purple" }`}>
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

      // Standalone Wiki Images (ONLY if image extension)
      const wikiImageMatch = line.match(/^\s*!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]\s*$/);
      if (wikiImageMatch) {
        const imgRef = wikiImageMatch[1].trim();
        if (isImageExtension(imgRef)) {
          const meta = wikiImageMatch[2] ? wikiImageMatch[2].trim() : null;
          elements.push(renderWikiImage(imgRef, meta, idx));
          return;
        }
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

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // Zoom in
          setZoomPercent(prev => {
            const next = Math.min(prev + 5, 200);
            localStorage.setItem("cyber_zoom", next);
            return next;
          });
        } else if (e.deltaY > 0) {
          // Zoom out
          setZoomPercent(prev => {
            const next = Math.max(prev - 5, 70);
            localStorage.setItem("cyber_zoom", next);
            return next;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
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
      case "open-obsidian": {
        if (node && node.path) {
          openFileInObsidian(node.path);
        }
        break;
      }
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
      
      // Save running games session data before exit
      const runningIds = Object.keys(runningGames);
      if (runningIds.length > 0) {
        let updatedGames = [...games];
        let updatedActivities = { ...gameActivities };
        const endTime = Date.now();
        let changed = false;

        for (const gameId of runningIds) {
          const startTime = runningGames[gameId];
          if (startTime) {
            const finalSessionHours = (endTime - startTime) / (3600 * 1000);
            if (finalSessionHours >= 0.0001) {
              const newSession = {
                id: (Date.now() + Math.random()).toString(),
                hours: Number(finalSessionHours.toFixed(5)),
                notes: "Автоматическая сессия (при выходе)",
                date: new Date().toISOString().split('T')[0]
              };
              
              updatedActivities[gameId] = [newSession, ...(updatedActivities[gameId] || [])];
              updatedGames = updatedGames.map(g => {
                if (g.id === gameId) {
                  const currentPlayTime = typeof g.playTime === 'number' ? g.playTime : 0;
                  return {
                    ...g,
                    playTime: Number((currentPlayTime + finalSessionHours).toFixed(5)),
                    lastPlayed: newSession.date
                  };
                }
                return g;
              });
              changed = true;
            }
          }
        }

        if (changed) {
          localStorage.setItem("cyber_games", JSON.stringify(updatedGames));
          localStorage.setItem("cyber_game_activities", JSON.stringify(updatedActivities));
          setGames(updatedGames);
          setGameActivities(updatedActivities);
        }
        localStorage.removeItem("cyber_running_games");
        setRunningGames({});
      }

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

  const handleSidebarBackgroundClick = (e) => {
    if (e.target.closest('button, input, textarea, form, a, [role="button"], .cursor-pointer')) {
      return;
    }
    setSidebarCollapsed(prev => !prev);
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
          <>
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
            <motion.aside 
              onClick={handleSidebarBackgroundClick}
              initial={false}
              animate={{
                width: sidebarCollapsed ? 64 : 288,
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`bg-cyber-sidebar/85 backdrop-blur-lg border-r border-cyber-purple/20 flex flex-col justify-between z-10 relative shadow-[5px_0_25px_rgba(0,0,0,0.5)] shrink-0 select-none overflow-hidden ${sidebarCollapsed ? "items-center p-2 md:p-2" : "p-4 md:p-5"}`}
            >
              <div className="flex flex-col h-full w-full pt-1 overflow-hidden">
                {/* App Header */}
                <div 
                  onMouseEnter={(e) => showGlobalTooltip(e, activeMode === "game_manager" ? "CYBER-GAMES TERMINAL" : activeMode === "stats" ? "CYBER-STATS TERMINAL" : "CYBER-NOTES TERMINAL", activeMode === "game_manager" ? "yellow" : activeMode === "stats" ? "purple" : "green")}
                  onMouseLeave={hideGlobalTooltip}
                  onClick={() => { if (activeMode === "game_manager") { setSelectedGameId(null); } }} className={`flex items-center gap-3 mb-8 shrink-0 cursor-pointer ${sidebarCollapsed ? "justify-center pt-1" : ""}`}
                >
                  <div className={`w-10 h-10 rounded border flex items-center justify-center shrink-0 transition-all ${ activeMode === "game_manager" ? "border-cyber-yellow bg-cyber-yellow/10 shadow-[0_0_10px_rgba(255,183,0,0.3)]" : activeMode === "stats" ? "border-cyber-purple bg-cyber-purple/10 shadow-[0_0_10px_rgba(176,38,255,0.3)]" : "border-cyber-green bg-cyber-green/10 shadow-[0_0_10px_rgba(0,255,102,0.3)]" }`}>
                    {activeMode === "game_manager" ? (
                      <Layers className="w-6 h-6 text-cyber-yellow animate-pulse" />
                    ) : activeMode === "stats" ? (
                      <BarChart2 className="w-6 h-6 text-cyber-purple animate-pulse" />
                    ) : (
                      <Cpu className="w-6 h-6 text-cyber-green animate-pulse" />
                    )}
                  </div>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        <h1 className={`text-xl font-black tracking-widest font-mono transition-all ${activeMode === "game_manager" ? "neon-text-yellow" : activeMode === "stats" ? "neon-text-purple" : "neon-text-green"}`}>
                          {activeMode === "game_manager" ? "CYBER-GAMES" : activeMode === "stats" ? "CYBER-STATS" : "CYBER-NOTES"}
                        </h1>
                        <p className="text-[10px] text-cyber-purple uppercase tracking-widest font-mono">
                          {activeMode === "game_manager" ? "Launcher Module" : activeMode === "stats" ? "Analytics Hub" : "Stage 1 Terminal"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sidebar Navigation Tabs */}
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed ? (
                    <motion.div 
                      key="expanded-tabs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="flex items-center gap-1 bg-[#06040c]/70 p-1 rounded-lg border border-cyber-purple/20 mb-4 shrink-0 font-mono text-[10px] select-none shadow-inner overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMode("game_manager")}
                        onMouseEnter={(e) => showGlobalTooltip(e, "Игровой менеджер", "yellow")}
                        onMouseLeave={hideGlobalTooltip}
                        className={`flex-1 h-8 px-2 rounded-md flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap border ${
                          activeMode === "game_manager"
                            ? "bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/40 shadow-[0_0_8px_rgba(255,183,0,0.15)] font-bold"
                            : "text-gray-400 hover:text-white border-transparent hover:bg-white/5"
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate whitespace-nowrap">Игры</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="collapsed-tabs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-center gap-1.5 mb-3 shrink-0 select-none"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMode("game_manager")}
                        onMouseEnter={(e) => showGlobalTooltip(e, "ИГРОВОЙ МЕНЕДЖЕР", "yellow")}
                        onMouseLeave={hideGlobalTooltip}
                        className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${
                          activeMode === "game_manager"
                            ? "border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow shadow-[0_0_8px_rgba(255,183,0,0.3)]"
                            : "border-gray-700/40 text-gray-400 hover:text-white hover:border-gray-500"
                        }`}
                      >
                        <Gamepad2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sidebar Main Content */}
                {activeMode === "game_manager" ? (
                  // Game Manager Mode Sidebar
                  sidebarCollapsed ? (
                    <div className="flex-1 flex flex-col items-center gap-4 mt-4 w-full select-none">
                      <div className="flex-1 w-full overflow-y-auto space-y-3 flex flex-col items-center pl-2 pr-1 pb-2">
                        {/* Overview switcher button */}
                        <button
                          onClick={() => setSelectedGameId(null)}
                          onMouseEnter={(e) => showGlobalTooltip(e, "ОБЗОР (ВСЕ ИГРЫ)", "yellow")}
                          onMouseLeave={hideGlobalTooltip}
                          className={`w-8 h-8 rounded border flex items-center justify-center transition-all duration-300 shrink-0 ${ selectedGameId === null ? "border-cyber-yellow bg-cyber-yellow/15 shadow-[0_0_8px_rgba(255,183,0,0.3)] text-cyber-yellow" : "border-cyber-yellow/20 hover:border-cyber-yellow bg-cyber-yellow/5 hover:bg-cyber-yellow/10 text-cyber-yellow" }`}
                        >
                          <Compass className="w-4 h-4" />
                        </button>
                        
                        <div className="w-6 h-[1px] bg-cyber-yellow/20 my-1 shrink-0" />

                        {games.map(game => (
                          <button
                            key={game.id}
                            onClick={() => setSelectedGameId(selectedGameId === game.id ? null : game.id)}
                            onMouseEnter={(e) => showGlobalTooltip(e, `ОТКРЫТЬ: ${game.name}`, "yellow")}
                            onMouseLeave={hideGlobalTooltip}
                            className={`w-8 h-8 rounded border flex items-center justify-center transition-all duration-300 relative group shrink-0 overflow-hidden ${ selectedGameId === game.id ? "border-cyber-yellow bg-cyber-yellow/15 shadow-[0_0_8px_rgba(255,183,0,0.3)] text-cyber-yellow" : "border-cyber-yellow/20 hover:border-cyber-yellow bg-cyber-yellow/5 hover:bg-cyber-yellow/10 text-cyber-yellow" }`}
                          >
                            {game.icon ? (
                              <img src={game.icon} alt="" className="w-5 h-5 object-contain rounded" />
                            ) : (
                              <Gamepad2 className="w-4 h-4" />
                            )}
                          </button>
                        ))}
                        <button
                          onClick={handleAddGameOpenClick}
                          onMouseEnter={(e) => showGlobalTooltip(e, "ДОБАВИТЬ ИГРУ", "yellow")}
                          onMouseLeave={hideGlobalTooltip}
                          className="w-8 h-8 rounded border border-dashed border-cyber-yellow/30 hover:border-cyber-yellow text-gray-500 hover:text-cyber-yellow flex items-center justify-center transition-all shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.08 }}
                      className="flex-1 flex flex-col overflow-hidden select-none"
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-400 font-mono mb-4 p-1 rounded border border-transparent hover:border-cyber-yellow/35 hover:bg-cyber-yellow/5 transition-all shrink-0 overflow-hidden">
                        <span className="flex items-center gap-1.5 text-cyber-yellow font-bold">
                          <Gamepad className="w-4 h-4" />
                          СИСТЕМНЫЕ ИГРЫ
                        </span>
                        <button
                          onClick={handleAddGameOpenClick}
                          className="p-1 rounded border border-transparent hover:border-cyber-yellow/30 text-gray-400 hover:text-cyber-yellow hover:bg-cyber-yellow/5 transition-all flex items-center justify-center"
                          title="Добавить новую игру"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Games list in sidebar */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                        {/* Overview selector */}
                        <div
                          onClick={() => setSelectedGameId(null)}
                          className={`border rounded p-2 flex items-center gap-2.5 transition-colors group overflow-hidden ${ selectedGameId === null ? "border-cyber-yellow bg-[#ffb700]/10 shadow-[0_0_10px_rgba(255,183,0,0.15)] text-white" : "border-cyber-yellow/15 bg-transparent hover:border-cyber-yellow/45 text-gray-400 hover:text-white" }`}
                        >
                          <Compass className="w-4 h-4 text-cyber-yellow shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-xs font-bold truncate">ОБЗОР ВСЕХ ИГР</span>
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase tracking-wider">Все модули</span>
                          </div>
                        </div>

                        {games.length === 0 ? (
                          <div className="h-32 border border-dashed border-cyber-yellow/10 rounded flex flex-col items-center justify-center text-center p-4">
                            <Gamepad className="w-8 h-8 text-gray-600 mb-2" />
                            <p className="text-xs text-gray-500 font-mono">Нет установленных игр.</p>
                          </div>
                        ) : (
                          games.map(game => (
                            <div 
                              key={game.id}
                              onClick={() => setSelectedGameId(selectedGameId === game.id ? null : game.id)}
                              onContextMenu={(e) => handleGameContextMenu(e, game)}
                              className={`sidebar-game-item border rounded p-2 flex items-center justify-between transition-colors group cursor-pointer ${ selectedGameId === game.id ? "is-selected border-cyber-yellow bg-[#ffb700]/10 shadow-[0_0_10px_rgba(255,183,0,0.15)]" : "border-cyber-yellow/15 bg-[#ffb700]/5 hover:border-cyber-yellow/45" }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {game.icon ? (
                                  <img src={game.icon} alt="" className="w-5 h-5 object-contain rounded shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
                                ) : (
                                  <Gamepad className="w-5 h-5 text-cyber-yellow/60 shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="sidebar-game-name font-mono text-xs font-bold text-gray-200 truncate">{game.name}</span>
                                  <span className="sidebar-game-category text-[9px] text-gray-500 font-mono mt-0.5 uppercase tracking-wider">{game.category}</span>
                                </div>
                              </div>
                              <ChevronRight className="sidebar-game-arrow w-4 h-4 text-cyber-yellow/40 group-hover:text-cyber-yellow group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          ))
                        )}
                      </div>

                      {/* User Profile & Hours Block (Moved to Bottom) */}
                      <div className="bg-[#ffcc00]/5 border border-cyber-yellow/20 rounded-xl p-3 mt-3 font-mono text-[10px] space-y-2.5 shrink-0">
                        {/* Profile Info: Avatar + Nickname & Birthday (2 lines) */}
                        <div className="flex items-center gap-2.5">
                          {/* Square photo with rounded corners spanning 2 lines height */}
                          <div className="relative group w-10 h-10 rounded-lg bg-black/50 border border-cyber-yellow/30 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                            {userProfile.avatar ? (
                              <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-cyber-yellow/70" />
                            )}
                            {/* Hover Edit Overlay: edit icon centered */}
                            <label
                              className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-cyber-yellow"
                              title="Изменить фото профиля"
                            >
                              <Camera className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCropTarget("userAvatar");
                                      setCropSrc(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Details: Row 1 Nickname & Edit, Row 2 Birthday & Countdown */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-white text-xs truncate leading-tight" title={userProfile.nickname || "Пользователь"}>
                                {userProfile.nickname || "Пользователь"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTempProfileName(userProfile.nickname || "");
                                  setTempProfileBirthDate(userProfile.birthDate || "");
                                  setEditProfileOpen(true);
                                }}
                                className="p-0.5 text-gray-400 hover:text-cyber-yellow transition-colors shrink-0"
                                title="Редактировать профиль"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-gray-400 text-[9px] truncate leading-tight">
                              {userProfile.birthDate ? (
                                (() => {
                                  const formatted = formatBirthDate(userProfile.birthDate);
                                  const days = getDaysUntilBirthday(userProfile.birthDate);
                                  return `${formatted}${days !== null ? ` (до д/р ${days} дн.)` : ''}`;
                                })()
                              ) : (
                                <span className="text-gray-500 italic">Д/Р не указан</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="h-[1px] bg-cyber-yellow/15 w-full" />

                        {/* Row 3: Total Hours */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">ВСЕГО ЧАСОВ:</span>
                          <span className="text-white font-bold">{formatPlayTime(games.reduce((acc, g) => acc + (typeof g.playTime === 'number' ? g.playTime : 0), 0))}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                ) : (
                  // File Tree View
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
                              onSelectFile={(filePath) => {
                                setSelectedFile(filePath);
                                openFileInObsidian(filePath);
                              }}
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
                          Файлы хранилища
                        </span>
                        <div className="flex items-center gap-2">
                          {connected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateFile("");
                                }}
                              className="p-1 rounded border border-transparent hover:border-cyber-green/30 text-gray-400 hover:text-cyber-green hover:bg-cyber-green/5 transition-all flex items-center justify-center"
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
                              className={`p-1 rounded border transition-all ${ showConnection ? "bg-cyber-purple/20 border-cyber-purple/50 text-cyber-purple shadow-[0_0_8px_rgba(176,38,255,0.2)]" : "bg-transparent border-transparent text-gray-400 hover:text-cyber-green hover:border-cyber-green/30" }`}
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
                            <p className="text-xs text-gray-500 font-mono">Хранилище не подключено.</p>
                          </div>
                        ) : (
                          buildFileTree(files).children.map((child, idx) => (
                            <FileTreeNode
                              key={idx}
                              node={child}
                              depth={0}
                              selectedFile={selectedFile}
                              onSelectFile={(filePath) => {
                                setSelectedFile(filePath);
                                openFileInObsidian(filePath);
                              }}
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
                )}

                {/* Separator (only shown if connection panel is visible) */}
                {activeMode === "notebook" && shouldShowConnection && (
                  <div className="h-[1px] bg-cyber-purple/10 w-full my-3 shrink-0" />
                )}

                {/* Connection Input Panel / Button */}
                {activeMode === "notebook" && shouldShowConnection && (
                  sidebarCollapsed ? (
                    <div className="mb-6 flex justify-center shrink-0">
                      <button
                        onClick={() => setSidebarCollapsed(false)}
                        onMouseEnter={(e) => showGlobalTooltip(e, "ПОДКЛЮЧИТЬ ХРАНИЛИЩЕ", "purple")}
                        onMouseLeave={hideGlobalTooltip}
                        className="w-10 h-10 rounded border bg-[#06040c]/40 hover:bg-cyber-purple/10 flex items-center justify-center transition-all group relative shrink-0 border-cyber-purple/30 text-cyber-purple shadow-[0_0_10px_rgba(176,38,255,0.15)]"
                      >
                        <Link className="w-5 h-5 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConnect} className="mb-6 bg-[#06040c]/60 backdrop-blur-md p-4 rounded border border-cyber-purple/25 shadow-lg shrink-0">
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-mono flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-cyber-purple" />
                        Путь к хранилищу Obsidian
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={vaultPath}
                          onChange={(e) => setVaultPath(e.target.value)}
                          placeholder="C:\Users\Имя\Хранилище"
                          className="w-full bg-[#06040c]/80 border border-cyber-purple/40 text-cyber-green placeholder-gray-600 focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green rounded px-3 py-2 text-xs transition-all font-mono shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)]"
                        />
                        
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-cyber-green text-[#06040c] font-black rounded py-2.5 px-4 shadow-[0_0_12px_rgba(0,255,102,0.35)] hover:shadow-[0_0_20px_rgba(0,255,102,0.65)] hover:bg-[#15ff7a] transition-all text-xs font-mono flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-[#06040c] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Terminal className="w-4 h-4" />
                              ПОДКЛЮЧИТЬ ХРАНИЛИЩЕ
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )
                )}
              </div>
            </motion.aside>

            {/* Main Workspace Preview Pane */}
            <main className="flex-1 flex flex-col h-full relative z-0 min-w-0 overflow-hidden">
              {/* Workspace Top Header Bar */}
              <header data-tauri-drag-region className={`h-16 border-b bg-cyber-sidebar/65 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10 relative transition-colors ${ activeMode === "game_manager" ? "border-cyber-yellow/20" : activeMode === "stats" ? "border-cyber-purple/20" : "border-cyber-purple/20" }`}>
                <div className="min-w-0 flex-1" />
                
                <div className="flex items-center gap-2 md:gap-3 shrink-0">

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className={`h-8 px-3 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors border whitespace-nowrap shrink-0 ${ activeMode === "game_manager" ? "text-cyber-yellow bg-cyber-yellow/5 border-cyber-yellow/20 hover:bg-cyber-yellow/10" : "text-cyber-green bg-cyber-green/5 border-cyber-green/20 hover:bg-cyber-green/10" }`}
                    title="Настройки хранилища и изображений"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">НАСТРОЙКИ</span>
                  </button>

                  <button
                    onClick={() => setShowOnboarding(true)}
                    className={`h-8 px-3 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors border whitespace-nowrap shrink-0 ${ activeMode === "game_manager" ? "text-cyber-yellow bg-cyber-yellow/5 border-cyber-yellow/20 hover:bg-cyber-yellow/10" : "text-cyber-green bg-cyber-green/5 border-cyber-green/20 hover:bg-cyber-green/10" }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">СПРАВКА</span>
                  </button>
                  
                  <div 
                    className={`h-8 px-3 rounded-lg font-mono text-xs flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${ activeMode === "game_manager" ? "text-cyber-yellow bg-cyber-yellow/5 border-cyber-yellow/20" : "text-cyber-purple bg-cyber-purple/5 border-cyber-purple/20" }`}
                    title="Серия ежедневных входов подряд"
                  >
                    <Flame className="w-3.5 h-3.5 text-cyber-yellow animate-pulse shrink-0" />
                    <span className="hidden md:inline">СЕРИЯ ВХОДОВ: {consecutiveStreak} ДН.</span>
                    <span className="md:hidden">{consecutiveStreak} ДН.</span>
                  </div>
 
                  {/* System Control Widget */}
                  <div className={`h-8 flex items-center gap-1 bg-[#06040c]/50 px-1 rounded-lg font-mono border whitespace-nowrap shrink-0 system-control-widget ${ activeMode === "game_manager" ? "border-cyber-yellow/25" : "border-cyber-purple/25" }`}>
                    <button
                      type="button"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      onMouseEnter={(e) => showGlobalTooltip(e, theme === "dark" ? "Переключить на светлую тему" : "Переключить на темную тему", activeMode === "game_manager" ? "yellow" : "purple")}
                      onMouseLeave={hideGlobalTooltip}
                      className={`h-6 px-2 text-xs rounded transition-colors flex items-center gap-1 border border-transparent whitespace-nowrap ${ activeMode === "game_manager" ? "text-cyber-yellow hover:bg-cyber-yellow/20" : "text-cyber-purple hover:bg-cyber-purple/20" }`}
                      title={theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
                    >
                      {theme === "dark" ? <Sun className="w-3.5 h-3.5 shrink-0 text-cyber-yellow" /> : <Moon className="w-3.5 h-3.5 shrink-0 text-cyber-purple" />}
                      <span className="text-[9px] uppercase tracking-wider hidden lg:inline">{theme === "dark" ? "СВЕТ" : "ТЕНЬ"}</span>
                    </button>
                    <div className={`w-[1px] h-4 ${activeMode === "game_manager" ? "bg-cyber-yellow/20" : "bg-cyber-purple/20"}`} />
                    <button
                      type="button"
                      onClick={() => setIsSleeping(true)}
                      className={`h-6 px-2 text-xs rounded transition-colors flex items-center gap-1 border border-transparent whitespace-nowrap ${ activeMode === "game_manager" ? "text-cyber-yellow hover:bg-cyber-yellow/20" : "text-cyber-purple hover:bg-cyber-purple/20" }`}
                      title="Войти в спящий режим"
                    >
                      <Moon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] uppercase tracking-wider hidden lg:inline">СОН</span>
                    </button>
                    <div className={`w-[1px] h-4 ${activeMode === "game_manager" ? "bg-cyber-yellow/20" : "bg-cyber-purple/20"}`} />
                    <button
                      type="button"
                      onClick={handleExitApp}
                      className="h-6 px-2 text-xs text-red-500 hover:bg-red-500/10 border border-transparent rounded transition-colors flex items-center gap-1 whitespace-nowrap"
                      title="Выйти из приложения"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] uppercase tracking-wider hidden lg:inline">ВЫХОД</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* Workspace Content Viewport */}
              <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col items-start justify-start w-full min-w-0 overflow-x-hidden">
                <AnimatePresence mode="wait">
                  {menuOpen ? (
                    // Arknights Endfield Mode Selection Overlay
                    <motion.div
                      key="mode-select-menu"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="w-full max-w-5xl p-8 rounded-2xl bg-[#06040c]/90 border border-cyber-purple/35 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative flex flex-col lg:flex-row gap-8 items-center justify-between z-20 min-h-[500px] text-left mx-auto my-auto"
                    >
                      {/* Left: Mode Cards */}
                      <div className="flex flex-col gap-5 w-full lg:w-1/3 select-none">
                        <div className="text-[10px] text-cyber-purple font-mono uppercase tracking-[0.2em] mb-2">// ВЫБЕРИТЕ ПРОТОКОЛ СИСТЕМЫ</div>
                        
                        {/* Game Launcher Card */}
                        <div
                          onMouseEnter={() => setHoveredMode("game_manager")}
                          onMouseLeave={() => setHoveredMode(null)}
                          onClick={() => {
                            setActiveMode("game_manager");
                            setMenuOpen(false);
                          }}
                          className={`border rounded-xl p-5 transition-all duration-300 flex items-center gap-4 ${ activeMode === "game_manager" ? "bg-cyber-yellow/15 border-cyber-yellow text-white shadow-[0_0_15px_rgba(255,183,0,0.25)]" : "bg-[#0c0817]/40 border-cyber-yellow/20 text-gray-400 hover:border-cyber-yellow/60 hover:text-white hover:bg-cyber-yellow/5" }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-cyber-yellow/10 flex items-center justify-center shrink-0 border border-cyber-yellow/35">
                            <Gamepad2 className="w-8 h-8 text-cyber-yellow" />
                          </div>
                          <div className="text-left">
                            <div className="font-mono text-xs text-cyber-yellow font-bold tracking-widest">{t("[01] ОСНОВНОЙ ДВИЖОК", "[01] PRIMARY ENGINE")}</div>
                            <div className="font-black tracking-wide text-sm mt-0.5">{t("ИГРОВОЙ МЕНЕДЖЕР", "GAME MANAGER")}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1">{t("Лаунчер и трекер игр", "Game launcher & tracker")}</div>
                          </div>
                        </div>

                        </div>

                      {/* Center: Hologram HUD */}
                      <div className="flex flex-col items-center justify-center w-full lg:w-1/3 relative py-6">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                          {/* Rotating concentric rings */}
                          <div className="absolute inset-0 rounded-full border border-dashed border-gray-600/35 animate-spin" style={{ animationDuration: '30s' }} />
                          <div className={`absolute inset-4 rounded-full border border-double animate-spin transition-colors duration-300 ${ (hoveredMode || activeMode) === "game_manager" ? "border-cyber-yellow/30" : (hoveredMode || activeMode) === "stats" ? "border-cyber-purple/50" : "border-cyber-purple/30" }`} style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
                          <div className={`absolute inset-10 rounded-full border border-dashed animate-spin transition-colors duration-300 ${ (hoveredMode || activeMode) === "game_manager" ? "border-cyber-yellow/50" : (hoveredMode || activeMode) === "stats" ? "border-cyber-purple/70" : "border-cyber-purple/50" }`} style={{ animationDuration: '10s' }} />
                          
                          {/* Inner glowing core */}
                          <div className={`absolute inset-16 rounded-full bg-[#050308]/90 border flex flex-col items-center justify-center transition-all duration-500 ${ (hoveredMode || activeMode) === "game_manager" ? "border-cyber-yellow shadow-[0_0_35px_rgba(255,183,0,0.3)] text-cyber-yellow" : (hoveredMode || activeMode) === "stats" ? "border-cyber-purple shadow-[0_0_35px_rgba(176,38,255,0.4)] text-cyber-purple" : "border-cyber-purple shadow-[0_0_35px_rgba(176,38,255,0.3)] text-cyber-purple" }`}>
                            {(hoveredMode || activeMode) === "game_manager" ? (
                              <GameModeIcon className="w-16 h-16 animate-pulse" />
                            ) : (hoveredMode || activeMode) === "stats" ? (
                              <BarChart2 className="w-16 h-16 animate-pulse text-cyber-purple" />
                            ) : (
                              <ObsidianIcon className="w-16 h-16 animate-pulse" />
                            )}
                          </div>
                        </div>
                        
                        <div className="text-center mt-6">
                          <h3 className={`font-mono text-xs font-black tracking-[0.2em] transition-colors uppercase ${ (hoveredMode || activeMode) === "game_manager" ? "text-cyber-yellow" : "text-cyber-purple" }`}>
                            {(hoveredMode || activeMode) === "game_manager" ? t("Протокол Лаунчера Активен", "Launcher Protocol Active") : t("Рабочая Область Блокнота Активна", "Notebook Workspace Active")}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-wider">
                            {(hoveredMode || activeMode) === "game_manager" ? t("СЕКТОР: ИГРОВОЙ_ХАБ", "SECTOR: GAMING_HUB") : t("СЕКТОР: ИНДЕКСАТОР_ХРАНИЛИЩА", "SECTOR: VAULT_INDEXER")}
                          </p>
                        </div>
                      </div>

                      {/* Right: Diagnostics & Telemetry */}
                      <div className="w-full lg:w-1/3 flex flex-col gap-6 font-mono text-[10px] select-none text-left">
                        <div className="bg-[#050308]/60 border border-cyber-purple/20 rounded-xl p-5 space-y-3">
                          <div className="text-cyber-purple font-bold">{t("// ТЕЛЕМЕТРИЯ МОДУЛЯ", "// MODULE TELEMETRY")}</div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t("СТАТУС T-SYNC:", "T-SYNC STATUS:")}</span>
                            <span className="text-cyber-green font-bold">{t("100% БЕЗОПАСНО", "100% SECURE")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t("ЯДРА СИСТЕМЫ:", "SYSTEM CORES:")}</span>
                            <span className="text-white">{t("ЭТАП 2 СОБРАН", "STAGE 2 COMPILED")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t("РЕНДЕРИНГ UI:", "UI RENDERING:")}</span>
                            <span className="text-white">TAURI-REACT RUNTIME</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t("АКТИВНЫЙ РЕЖИМ:", "ACTIVE MODE:")}</span>
                            <span className={`font-bold uppercase ${activeMode === "game_manager" ? "text-cyber-yellow" : "text-cyber-purple"}`}>
                              {activeMode === "game_manager" ? t("Игровой менеджер", "Game Manager") : t("Блокнот", "Notebook")}
                            </span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  ) : selectedGameId !== null ? (
                      (() => {
                        const activeGame = games.find(g => g.id === selectedGameId);
                        if (!activeGame) return null;

                        const themeColor = activeGame.coverTheme === "purple"
                          ? "text-cyber-purple"
                          : activeGame.coverTheme === "green"
                            ? "text-cyber-green"
                            : "text-cyber-yellow";

                        const themeBorder = activeGame.coverTheme === "purple"
                          ? "border-cyber-purple/20"
                          : activeGame.coverTheme === "green"
                            ? "border-cyber-green/20"
                            : "border-cyber-yellow/20";

                        const themeGlow = activeGame.coverTheme === "purple"
                          ? "shadow-[0_0_15px_rgba(188,19,254,0.15)] border-cyber-purple/45"
                          : activeGame.coverTheme === "green"
                            ? "shadow-[0_0_15px_rgba(0,255,102,0.15)] border-cyber-green/45"
                            : "shadow-[0_0_15px_rgba(255,183,0,0.15)] border-cyber-yellow/45";

                        const themeBadge = activeGame.coverTheme === "purple"
                          ? "text-cyber-purple border-cyber-purple/30 bg-cyber-purple/5"
                          : activeGame.coverTheme === "green"
                            ? "text-cyber-green border-cyber-green/30 bg-cyber-green/5"
                            : "text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/5";

                        const gameLogs = gameActivities[selectedGameId] || [];
                        const gamePosts = gameNews[selectedGameId] || [];

                        return (
                          <motion.div
                            key={`game-detail-${selectedGameId}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="w-full h-full flex flex-col gap-5 z-10 text-left overflow-y-auto pr-1 font-mono pb-8 min-w-0"
                          >
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0 min-w-0">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <button
                                  onClick={() => setSelectedGameId(null)}
                                  className="btn-back-list flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono font-bold shrink-0"
                                >
                                  <ChevronLeft className="w-4 h-4 shrink-0" />
                                  <span>НАЗАД К СПИСКУ</span>
                                </button>
                                
                                <div className="h-6 w-[1px] bg-white/10 shrink-0" />

                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {activeGame.icon ? (
                                    <img src={activeGame.icon} alt="" className="w-10 h-10 object-contain rounded-lg border border-white/10 shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                                      <Gamepad2 className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <h2 className="text-xl font-black text-white uppercase tracking-wide truncate max-w-[280px]">
                                        {activeGame.name}
                                      </h2>
                                      <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border inline-block shrink-0 ${themeBadge}`}>
                                        {activeGame.category}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 truncate">
                                      СТАТУС ДИАГНОСТИКИ: <span className="text-cyber-green font-bold">АКТИВНО</span> // ID СИСТЕМЫ: {activeGame.id}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                  onClick={() => handleEditGameClick(activeGame)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyber-yellow/20 hover:border-cyber-yellow hover:bg-cyber-yellow/10 text-cyber-yellow transition-all text-xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>ИЗМЕНИТЬ</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGameToDelete(activeGame);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 transition-all text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>УДАЛИТЬ</span>
                                </button>
                              </div>
                            </div>

                            {/* Game Launch and Quick Web Links Panel */}
                            <div className="bg-[#0b0816]/65 border border-white/10 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden shrink-0 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                                <div className="space-y-1 text-left min-w-0 flex-1">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Play className="w-4 h-4 text-cyber-green fill-current shrink-0" />
                                    УПРАВЛЕНИЕ ЗАПУСКОМ
                                  </h4>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 min-w-0">
                                    <span className="shrink-0">Исполняемый файл:</span> <span className="text-gray-400 font-mono select-all truncate inline-block min-w-0 flex-1" title={activeGame.path}>{activeGame.path}</span>
                                  </p>
                                </div>
                                {runningGames[activeGame.id] ? (
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="font-mono text-xs text-cyber-yellow font-bold bg-cyber-yellow/10 border border-cyber-yellow/30 rounded px-2.5 py-1.5 flex items-center gap-1.5 animate-pulse shadow-[0_0_10px_rgba(255,183,0,0.1)]">
                                      <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                                      <span>{formatElapsed(Date.now() - runningGames[activeGame.id])}</span>
                                    </div>
                                    <button
                                      onClick={() => handleStopGame(activeGame)}
                                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:border-red-500 text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-[0_0_15px_rgba(239,68,68,0.15)] shrink-0"
                                    >
                                      <Square className="w-4 h-4 fill-current" />
                                      <span>ЗАКРЫТЬ</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedGameActions(activeGame)}
                                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-black uppercase tracking-widest transition-all shadow-md shrink-0 ${ activeGame.coverTheme === "purple" ? "bg-cyber-purple/10 border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/20 hover:border-cyber-purple shadow-[0_0_15px_rgba(188,19,254,0.15)]" : activeGame.coverTheme === "green" ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green hover:bg-cyber-green/20 hover:border-cyber-green shadow-[0_0_15px_rgba(0,255,102,0.15)]" : "bg-cyber-yellow/10 border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/20 hover:border-cyber-yellow shadow-[0_0_15px_rgba(255,183,0,0.15)]" }`}
                                  >
                                    <Play className="w-4.5 h-4.5 fill-current" />
                                    <span>ЗАПУСК</span>
                                  </button>
                                )}
                              </div>

                              {/* Web Resources Section */}
                              <div className="border-t border-white/5 pt-3.5 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">// БЫСТРЫЕ ССЫЛКИ И РЕСУРСЫ</span>
                                </div>

                                <div className="flex flex-wrap gap-2.5">
                                  {(!activeGame.urls || activeGame.urls.length === 0) ? (
                                    <div className="text-[10px] text-gray-500 font-mono italic">Нет добавленных сайтов</div>
                                  ) : (
                                    activeGame.urls.map((url, idx) => {
                                      let domain = url;
                                      try {
                                        domain = new URL(url).hostname.replace("www.", "");
                                      } catch (_) {}
                                      return (
                                        <div key={idx} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1.5 transition-all hover:bg-white/10">
                                          <button
                                            onClick={() => {
                                              const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
                                              if (isTauri) {
                                                invoke("open_url", { url });
                                              } else {
                                                window.open(url, "_blank");
                                              }
                                            }}
                                            className="text-[10px] font-bold text-cyber-green hover:text-white uppercase tracking-wider px-1 flex items-center gap-1"
                                          >
                                            <Link className="w-3 h-3" />
                                            {domain}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setGames(prev => prev.map(g => {
                                                if (g.id === activeGame.id) {
                                                  return {
                                                    ...g,
                                                    urls: (g.urls || []).filter((_, uIdx) => uIdx !== idx)
                                                  };
                                                }
                                                return g;
                                              }));
                                            }}
                                            className="hover:text-red-500 text-gray-500 p-0.5 text-[10px]"
                                            title="Удалить ссылку"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Add Website Inline Form */}
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={inlineGameUrl}
                                    onChange={(e) => setInlineGameUrl(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-green transition-colors cursor-text"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (inlineGameUrl.trim()) {
                                          setGames(prev => prev.map(g => {
                                            if (g.id === activeGame.id) {
                                              const currentUrls = g.urls || [];
                                              if (!currentUrls.includes(inlineGameUrl.trim())) {
                                                return { ...g, urls: [...currentUrls, inlineGameUrl.trim()] };
                                              }
                                            }
                                            return g;
                                          }));
                                          setInlineGameUrl("");
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (inlineGameUrl.trim()) {
                                        setGames(prev => prev.map(g => {
                                          if (g.id === activeGame.id) {
                                            const currentUrls = g.urls || [];
                                            if (!currentUrls.includes(inlineGameUrl.trim())) {
                                              return { ...g, urls: [...currentUrls, inlineGameUrl.trim()] };
                                            }
                                          }
                                          return g;
                                        }));
                                        setInlineGameUrl("");
                                      }
                                    }}
                                    className="bg-cyber-green hover:bg-[#15ff7a] text-black font-black text-xs px-3 py-1.5 rounded transition-all uppercase font-mono"
                                  >
                                    + ДОБАВИТЬ
                                  </button>
                                </div>
                              </div>
                            </div>

                            /* Two Column Workspace Layout */
                            <div className="flex flex-col lg:flex-row gap-5 shrink-0">
                              {/* Left: Activity Tracker (Convenient Tracker) */}
                              <div className="w-full lg:w-[40%] flex flex-col gap-4 h-[520px] shrink-0">
                                <div className="bg-[#06040c]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                                  <div className="text-xs uppercase tracking-widest text-cyber-yellow border-b border-white/5 pb-1.5 font-bold">// ACTIVITY MONITOR</div>
                                    
                                      {/* Playtime stats display */}
                                      <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg p-2.5">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-gray-500 uppercase tracking-wider">Общее время трекера:</span>
                                          <span className="text-xl font-black text-white tracking-wider mt-0.5">
                                            {formatPlayTime(gameLogs.reduce((acc, log) => acc + (typeof log.hours === 'number' ? log.hours : 0), 0))}
                                          </span>
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center text-cyber-yellow animate-spin" style={{ animationDuration: '30s' }}>
                                          <Clock className="w-4 h-4" />
                                        </div>
                                      </div>

                                    {/* Log session inline form */}
                                    <div className="space-y-2.5">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[8px] text-gray-500 font-mono">ВРЕМЯ (ЧАСЫ):</span>
                                          <div className="relative flex items-center w-full">
                                            <input
                                              type="number"
                                              step="0.1"
                                              placeholder="Напр. 1.5"
                                              value={newActHours}
                                              onChange={(e) => setNewActHours(e.target.value)}
                                              className="bg-black/50 border border-white/10 rounded px-2.5 py-1 pr-7 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-yellow transition-colors cursor-text w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <div className="absolute right-1.5 flex flex-col select-none">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = parseFloat(newActHours) || 0;
                                                  setNewActHours((val + 0.1).toFixed(1).replace(/\.0$/, ""));
                                                }}
                                                className="p-0.5 text-gray-500 hover:text-cyber-yellow transition-colors hover:bg-white/5 rounded flex items-center justify-center"
                                              >
                                                <ChevronUp className="w-2.5 h-2.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const val = parseFloat(newActHours) || 0;
                                                  setNewActHours(Math.max(0, val - 0.1).toFixed(1).replace(/\.0$/, ""));
                                                }}
                                                className="p-0.5 text-gray-500 hover:text-cyber-yellow transition-colors hover:bg-white/5 rounded flex items-center justify-center"
                                              >
                                                <ChevronDown className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[8px] text-gray-500 font-mono">ДАТА:</span>
                                          <input
                                            type="date"
                                            value={newActDate}
                                            onChange={(e) => setNewActDate(e.target.value)}
                                            className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white focus:outline-none focus:border-cyber-yellow transition-colors cursor-text"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] text-gray-500 font-mono">ЗАМЕТКА:</span>
                                        <input
                                          type="text"
                                          placeholder="Прошел босса, качал лвл"
                                          value={newActNotes}
                                          onChange={(e) => setNewActNotes(e.target.value)}
                                          className="bg-black/50 border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-yellow transition-colors cursor-text"
                                        />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const hours = parseFloat(newActHours);
                                          if (isNaN(hours) || hours <= 0) return;
                                          
                                          const newSession = {
                                            id: Date.now().toString(),
                                            hours: hours,
                                            notes: newActNotes || "Игровая сессия",
                                            date: newActDate || new Date().toISOString().split('T')[0]
                                          };

                                          // Update logs
                                          setGameActivities(prev => {
                                            const current = prev[selectedGameId] || [];
                                            return {
                                              ...prev,
                                              [selectedGameId]: [newSession, ...current]
                                            };
                                          });

                                          // Update total playtime in games state
                                          setGames(prev => prev.map(g => {
                                            if (g.id === selectedGameId) {
                                              const oldTime = typeof g.playTime === 'number' ? g.playTime : 0;
                                              return {
                                                ...g,
                                                playTime: oldTime + hours,
                                                lastPlayed: newSession.date
                                              };
                                            }
                                            return g;
                                          }));

                                          setNewActHours("");
                                          setNewActNotes("");
                                        }}
                                        className="w-full border border-cyber-yellow/40 bg-cyber-yellow/5 hover:bg-cyber-yellow hover:text-black rounded-lg py-1.5 text-xs font-bold text-cyber-yellow transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                                      >
                                        <Activity className="w-3.5 h-3.5" />
                                        Зарегистрировать сессию
                                      </button>
                                    </div>
                                  </div>

                                  {/* Sessions List */}
                                  <div className="bg-[#06040c]/60 border border-white/5 rounded-xl p-4 flex-1 flex flex-col gap-2.5 min-h-0">
                                    <div className="text-[9px] uppercase tracking-widest text-gray-400 border-b border-white/5 pb-1 font-bold">ИСТОРИЯ АКТИВНОСТИ</div>
                                    <div className="overflow-y-auto space-y-2 pr-1 h-full scrollbar-thin">
                                      {gameLogs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                          <Activity className="w-6 h-6 text-gray-700 mb-1" />
                                          <p className="text-[10px] text-gray-500">История сессий пуста.</p>
                                        </div>
                                      ) : (
                                        gameLogs.map(log => (
                                          <div key={log.id} className="border border-white/5 bg-black/30 rounded p-2 flex items-center justify-between gap-3 hover:border-white/10 transition-colors">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-cyber-yellow">{formatPlayTime(log.hours)}</span>
                                                <span className="text-[8px] text-gray-500">{log.date}</span>
                                              </div>
                                              <p className="text-[10px] text-gray-300 truncate mt-0.5">{log.notes}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <button
                                                onClick={() => {
                                                  const newNotes = prompt("Редактировать название сессии:", log.notes);
                                                  if (newNotes !== null) {
                                                    setGameActivities(prev => {
                                                      const current = prev[selectedGameId] || [];
                                                      return {
                                                        ...prev,
                                                        [selectedGameId]: current.map(item => 
                                                          item.id === log.id ? { ...item, notes: newNotes || "Игровая сессия" } : item
                                                        )
                                                      };
                                                    });
                                                  }
                                                }}
                                                className="text-cyber-yellow hover:text-cyber-yellow/80 p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                                                title="Редактировать название"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  // Remove from logs
                                                  setGameActivities(prev => {
                                                    const current = prev[selectedGameId] || [];
                                                    return {
                                                      ...prev,
                                                      [selectedGameId]: current.filter(item => item.id !== log.id)
                                                    };
                                                  });

                                                  // Revert total playtime
                                                  setGames(prev => prev.map(g => {
                                                    if (g.id === selectedGameId) {
                                                      const oldTime = typeof g.playTime === 'number' ? g.playTime : 0;
                                                      return {
                                                        ...g,
                                                        playTime: Math.max(0, oldTime - log.hours)
                                                      };
                                                    }
                                                    return g;
                                                  }));
                                                }}
                                                className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                title="Удалить запись"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: My News Feed & Tasks */}
                                  <div className="flex-1 flex flex-col gap-3 h-[520px] shrink-0 min-w-0">
                                  {/* News feed list */}
                                  <div className="bg-[#06040c]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 overflow-hidden h-[254px] shrink-0">
                                    <div className="text-xs uppercase tracking-widest text-cyber-yellow border-b border-white/5 pb-2 font-bold flex justify-between items-center select-none shrink-0">
                                      <span>// NEWS FEED // ЛЕНТА НОВОСТЕЙ</span>
                                      <button
                                        onClick={() => openFileInObsidian(selectedNewsPost?.id)}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-cyber-yellow/20 hover:border-cyber-yellow hover:bg-cyber-yellow/10 text-cyber-yellow transition-all text-[10px] tracking-wider"
                                      >
                                        <CornerUpRight className="w-3.5 h-3.5" />
                                        <span>ОТКРЫТЬ OBSIDIAN</span>
                                      </button>
                                    </div>

                                    {/* Sync storage & Change path button block */}
                                    <div className="flex items-center gap-2 shrink-0 mb-1">
                                      <button
                                        onClick={handleSyncObsidianNews}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyber-green/20 hover:border-cyber-green hover:bg-cyber-green/10 text-cyber-green transition-all text-[10px] tracking-wider font-bold uppercase shadow-[0_0_10px_rgba(0,255,102,0.02)] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)] ${ isSyncing ? "opacity-75" : "" }`}
                                      >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                                        <span>СИНХРОНИЗИРОВАТЬ ХРАНИЛИЩЕ</span>
                                      </button>
                                      
                                      <button
                                        onClick={handleCreateDailyNote}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyber-yellow/20 hover:border-cyber-yellow hover:bg-cyber-yellow/10 text-cyber-yellow transition-all text-[10px] tracking-wider font-bold uppercase shadow-[0_0_10px_rgba(255,183,0,0.02)] hover:shadow-[0_0_15px_rgba(255,183,0,0.2)]"
                                        title="Создать или открыть сегодняшнюю заметку в папке новостей этой игры"
                                      >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>СЕГОДНЯШНЯЯ ЗАМЕТКА</span>
                                      </button>

                                      <button
                                        onClick={() => setIsNewsPathPromptOpen(true)}
                                        className="flex items-center justify-center p-1.5 rounded-lg border border-cyber-yellow/20 hover:border-cyber-yellow hover:bg-cyber-yellow/10 text-cyber-yellow transition-all"
                                        title="Изменить путь к ленте новостей"
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    
                                    <div className="overflow-y-auto space-y-2 pr-1 select-none font-mono h-full scrollbar-thin">
                                      {gamePosts.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                          <FileText className="w-8 h-8 text-gray-700 mb-2" />
                                          <p className="text-[10px] text-gray-500 font-mono">В каталоге пока нет новостей. Создайте файл в Obsidian!</p>
                                        </div>
                                      ) : (
                                        gamePosts.map(post => (
                                          <div
                                            key={post.id}
                                            className={`w-full border rounded-lg p-2.5 transition-all flex items-center justify-between gap-2 group ${ selectedNewsPost?.id === post.id ? "border-cyber-yellow bg-cyber-yellow/10 text-white" : "border-cyber-yellow/15 bg-[#ffb700]/5 hover:border-cyber-yellow/45 text-gray-300 hover:text-white" }`}
                                          >
                                            {editingNoteId === post.id ? (
                                              <div className="flex-1 flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                  type="text"
                                                  value={editingNoteTitle}
                                                  onChange={(e) => setEditingNoteTitle(e.target.value)}
                                                  className="flex-1 bg-black/60 border border-cyber-yellow/50 text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-0 cursor-text"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      handleRenameNote(post, editingNoteTitle);
                                                    } else if (e.key === "Escape") {
                                                      setEditingNoteId(null);
                                                    }
                                                  }}
                                                />
                                                <button
                                                  onClick={() => handleRenameNote(post, editingNoteTitle)}
                                                  className="text-cyber-green hover:text-cyber-green/85 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyber-green/30 hover:bg-cyber-green/10"
                                                >
                                                  OK
                                                </button>
                                                <button
                                                  onClick={() => setEditingNoteId(null)}
                                                  className="text-gray-400 hover:text-white text-[10px] px-1"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                <div
                                                  onClick={() => openFileInObsidian(post.id)}
                                                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                                >
                                                  <FileText className="w-4 h-4 text-cyber-yellow/70 shrink-0" />
                                                  <span className="font-mono text-xs font-bold truncate">{post.title}</span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingNoteId(post.id);
                                                      setEditingNoteTitle(post.title);
                                                    }}
                                                    className="text-cyber-yellow/75 hover:text-cyber-yellow p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                                                    title="Переименовать заметку"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={(e) => handleDeleteNote(post, e)}
                                                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                    title="Удалить заметку"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => openFileInObsidian(post.id)}
                                                    className="text-cyber-yellow/40 group-hover:text-cyber-yellow p-1 hover:translate-x-0.5 transition-all"
                                                    title="Открыть в Obsidian"
                                                  >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Tasks Block */}
                                  <div className="bg-[#06040c]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 overflow-hidden h-[254px] shrink-0">
                                    <div className="text-xs uppercase tracking-widest text-cyber-yellow border-b border-white/5 pb-2 font-bold flex justify-between items-center select-none shrink-0">
                                      <span>// TASKS // ЗАДАЧИ</span>
                                    </div>

                                    {/* Input for new task */}
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!newTaskText.trim() || !selectedGameId) return;
                                        const taskId = Date.now().toString();
                                        const newTaskObj = { id: taskId, text: newTaskText.trim(), completed: false };
                                        setGameTasks(prev => ({
                                          ...prev,
                                          [selectedGameId]: [...(prev[selectedGameId] || []), newTaskObj]
                                        }));
                                        setNewTaskText("");
                                      }}
                                      className="flex gap-2 shrink-0"
                                    >
                                      <input
                                        type="text"
                                        placeholder="Добавить новую задачу..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 focus:border-cyber-yellow/50 text-white placeholder-gray-600 rounded px-2.5 py-1 text-[11px] font-mono focus:ring-0 focus:outline-none transition-all cursor-text"
                                      />
                                      <button
                                        type="submit"
                                        className="px-3 py-1 rounded bg-cyber-yellow/10 hover:bg-cyber-yellow hover:text-black border border-cyber-yellow/30 hover:border-cyber-yellow text-cyber-yellow text-[10px] font-bold tracking-wider transition-all uppercase"
                                      >
                                        Добавить
                                      </button>
                                    </form>

                                    {/* Tasks list */}
                                    <div className="overflow-y-auto space-y-2 pr-1 select-none font-mono h-full scrollbar-thin">
                                      {!selectedGameId ? (
                                        <div className="h-full flex items-center justify-center text-center p-4">
                                          <p className="text-[10px] text-gray-500 font-mono">Выберите игру, чтобы увидеть задачи.</p>
                                        </div>
                                      ) : !(gameTasks[selectedGameId]?.length) ? (
                                        <div className="h-full flex items-center justify-center text-center p-4">
                                          <p className="text-[10px] text-gray-500 font-mono">Нет задач. Добавьте первую задачу выше!</p>
                                        </div>
                                      ) : (
                                        gameTasks[selectedGameId].map(task => {
                                          const isExpanded = !!expandedTasks[task.id];
                                          const isLongText = task.text && task.text.length > 35;

                                          const toggleExpand = (e) => {
                                            const willExpand = !expandedTasks[task.id];
                                            setExpandedTasks(prev => ({
                                              ...prev,
                                              [task.id]: willExpand
                                            }));

                                            if (willExpand && e?.currentTarget) {
                                              const el = e.currentTarget.closest(".task-item");
                                              setTimeout(() => {
                                                if (el && el.parentElement) {
                                                  const container = el.parentElement;
                                                  const targetScrollTop = el.offsetTop + el.offsetHeight - container.clientHeight + 8;
                                                  if (targetScrollTop > container.scrollTop) {
                                                    container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
                                                  }
                                                }
                                              }, 150);
                                            }
                                          };

                                          return (
                                            <motion.div
                                              key={task.id}
                                              layout
                                              initial={false}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.25, ease: "easeInOut" }}
                                              className={`task-item flex border border-white/5 bg-[#06040c]/40 hover:border-cyber-yellow/20 rounded-lg p-2 transition-colors gap-2 ${
                                                isExpanded ? "ring-1 ring-cyber-yellow/30 items-start" : "items-center"
                                              }`}
                                            >
                                              {editingTaskId === task.id ? (
                                                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                                  <input
                                                    type="text"
                                                    value={editingTaskText}
                                                    onChange={(e) => setEditingTaskText(e.target.value)}
                                                    className="flex-1 bg-black/60 border border-cyber-yellow/50 text-white rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-0 cursor-text"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") {
                                                        setGameTasks(prev => ({
                                                          ...prev,
                                                          [selectedGameId]: prev[selectedGameId].map(t =>
                                                            t.id === task.id ? { ...t, text: editingTaskText.trim() } : t
                                                          )
                                                        }));
                                                        setEditingTaskId(null);
                                                      } else if (e.key === "Escape") {
                                                        setEditingTaskId(null);
                                                      }
                                                    }}
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      setGameTasks(prev => ({
                                                        ...prev,
                                                        [selectedGameId]: prev[selectedGameId].map(t =>
                                                          t.id === task.id ? { ...t, text: editingTaskText.trim() } : t
                                                        )
                                                      }));
                                                      setEditingTaskId(null);
                                                    }}
                                                    className="text-cyber-green hover:text-cyber-green/85 text-[10px] font-bold px-1"
                                                  >
                                                    OK
                                                  </button>
                                                </div>
                                              ) : (
                                                <>
                                                  <div className={`flex items-start gap-2 min-w-0 flex-1 ${isExpanded ? "pt-0.5" : ""}`}>
                                                    <input
                                                      type="checkbox"
                                                      checked={task.completed}
                                                      onChange={() => {
                                                        setGameTasks(prev => ({
                                                          ...prev,
                                                          [selectedGameId]: prev[selectedGameId].map(t =>
                                                            t.id === task.id ? { ...t, completed: !t.completed } : t
                                                          )
                                                        }));
                                                      }}
                                                      className="w-3.5 h-3.5 mt-0.5 rounded border-white/10 bg-black/40 text-cyber-yellow focus:ring-0 focus:ring-offset-0 shrink-0"
                                                    />
                                                    <motion.span
                                                      layout="position"
                                                      onClick={(e) => isLongText && toggleExpand(e)}
                                                      className={`text-[11px] font-mono leading-snug transition-colors ${
                                                        isLongText ? "cursor-pointer" : ""
                                                      } ${
                                                        isExpanded ? "whitespace-pre-wrap break-words select-text" : "truncate"
                                                      } ${
                                                        task.completed ? "line-through text-gray-500" : "text-gray-300 hover:text-white"
                                                      }`}
                                                      title={isLongText ? (isExpanded ? "Свернуть задачу" : "Развернуть полностью") : undefined}
                                                    >
                                                      {task.text}
                                                    </motion.span>
                                                  </div>
                                                  <div className="flex items-center gap-1 shrink-0">
                                                    {isLongText && (
                                                      <button
                                                        onClick={(e) => toggleExpand(e)}
                                                        className="text-cyber-yellow/80 hover:text-cyber-yellow p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                                                        title={isExpanded ? "Свернуть" : "Развернуть полностью"}
                                                      >
                                                        <motion.div
                                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                                          transition={{ duration: 0.25, ease: "easeInOut" }}
                                                        >
                                                          <ChevronDown className="w-3 h-3" />
                                                        </motion.div>
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => {
                                                        setEditingTaskId(task.id);
                                                        setEditingTaskText(task.text);
                                                      }}
                                                      className="text-cyber-yellow/75 hover:text-cyber-yellow p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                                                      title="Редактировать задачу"
                                                    >
                                                      <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setGameTasks(prev => ({
                                                          ...prev,
                                                          [selectedGameId]: prev[selectedGameId].filter(t => t.id !== task.id)
                                                        }));
                                                      }}
                                                      className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                      title="Удалить задачу"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </>
                                              )}
                                            </motion.div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                            {/* Activity Chart Section at the bottom */}
                            <div className="bg-[#06040c]/60 border border-white/5 rounded-xl p-4 shrink-0 flex flex-col gap-3 h-[180px] min-h-0">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0 select-none">
                                <div className="text-[10px] uppercase tracking-widest text-cyber-yellow font-bold flex items-center gap-1.5">
                                  <BarChart2 className="w-3.5 h-3.5 text-cyber-yellow" />
                                  <span>// ACTIVITY ANALYTICS // АНАЛИТИКА АКТИВНОСТИ</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {/* Period selector */}
                                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 font-mono">
                                    {["week", "month", "year"].map((period) => (
                                      <button
                                        key={period}
                                        onClick={() => setChartPeriod(period)}
                                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${ chartPeriod === period ? "bg-cyber-yellow text-black shadow-[0_0_8px_rgba(255,183,0,0.2)]" : "text-gray-400 hover:text-white" }`}
                                      >
                                        {period === "week" ? "Неделя" : period === "month" ? "Месяц" : "Год"}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Chart Type selector */}
                                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 font-mono">
                                    <button
                                      onClick={() => setChartType("bar")}
                                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${ chartType === "bar" ? "bg-cyber-yellow text-black shadow-[0_0_8px_rgba(255,183,0,0.2)]" : "text-gray-400 hover:text-white" }`}
                                    >
                                      <span>ДИАГРАММА</span>
                                    </button>
                                    <button
                                      onClick={() => setChartType("github")}
                                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${ chartType === "github" ? "bg-cyber-yellow text-black shadow-[0_0_8px_rgba(255,183,0,0.2)]" : "text-gray-400 hover:text-white" }`}
                                    >
                                      <span>СЕТКА</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Chart Render Area */}
                              <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
                                {(() => {
                                  const chartData = getChartData();
                                  if (chartData.length === 0) {
                                    return (
                                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                                        Нет данных для построения графика
                                      </div>
                                    );
                                  }

                                  if (chartType === "github") {
                                    // GitHub Contribution Grid
                                    if (chartPeriod === "week") {
                                      return (
                                        <div className="w-full h-full flex items-center justify-center select-none font-mono">
                                          <div className="flex flex-row gap-3 py-1">
                                            {chartData.map((day, idx) => {
                                              const level = day.hours === 0 ? 0 : day.hours <= 1 ? 1 : day.hours <= 3 ? 2 : 3;
                                              const colorClass = level === 0 
                                                ? "bg-white/5 border border-white/5 text-white/20 hover:text-white/60" 
                                                : level === 1 
                                                  ? "bg-cyber-yellow/20 border border-cyber-yellow/30 shadow-[0_0_4px_rgba(255,183,0,0.15)] text-cyber-yellow/85" 
                                                  : level === 2 
                                                    ? "bg-cyber-yellow/50 border border-cyber-yellow/60 shadow-[0_0_8px_rgba(255,183,0,0.35)] text-black font-bold" 
                                                    : "bg-cyber-yellow border border-cyber-yellow shadow-[0_0_12px_rgba(255,183,0,0.6)] text-black font-extrabold";
                                              
                                              const dayNumber = day.date ? parseInt(day.date.split('-')[2], 10) : "";

                                              return (
                                                <div key={idx} className="flex flex-col items-center gap-1.5">
                                                  <div 
                                                    className={`w-[34px] h-[34px] rounded-lg transition-all duration-200 hover:scale-110 hover:z-10 flex items-center justify-center text-xs font-bold ${colorClass}`}
                                                    title={`${day.date || "Дата"}: ${day.hours.toFixed(1)}ч.`}
                                                  >
                                                    {dayNumber}
                                                  </div>
                                                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                                                    {day.label}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (chartPeriod === "month") {
                                      const half = Math.ceil(chartData.length / 2);
                                      const firstRow = chartData.slice(0, half);
                                      const secondRow = chartData.slice(half);
                                      const currentYear = new Date().getFullYear();
                                      const monthName = new Date().toLocaleDateString("ru-RU", { month: "long" }).toUpperCase();

                                      return (
                                        <div className="w-full h-full flex items-center justify-between px-6 select-none font-mono">
                                          {/* Left side: Year & optional Month when sidebar is expanded */}
                                          {sidebarCollapsed ? (
                                            <motion.div
                                              key="left-year-collapsed"
                                              initial={{ opacity: 0, y: -25 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ type: "spring", stiffness: 80, damping: 12 }}
                                              className="text-xl md:text-2xl font-black text-cyber-yellow select-none tracking-widest text-right pr-4 border-r border-white/5 flex items-center justify-end h-8 shrink-0"
                                            >
                                              {currentYear}
                                            </motion.div>
                                          ) : (
                                            <div className="flex flex-col items-center justify-center pr-4 border-r border-white/5 shrink-0 min-w-[70px]">
                                              {/* Year in cyber yellow */}
                                              <motion.div
                                                key="left-year-expanded"
                                                initial={{ opacity: 0, y: -15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: "spring", stiffness: 80, damping: 12 }}
                                                className="text-lg md:text-xl font-black text-cyber-yellow select-none tracking-widest leading-tight"
                                              >
                                                {currentYear}
                                              </motion.div>

                                              {/* Line appearing left-to-right */}
                                              <motion.div
                                                key="left-divider"
                                                initial={{ scaleX: 0, opacity: 0 }}
                                                animate={{ scaleX: 1, opacity: 1 }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                style={{ originX: 0 }}
                                                className="w-full h-[2px] bg-cyber-yellow/40 rounded-full my-1"
                                              />

                                              {/* Month appearing bottom-to-top after line animation finishes */}
                                              <motion.div
                                                key="left-month-expanded"
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.28, ease: "easeOut" }}
                                                className="text-xs md:text-sm font-black text-cyber-yellow select-none tracking-widest uppercase leading-tight"
                                              >
                                                {monthName}
                                              </motion.div>
                                            </div>
                                          )}

                                          {/* Center: 2 Rows Grid */}
                                          <div className="flex flex-col gap-2 justify-center flex-1 mx-4">
                                            <div className="flex flex-row gap-2 justify-center">
                                              {firstRow.map((day, idx) => {
                                                const level = day.hours === 0 ? 0 : day.hours <= 1 ? 1 : day.hours <= 3 ? 2 : 3;
                                                const colorClass = level === 0 
                                                  ? "bg-white/5 border border-white/5 text-white/20 hover:text-white/60" 
                                                  : level === 1 
                                                    ? "bg-cyber-yellow/20 border border-cyber-yellow/30 shadow-[0_0_4px_rgba(255,183,0,0.15)] text-cyber-yellow/85" 
                                                    : level === 2 
                                                      ? "bg-cyber-yellow/50 border border-cyber-yellow/60 shadow-[0_0_8px_rgba(255,183,0,0.35)] text-black font-bold" 
                                                      : "bg-cyber-yellow border border-cyber-yellow shadow-[0_0_12px_rgba(255,183,0,0.6)] text-black font-extrabold";
                                                
                                                const dayNumber = day.date ? parseInt(day.date.split('-')[2], 10) : "";

                                                return (
                                                  <div 
                                                    key={idx} 
                                                    className={`w-[32px] h-[32px] rounded-md transition-all duration-200 hover:scale-110 hover:z-10 flex items-center justify-center text-[12px] font-bold ${colorClass}`}
                                                    title={`${day.date || "Дата"}: ${day.hours.toFixed(1)}ч.`}
                                                  >
                                                    {dayNumber}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                            <div className="flex flex-row gap-2 justify-center">
                                              {secondRow.map((day, idx) => {
                                                const level = day.hours === 0 ? 0 : day.hours <= 1 ? 1 : day.hours <= 3 ? 2 : 3;
                                                const colorClass = level === 0 
                                                  ? "bg-white/5 border border-white/5 text-white/20 hover:text-white/60" 
                                                  : level === 1 
                                                    ? "bg-cyber-yellow/20 border border-cyber-yellow/30 shadow-[0_0_4px_rgba(255,183,0,0.15)] text-cyber-yellow/85" 
                                                    : level === 2 
                                                      ? "bg-cyber-yellow/50 border border-cyber-yellow/60 shadow-[0_0_8px_rgba(255,183,0,0.35)] text-black font-bold" 
                                                      : "bg-cyber-yellow border border-cyber-yellow shadow-[0_0_12px_rgba(255,183,0,0.6)] text-black font-extrabold";
                                                
                                                const dayNumber = day.date ? parseInt(day.date.split('-')[2], 10) : "";

                                                return (
                                                  <div 
                                                    key={idx} 
                                                    className={`w-[32px] h-[32px] rounded-md transition-all duration-200 hover:scale-110 hover:z-10 flex items-center justify-center text-[12px] font-bold ${colorClass}`}
                                                    title={`${day.date || "Дата"}: ${day.hours.toFixed(1)}ч.`}
                                                  >
                                                    {dayNumber}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* Right side: Month (only when sidebar is collapsed) */}
                                          {sidebarCollapsed && (
                                            <motion.div
                                              key="right-month-collapsed"
                                              initial={{ opacity: 0, y: 25 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ type: "spring", stiffness: 80, damping: 12 }}
                                              className="text-xl md:text-2xl font-black text-cyber-yellow select-none tracking-widest text-left pl-4 border-l border-white/5 flex items-center justify-start h-8 shrink-0"
                                            >
                                              {monthName}
                                            </motion.div>
                                          )}
                                        </div>
                                      );
                                    }

                                    // Default Year view (remains original 7-row grid)
                                    return (
                                      <div className="w-full h-full flex flex-col justify-center overflow-x-auto pr-2 scrollbar-thin select-none">
                                        <div className="grid grid-flow-col grid-rows-7 gap-[3px] mx-auto py-1">
                                          {chartData.map((day, idx) => {
                                            const level = day.hours === 0 ? 0 : day.hours <= 1 ? 1 : day.hours <= 3 ? 2 : 3;
                                            const colorClass = level === 0 
                                              ? "bg-white/5 border border-white/5" 
                                              : level === 1 
                                                ? "bg-cyber-yellow/20 border border-cyber-yellow/30 shadow-[0_0_4px_rgba(255,183,0,0.15)]" 
                                                : level === 2 
                                                  ? "bg-cyber-yellow/50 border border-cyber-yellow/60 shadow-[0_0_8px_rgba(255,183,0,0.35)]" 
                                                  : "bg-cyber-yellow border border-cyber-yellow shadow-[0_0_12px_rgba(255,183,0,0.6)]";
                                            
                                            return (
                                              <div 
                                                key={idx} 
                                                className={`w-[11px] h-[11px] rounded-[2px] transition-all duration-200 hover:scale-125 hover:z-10 ${colorClass}`}
                                                title={`${day.date || "Дата"}: ${day.hours.toFixed(1)}ч.`}
                                              />
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    // Vertical Bar Chart
                                    const maxHours = Math.max(...chartData.map(d => d.hours), 1);
                                    return (
                                      <div className="w-full h-full flex items-end justify-between gap-1.5 px-2 pb-1 pt-4">
                                        {chartData.map((item, idx) => {
                                          const percent = (item.hours / maxHours) * 100;
                                          return (
                                            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end min-w-0 relative">
                                              {/* Tooltip on hover */}
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-cyber-yellow/50 text-[8px] text-cyber-yellow px-1.5 py-0.5 rounded -top-4 absolute pointer-events-none font-mono whitespace-nowrap z-30 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                                                {item.hours.toFixed(1)}ч.
                                              </div>
                                              
                                              {/* Bar */}
                                              <div 
                                                className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-cyber-yellow/10 to-cyber-yellow/70 group-hover:to-cyber-yellow transition-all duration-300 relative"
                                                style={{ 
                                                  height: `${Math.max(percent, 4)}%`,
                                                  boxShadow: item.hours > 0 ? "0 0 8px rgba(255,183,0,0.15)" : undefined 
                                                }}
                                              />
                                              
                                              {/* Label */}
                                              <span className="text-[7px] text-gray-500 font-mono mt-1 truncate max-w-full uppercase select-none">
                                                {item.label}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()
                    ) : (
                      // Games Grid View (Original grid)
                      <motion.div
                        key="game-manager-view"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                        className="w-full h-full flex flex-col xl:flex-row gap-6 z-10 select-none text-left min-w-0"
                      >
                        {/* Left: Games Grid */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-xs text-cyber-yellow uppercase tracking-widest flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-cyber-yellow animate-pulse" />
                              ДОСТУПНЫЕ ИГРЫ И ПО
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              КОЛИЧЕСТВО: {games.length} ШТ.
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 overflow-y-auto max-h-[520px] pr-1">
                            {games.map(game => (
                              <div
                                key={game.id}
                                onClick={() => setSelectedGameId(game.id)}
                                onContextMenu={(e) => handleGameContextMenu(e, game)}
                                className={`group border rounded-xl p-5 bg-[#0a0614]/50 border-cyber-yellow/20 hover:border-cyber-yellow hover:bg-[#ffb700]/5 transition-all duration-300 relative flex flex-col items-center justify-between min-h-[220px] shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${ game.coverTheme === "purple" ? "hover:border-cyber-purple hover:bg-cyber-purple/5" : game.coverTheme === "green" ? "hover:border-cyber-green hover:bg-cyber-green/5" : "" }`}
                              >
                                {/* Category Badge on top */}
                                <div className="w-full flex justify-center">
                                  <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${ game.coverTheme === "purple" ? "text-cyber-purple border-cyber-purple/30 bg-cyber-purple/5" : game.coverTheme === "green" ? "text-cyber-green border-cyber-green/30 bg-cyber-green/5" : "text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/5" }`}>
                                    {game.category}
                                  </span>
                                </div>

                                {/* Center-aligned Game Icon (larger and slightly above center) */}
                                <div className="flex-1 flex flex-col items-center justify-center mt-3.5 mb-1.5 gap-1.5 w-full">
                                  {game.icon ? (
                                    <img 
                                      src={game.icon} 
                                      alt="" 
                                      className="w-24 h-24 object-cover rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-all duration-300 block" 
                                      style={{
                                        boxShadow: game.coverTheme === "purple" 
                                          ? "0 0 20px rgba(188,19,254,0.15)" 
                                          : game.coverTheme === "green" 
                                            ? "0 0 20px rgba(0,255,102,0.15)" 
                                            : "0 0 20px rgba(255,183,0,0.15)"
                                      }}
                                    />
                                  ) : (
                                    <div className={`w-24 h-24 rounded-2xl border flex items-center justify-center bg-white/5 border-white/10 text-gray-400 transition-all ${ game.coverTheme === "purple" ? "group-hover:text-cyber-purple group-hover:border-cyber-purple/30 group-hover:shadow-[0_0_20px_rgba(188,19,254,0.15)]" : game.coverTheme === "green" ? "group-hover:text-cyber-green group-hover:border-cyber-green/30 group-hover:shadow-[0_0_20px_rgba(0,255,102,0.15)]" : "group-hover:text-cyber-yellow group-hover:border-cyber-yellow/30 group-hover:shadow-[0_0_20px_rgba(255,183,0,0.15)]" }`}>
                                      <Gamepad2 className="w-10 h-10" />
                                    </div>
                                  )}
                                  <h4 className="text-base font-black text-gray-100 tracking-wide text-center group-hover:text-white truncate max-w-[150px] mt-0.5">
                                    {game.name}
                                  </h4>
                                </div>

                                {/* Footer: Playtime only */}
                                <div className="w-full flex justify-center pt-2.5 border-t border-white/5 font-mono text-[9px] text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatPlayTime(game.playTime)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Predefined Add Game Button in Grid */}
                            <div
                              onClick={handleAddGameOpenClick}
                              className="border border-dashed rounded-xl p-4 bg-transparent border-cyber-yellow/15 hover:border-cyber-yellow hover:bg-cyber-yellow/5 transition-all duration-300 flex flex-col items-center justify-center gap-2.5 min-h-[140px] group shadow-lg"
                            >
                              <div className="w-10 h-10 rounded-full border border-dashed border-cyber-yellow/45 flex items-center justify-center text-gray-500 group-hover:text-cyber-yellow group-hover:border-cyber-yellow transition-all">
                                <Plus className="w-5 h-5" />
                              </div>
                              <span className="font-mono text-xs font-bold text-gray-500 group-hover:text-cyber-yellow transition-all uppercase tracking-wider">
                                ДОБАВИТЬ ПРОГРАММУ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Selected Game Details / Terminal Launcher */}
                        <div className="w-full xl:w-72 shrink-0 flex flex-col gap-4 min-w-0">
                          <div className="font-mono text-xs text-cyber-yellow uppercase tracking-widest">// КОНСОЛЬ ТЕЛЕМЕТРИИ</div>
                          
                          <div className="flex-1 bg-[#06040c]/60 border border-cyber-yellow/20 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[300px]">
                            {/* Top diagnostic design */}
                            <div className="space-y-4">
                              {/* Revolving Hologram circle */}
                              <div className="w-24 h-24 mx-auto relative flex items-center justify-center my-4">
                                <div className="absolute inset-0 rounded-full border border-dashed border-cyber-yellow/25 animate-spin" style={{ animationDuration: '15s' }} />
                                <div className="absolute inset-2 rounded-full border border-double border-cyber-yellow/40 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
                                <div className="absolute inset-5 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,183,0,0.25)]">
                                  <Gamepad2 className="w-8 h-8 text-cyber-yellow animate-pulse animate-duration-2000" />
                                </div>
                              </div>

                              <div className="text-center font-mono">
                                <div className="text-[9px] text-gray-500 uppercase tracking-widest">ВЫБРАННЫЙ МОДУЛЬ</div>
                                <h3 className="text-lg font-black text-white mt-1 neon-text-yellow truncate max-w-[240px]" title="Launcher Software">
                                  {games.length > 0 ? games[0].name.toUpperCase() : "ИГРЫ НЕ ДОБАВЛЕНЫ"}
                                </h3>
                              </div>

                              <div className="border-t border-cyber-yellow/10 pt-4 space-y-2.5 font-mono text-[9px]">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">СТАТУС ДИАГНОСТИКИ:</span>
                                  <span className="text-cyber-green font-bold">ГОТОВО</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-500">ПУТЬ К ИСПОЛНЯЕМОМУ ФАЙЛУ:</span>
                                  <span className="text-white break-all bg-[#050308] p-1.5 rounded border border-white/5 select-text text-[8px] leading-normal font-mono cursor-text">
                                    {games.length > 0 ? games[0].path : "Путь не настроен"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-cyber-yellow/10">
                              {/* Fake stats */}
                              <div className="flex justify-between font-mono text-[9px]">
                                <span className="text-gray-500">ЦЕЛОСТНОСТЬ СИСТЕМЫ:</span>
                                <span className="text-cyber-green font-bold">100% ОНЛАЙН</span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  if (games.length > 0) {
                                    setSelectedGameId(games[0].id);
                                  } else {
                                    handleAddGameOpenClick();
                                  }
                                }}
                                className="w-full border border-cyber-yellow bg-cyber-yellow/10 hover:bg-cyber-yellow hover:text-[#06040c] rounded-xl py-3 font-mono font-bold text-xs text-cyber-yellow tracking-widest transition-all shadow-[0_0_12px_rgba(255,183,0,0.2)] hover:shadow-[0_0_22px_rgba(255,183,0,0.5)] flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4 text-cyber-yellow group-hover:text-black transition-colors" />
                                ОТКРЫТЬ ИНТЕРФЕЙС ИГРЫ
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })()
                : null
                </AnimatePresence>
              </div>
            </main>

            <AnimatePresence>
              {showOnboarding && (
                <OnboardingWidget onClose={handleCloseOnboarding} />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Game Action Selection Modal / Экран «Перед запуском» */}
          <AnimatePresence>
            {selectedGameActions && (() => {
              const game = selectedGameActions;
              const logs = gameActivities[game.id] || [];
              const tasks = gameTasks[game.id] || [];
              const posts = gameNews[game.id] || [];
              
              const lastSession = logs.length > 0 ? logs[0] : null;
              const pendingTasks = tasks.filter(t => !t.completed);
              const completedTasksCount = tasks.filter(t => t.completed).length;
              const lastNote = posts.length > 0 ? posts[0] : null;
              
              // Determine elapsed time since last launch or session
              let timeSinceLast = "Ранее не запускалась";
              if (lastSession?.date || game.lastPlayed) {
                const dateStr = lastSession?.date || game.lastPlayed;
                if (dateStr && dateStr !== "Ни разу") {
                  const past = new Date(dateStr);
                  if (!isNaN(past.getTime())) {
                    const diffMs = Date.now() - past.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    if (diffDays === 0 && diffHours === 0) {
                      timeSinceLast = "Сегодня";
                    } else if (diffDays === 0) {
                      timeSinceLast = `${diffHours} ч. назад`;
                    } else if (diffDays === 1) {
                      timeSinceLast = `Вчера (${diffHours > 0 ? diffHours + ' ч.' : ''})`;
                    } else {
                      timeSinceLast = `${diffDays} дн. назад`;
                    }
                  }
                }
              }

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99997] flex items-center justify-center p-4 sm:p-6 select-none font-mono"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="w-full max-w-xl bg-cyber-sidebar border rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative text-left max-h-[90vh] flex flex-col overflow-hidden"
                    style={{
                      borderColor: game.coverTheme === "purple" 
                        ? "rgba(188,19,254,0.45)" 
                        : game.coverTheme === "green" 
                          ? "rgba(0,255,102,0.45)" 
                          : "rgba(255,183,0,0.45)"
                    }}
                  >
                    {/* Header: Game basic info & Time elapsed */}
                    <div className="flex items-center gap-4 pb-4 border-b border-white/10 shrink-0">
                      {game.icon ? (
                        <img 
                          src={game.icon} 
                          alt="" 
                          className="w-16 h-16 object-contain rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/5 shrink-0" 
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl border flex items-center justify-center bg-white/5 border-white/10 text-gray-400 shrink-0 ${ game.coverTheme === "purple" ? "text-cyber-purple border-cyber-purple/30" : game.coverTheme === "green" ? "text-cyber-green border-cyber-green/30" : "text-cyber-yellow border-cyber-yellow/30" }`}>
                          <Gamepad2 className="w-8 h-8" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${ game.coverTheme === "purple" ? "text-cyber-purple border-cyber-purple/30 bg-cyber-purple/5" : game.coverTheme === "green" ? "text-cyber-green border-cyber-green/30 bg-cyber-green/5" : "text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/5" }`}>
                            ПЕРЕД ЗАПУСКОМ
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyber-yellow" />
                            {timeSinceLast}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wide truncate">
                          {game.name}
                        </h3>
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-3">
                          <span>Категория: {game.category}</span>
                          <span>|</span>
                          <span>Сыграно: {formatPlayTime(game.playTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Scrollable Body */}
                    <div className="overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin flex-1 min-h-0 text-xs">
                      {/* 1. Последняя сессия & Где остановился */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
                        <div className="text-[10px] text-cyber-yellow font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Прошлая сессия и остановка</span>
                        </div>
                        {lastSession ? (
                          <div className="space-y-1 pl-1">
                            <div className="text-gray-300 font-bold flex items-center justify-between">
                              <span>Где ты остановился:</span>
                              <span className="text-[10px] text-gray-500 font-mono">{lastSession.date} ({formatPlayTime(lastSession.hours)})</span>
                            </div>
                            <p className="text-gray-400 text-xs bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">
                              «{lastSession.notes}»
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-[11px] italic pl-1">
                            Нет записей о предыдущих сессиях. Выберите или добавьте новую цель!
                          </p>
                        )}
                      </div>

                      {/* 2. Текущая цель сессии & Незавершённые задачи */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div className="text-[10px] text-cyber-green font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Цель сессии и незавершённые задачи ({pendingTasks.length})</span>
                          </div>
                          {tasks.length > 0 && (
                            <span className="text-[9px] text-gray-500 font-mono">Выполнено: {completedTasksCount}/{tasks.length}</span>
                          )}
                        </div>

                        {/* Top priority item as Current Goal */}
                        {pendingTasks.length > 0 ? (
                          <div className="bg-cyber-green/5 border border-cyber-green/20 rounded-lg p-2.5 space-y-1">
                            <span className="text-[9px] text-cyber-green font-bold uppercase tracking-wider block">
                              🎯 ТЕКУЩАЯ ГЛАВНАЯ ЦЕЛЬ:
                            </span>
                            <p className="text-white font-bold text-xs truncate">
                              {pendingTasks[0].text}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-gray-400 text-[11px]">
                            Все задачи выполнены! Отличный прогресс.
                          </div>
                        )}

                        {/* List of remaining tasks */}
                        {pendingTasks.length > 1 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Остальные задачи:</span>
                            <div className="space-y-1">
                              {pendingTasks.slice(1, 4).map(task => (
                                <div key={task.id} className="flex items-center gap-2 text-gray-300 text-[11px] bg-white/5 px-2.5 py-1.5 rounded">
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-yellow shrink-0" />
                                  <span className="truncate">{task.text}</span>
                                </div>
                              ))}
                              {pendingTasks.length > 4 && (
                                <span className="text-[9px] text-gray-500 italic block pl-1">...и ещё {pendingTasks.length - 4} задач(и)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Последняя заметка */}
                      {lastNote && (
                        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-1.5">
                          <div className="text-[10px] text-cyber-purple font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Последняя заметка</span>
                          </div>
                          <div className="bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg p-2.5 flex items-center justify-between gap-2">
                            <span className="text-white font-bold text-xs truncate">{lastNote.title}</span>
                            <button
                              onClick={() => {
                                setSelectedNewsPost(lastNote);
                                setSelectedGameActions(null);
                              }}
                              className="text-[9px] font-bold text-cyber-purple hover:underline shrink-0 uppercase tracking-wider"
                            >
                              Открыть →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4. Запуск и действия */}
                      <div className="border-t border-white/10 pt-3 space-y-2.5">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Параметры запуска:
                        </div>
                        
                        <label className="flex items-center gap-3 text-gray-300 hover:text-white select-none text-xs font-bold cursor-pointer bg-white/5 p-2 rounded-lg border border-white/5">
                          <input 
                            type="checkbox"
                            checked={executeLaunchGame}
                            onChange={(e) => setExecuteLaunchGame(e.target.checked)}
                            className={`rounded border-white/10 bg-black/40 focus:ring-0 focus:ring-offset-0 w-4 h-4 ${ game.coverTheme === "purple" ? "text-cyber-purple accent-cyber-purple" : game.coverTheme === "green" ? "text-cyber-green accent-cyber-green" : "text-cyber-yellow accent-cyber-yellow" }`}
                          />
                          <span className="truncate">Запустить исполняемый файл игры ({game.name})</span>
                        </label>

                        {game.urls && game.urls.map((url, index) => {
                          let domain = url;
                          try {
                            domain = new URL(url).hostname.replace("www.", "");
                          } catch(_) {}
                          return (
                            <label key={index} className="flex items-center gap-3 text-gray-300 hover:text-white select-none text-xs font-bold cursor-pointer bg-white/5 p-2 rounded-lg border border-white/5">
                              <input 
                                type="checkbox"
                                checked={!!executeUrls[index]}
                                onChange={(e) => {
                                  setExecuteUrls(prev => ({
                                    ...prev,
                                    [index]: e.target.checked
                                  }));
                                }}
                                className={`rounded border-white/10 bg-black/40 focus:ring-0 focus:ring-offset-0 w-4 h-4 ${ game.coverTheme === "purple" ? "text-cyber-purple accent-cyber-purple" : game.coverTheme === "green" ? "text-cyber-green accent-cyber-green" : "text-cyber-yellow accent-cyber-yellow" }`}
                              />
                              <span className="truncate">Открыть веб-сайт: {domain}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer launch button */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedGameActions(null)}
                        className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-3 text-center text-gray-400 font-bold uppercase transition-all text-xs tracking-wider"
                      >
                        ОТМЕНА
                      </button>

                      <button
                        disabled={!executeLaunchGame && !Object.values(executeUrls).some(Boolean)}
                        onClick={() => {
                          const urlsToOpen = (game.urls || []).filter((_, idx) => executeUrls[idx]);
                          setSelectedGameActions(null);
                          handleLaunchGame(game, executeLaunchGame, urlsToOpen);
                        }}
                        className={`flex-[2] rounded-xl py-3 text-center font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border text-xs shadow-lg ${ (!executeLaunchGame && !Object.values(executeUrls).some(Boolean)) ? "bg-gray-800/10 border-white/5 text-gray-600 cursor-not-allowed opacity-50" : game.coverTheme === "purple" ? "bg-cyber-purple/10 border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/20 hover:border-cyber-purple shadow-[0_0_15px_rgba(188,19,254,0.15)] hover:shadow-[0_0_25px_rgba(188,19,254,0.3)]" : game.coverTheme === "green" ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green hover:bg-cyber-green/20 hover:border-cyber-green shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:shadow-[0_0_25px_rgba(0,255,102,0.3)]" : "bg-cyber-yellow/10 border-cyber-yellow/40 text-cyber-yellow hover:bg-cyber-yellow/20 hover:border-cyber-yellow shadow-[0_0_15px_rgba(255,183,0,0.15)] hover:shadow-[0_0_25px_rgba(255,183,0,0.3)]" }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        НАЧАТЬ СЕССИЮ
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Game Manager Launch Console Overlay */}
          <AnimatePresence>
            {launchingGame && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#06040c]/95 z-[99999] flex items-center justify-center p-6 font-mono select-none"
              >
                <div className="w-full max-w-xl bg-[#0a0614] launch-modal-card border border-cyber-yellow/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(255,183,0,0.3)] relative overflow-hidden">
                  {/* Scanline overlay */}
                  <div className="launch-modal-scanlines absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none" />
                  
                  <div className="flex items-center gap-2 border-b border-cyber-yellow/20 pb-3 mb-4 text-cyber-yellow">
                    <Terminal className="w-5 h-5 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">ПРОТОКОЛ ЗАПУСКА АКТИВЕН</span>
                  </div>
                  
                  <div className="space-y-2.5 text-[11px] text-gray-300 text-left min-h-[160px] max-h-[220px] overflow-y-auto font-mono leading-relaxed">
                    {launchLogs.map((log, i) => (
                      <div key={i} className={log.startsWith("SUCCESS") || log.startsWith("УСПЕШНО") ? "text-cyber-green" : log.startsWith("CRITICAL") || log.startsWith("КРИТИЧЕСКАЯ") ? "text-red-500" : "text-cyber-yellow/90"}>
                        {log.startsWith("SUCCESS") || log.startsWith("УСПЕШНО") || log.startsWith("CRITICAL") || log.startsWith("КРИТИЧЕСКАЯ") ? "" : "> "}{log}
                      </div>
                    ))}
                    <div className="w-1.5 h-3.5 bg-cyber-yellow/75 inline-block animate-pulse ml-0.5" />
                  </div>
                  
                  <div className="border-t border-cyber-yellow/10 pt-4 flex justify-between items-center text-[9px] text-gray-500">
                    <span>СЕКТОР: ЦЕНТР_УПРАВЛЕНИЯ</span>
                    <span className="animate-pulse text-cyber-yellow">МОДУЛЬ ЗАПУСКА V2.1</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Game Cyber Modal */}
          <AnimatePresence>
            {addGameOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99998] flex items-center justify-center p-6 select-none font-mono"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-cyber-sidebar border border-cyber-yellow/45 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative text-left"
                >
                  <div className="flex items-center justify-between border-b border-cyber-yellow/20 pb-3 mb-4">
                    <span className="text-xs font-black text-cyber-yellow tracking-widest flex items-center gap-1.5">
                      <Gamepad className="w-4.5 h-4.5" />
                      {editingGameId ? "РЕДАКТИРОВАНИЕ ПРОГРАММЫ" : "ДОБАВЛЕНИЕ ПРОГРАММЫ"}
                    </span>
                    <button
                      onClick={() => setAddGameOpen(false)}
                      className="text-gray-500 hover:text-white text-xs"
                    >
                      [ ESC ]
                    </button>
                  </div>

                  {/* Tab Header */}
                  {!cropSrc && (
                    <div className="flex border-b border-white/5 mb-4 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveModalTab("parameters")}
                        className={`flex-1 pb-2 border-b-2 font-bold transition-all text-center uppercase tracking-widest ${ activeModalTab === "parameters" ? "border-cyber-yellow text-cyber-yellow font-black" : "border-transparent text-gray-500 hover:text-gray-300" }`}
                      >
                        Параметры
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab("functions")}
                        className={`flex-1 pb-2 border-b-2 font-bold transition-all text-center uppercase tracking-widest ${ activeModalTab === "functions" ? "border-cyber-yellow text-cyber-yellow font-black" : "border-transparent text-gray-500 hover:text-gray-300" }`}
                      >
                        Функции
                      </button>
                    </div>
                  )}

                  {cropSrc ? (
                    // Crop Interface inside the modal
                    <div className="space-y-5 text-center flex flex-col items-center py-2">
                      <div className="border-b border-cyber-yellow/20 pb-3 mb-2 w-full flex items-center justify-between">
                        <span className="text-xs font-black text-cyber-yellow tracking-widest flex items-center gap-1.5 uppercase">
                          <Crop className="w-4.5 h-4.5 animate-pulse" />
                          ОБРЕЗКА ИКОНКИ
                        </span>
                        <button
                          type="button"
                          onClick={() => setCropSrc(null)}
                          className="text-gray-500 hover:text-white text-xs"
                        >
                          [ ESC ]
                        </button>
                      </div>

                      <div 
                        className="relative w-40 h-40 overflow-hidden border border-cyber-yellow/45 rounded-2xl bg-black/40 select-none cursor-move shadow-[0_0_20px_rgba(255,183,0,0.15)] flex items-center justify-center"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                      >
                        <img 
                          src={cropSrc} 
                          alt="Crop Preview" 
                          draggable={false}
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: imageAspect > 1 ? 'auto' : '100%',
                            height: imageAspect > 1 ? '100%' : 'auto',
                            maxWidth: 'none',
                            transform: `translate(-50%, -50%) translate(${dragPos.x}px, ${dragPos.y}px) scale(${zoom})`,
                            pointerEvents: 'none'
                          }}
                        />
                        {/* Rounded-Square crop boundary overlay */}
                        <div className="absolute inset-2 border-2 border-dashed border-cyber-yellow rounded-xl pointer-events-none opacity-50 shadow-[0_0_0_9999px_rgba(6,4,12,0.6)]" />
                      </div>

                      <div className="w-full space-y-1.5 px-4">
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>МАСШТАБ:</span>
                          <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="0.05"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="w-full h-1 bg-[#050308] border border-cyber-yellow/20 rounded-lg appearance-none accent-cyber-yellow"
                        />
                      </div>

                      <div className="pt-2 flex gap-3 w-full">
                        <button
                          type="button"
                          onClick={() => setCropSrc(null)}
                          className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all text-xs"
                        >
                          ОТМЕНА
                        </button>
                        <button
                          type="button"
                          onClick={handleCropSave}
                          className="flex-1 bg-cyber-yellow border border-cyber-yellow text-[#06040c] hover:bg-[#ffc800] rounded-xl py-2.5 text-center font-bold uppercase transition-all text-xs shadow-[0_0_12px_rgba(255,183,0,0.2)]"
                        >
                          ПРИМЕНИТЬ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleAddGame} className="space-y-4 text-xs">
                      {activeModalTab === "parameters" ? (
                        /* Parameters Tab */
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">НАЗВАНИЕ ИГРЫ:</label>
                            <input
                              type="text"
                              required
                              value={newGameName}
                              onChange={(e) => setNewGameName(e.target.value)}
                              placeholder="Arknights: Endfield"
                              className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">ПУТЬ К ФАЙЛУ (.EXE):</label>
                            <input
                              type="text"
                              required
                              value={newGamePath}
                              onChange={(e) => setNewGamePath(e.target.value)}
                              placeholder="C:\Games\Endfield\Endfield.exe"
                              className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">СВОЯ ИКОНКА:</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCropSrc(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                id="custom-icon-upload"
                                className="hidden"
                              />
                              <label
                                htmlFor="custom-icon-upload"
                                className="border border-dashed border-cyber-yellow/45 hover:border-cyber-yellow bg-cyber-yellow/5 hover:bg-cyber-yellow/10 rounded px-4 py-2 text-[10px] font-bold text-cyber-yellow uppercase tracking-wider transition-all flex-1 text-center"
                              >
                                {newGameIcon ? "Сменить иконку" : "Загрузить изображение"}
                              </label>
                              {newGameIcon && (
                                <div className="relative">
                                  <img src={newGameIcon} alt="Preview" className="w-9 h-9 object-contain rounded-lg border border-cyber-yellow/25 bg-[#050308]" />
                                  <button
                                    type="button"
                                    onClick={() => setNewGameIcon(null)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">КАТЕГОРИЯ (ЖАНР):</label>
                              <select
                                value={newGameCategory}
                                onChange={(e) => setNewGameCategory(e.target.value)}
                                className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                              >
                                <option value="RPG / Strategy">RPG / Стратегия</option>
                                <option value="Action RPG">Action RPG</option>
                                <option value="Shooter">Шутер</option>
                                <option value="Simulation">Симулятор</option>
                                <option value="Action / Adventure">Приключения / Экшен</option>
                                <option value="System Tool">Системная утилита</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">ЦВЕТОВОЙ АКЦЕНТ:</label>
                              <select
                                value={newGameTheme}
                                onChange={(e) => setNewGameTheme(e.target.value)}
                                className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                              >
                                <option value="yellow">Желтый</option>
                                <option value="purple">Фиолетовый</option>
                                <option value="green">Зеленый</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Functions Tab */
                        <div className="space-y-4">
                          <div className="space-y-1 font-mono">
                            <span className="block text-[10px] text-cyber-yellow uppercase tracking-wider font-bold">// АВТОЗАПУСК ДЕЙСТВИЙ</span>
                            <p className="text-[9px] text-gray-500 leading-normal">
                              Укажите URL-ссылки. При запуске игры Noklin автоматически откроет каждую из них в вашем браузере по умолчанию.
                            </p>
                          </div>

                          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {newGameUrls.length === 0 ? (
                              <div className="border border-dashed border-cyber-yellow/15 rounded-xl p-5 text-center text-gray-500 font-mono text-[10px]">
                                Нет настроенных автодействий
                              </div>
                            ) : (
                              newGameUrls.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    required
                                    value={url}
                                    onChange={(e) => {
                                      const updatedUrls = [...newGameUrls];
                                      updatedUrls[index] = e.target.value;
                                      setNewGameUrls(updatedUrls);
                                    }}
                                    placeholder="https://map.hoyolab.com/"
                                    className="flex-1 bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewGameUrls(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="w-8 h-8 rounded border border-red-500/25 bg-red-950/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 hover:border-red-500 flex items-center justify-center transition-all shrink-0 font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setNewGameUrls(prev => [...prev, ""])}
                            className="w-full border border-dashed border-cyber-yellow/30 hover:border-cyber-yellow bg-cyber-yellow/5 hover:bg-cyber-yellow/10 rounded-xl py-2 text-[10px] font-bold text-cyber-yellow uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Добавить ссылку
                          </button>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAddGameOpen(false)}
                          className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all"
                        >
                          ОТМЕНА
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-cyber-yellow border border-cyber-yellow text-[#06040c] hover:bg-[#ffc800] rounded-xl py-2.5 text-center font-bold uppercase transition-all shadow-[0_0_12px_rgba(255,183,0,0.2)]"
                        >
                          {editingGameId ? "СОХРАНИТЬ ИЗМЕНЕНИЯ" : "ДОБАВИТЬ ИГРУ"}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {editProfileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99998] flex items-center justify-center p-6 select-none font-mono"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-cyber-sidebar border border-cyber-yellow/45 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative text-left"
                >
                  <div className="flex items-center justify-between border-b border-cyber-yellow/20 pb-3 mb-4">
                    <span className="text-xs font-black text-cyber-yellow tracking-widest flex items-center gap-1.5 uppercase">
                      <User className="w-4.5 h-4.5" />
                      РЕДАКТИРОВАНИЕ ПРОФИЛЯ
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditProfileOpen(false)}
                      className="text-gray-500 hover:text-white text-xs"
                    >
                      [ ESC ]
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setUserProfile((prev) => ({
                        ...prev,
                        nickname: tempProfileName.trim() || "Пользователь",
                        birthDate: tempProfileBirthDate
                      }));
                      setEditProfileOpen(false);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        НИКНЕЙМ:
                      </label>
                      <input
                        type="text"
                        required
                        value={tempProfileName}
                        onChange={(e) => setTempProfileName(e.target.value)}
                        placeholder="Введите никнейм"
                        className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        ДАТА РОЖДЕНИЯ:
                      </label>
                      <input
                        type="date"
                        value={tempProfileBirthDate}
                        onChange={(e) => setTempProfileBirthDate(e.target.value)}
                        className="w-full bg-[#050308] border border-cyber-yellow/25 focus:border-cyber-yellow text-white rounded px-3 py-2 text-xs transition-all font-mono focus:outline-none"
                      />
                    </div>

                    <div className="pt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditProfileOpen(false)}
                        className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all text-xs"
                      >
                        ОТМЕНА
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-cyber-yellow border border-cyber-yellow text-[#06040c] hover:bg-[#ffc800] rounded-xl py-2.5 text-center font-bold uppercase transition-all text-xs shadow-[0_0_12px_rgba(255,183,0,0.2)]"
                      >
                        СОХРАНИТЬ
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar Crop Modal */}
          <AnimatePresence>
            {cropSrc && cropTarget === "userAvatar" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-6 select-none font-mono"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-cyber-sidebar border border-cyber-yellow/45 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative text-left"
                >
                  <div className="space-y-5 text-center flex flex-col items-center py-2">
                    <div className="border-b border-cyber-yellow/20 pb-3 mb-2 w-full flex items-center justify-between">
                      <span className="text-xs font-black text-cyber-yellow tracking-widest flex items-center gap-1.5 uppercase">
                        <Crop className="w-4.5 h-4.5 animate-pulse" />
                        ОБРЕЗКА ФОТО ПРОФИЛЯ
                      </span>
                      <button
                        type="button"
                        onClick={() => setCropSrc(null)}
                        className="text-gray-500 hover:text-white text-xs"
                      >
                        [ ESC ]
                      </button>
                    </div>

                    <div
                      className="relative w-40 h-40 overflow-hidden border border-cyber-yellow/45 rounded-2xl bg-black/40 select-none cursor-move shadow-[0_0_20px_rgba(255,183,0,0.15)] flex items-center justify-center"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleMouseUp}
                    >
                      <img
                        src={cropSrc}
                        alt="Crop Preview"
                        draggable={false}
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: imageAspect > 1 ? "auto" : "100%",
                          height: imageAspect > 1 ? "100%" : "auto",
                          maxWidth: "none",
                          transform: `translate(-50%, -50%) translate(${dragPos.x}px, ${dragPos.y}px) scale(${zoom})`,
                          pointerEvents: "none"
                        }}
                      />
                      <div className="absolute inset-2 border-2 border-dashed border-cyber-yellow rounded-xl pointer-events-none opacity-50 shadow-[0_0_0_9999px_rgba(6,4,12,0.6)]" />
                    </div>

                    <div className="w-full space-y-1.5 px-4">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>МАСШТАБ:</span>
                        <span>{Math.round(zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#050308] border border-cyber-yellow/20 rounded-lg appearance-none accent-cyber-yellow"
                      />
                    </div>

                    <div className="pt-2 flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setCropSrc(null)}
                        className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all text-xs"
                      >
                        ОТМЕНА
                      </button>
                      <button
                        type="button"
                        onClick={handleCropSave}
                        className="flex-1 bg-cyber-yellow border border-cyber-yellow text-[#06040c] hover:bg-[#ffc800] rounded-xl py-2.5 text-center font-bold uppercase transition-all text-xs shadow-[0_0_12px_rgba(255,183,0,0.2)]"
                      >
                        ПРИМЕНИТЬ
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
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
              // РЕЖИМ ГЛУБОКОГО СОНА АКТИВЕН
            </div>

            {/* Bottom Wake Up Hint */}
            <div className="text-center font-mono text-[11px] text-cyber-green/70 tracking-[0.2em] uppercase select-none animate-pulse">
              НАЖМИТЕ <span className="text-white border border-cyber-green/40 px-2 py-0.5 rounded bg-cyber-green/10 font-bold mx-1">ENTER</span> ДЛЯ ПРОБУЖДЕНИЯ СИСТЕМЫ
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
            className={`fixed bg-[#0e091a]/95 text-[10px] font-mono py-1.5 px-3 rounded pointer-events-none z-[9999] whitespace-nowrap border transition-all duration-200 ${ tooltip.theme === "green" ? "border-cyber-green/50 text-cyber-green shadow-[0_0_12px_rgba(0,255,102,0.3)] [text-shadow:0_0_5px_rgba(0,255,102,0.5)]" : "border-cyber-purple/50 text-cyber-purple shadow-[0_0_12px_rgba(176,38,255,0.3)] [text-shadow:0_0_5px_rgba(176,38,255,0.5)]" }`}
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translateY(-50%)",
            }}
          >
            {/* Left pointer arrow */}
            <div className={`absolute top-1/2 -left-1 w-1.5 h-1.5 bg-[#0e091a] rotate-45 -translate-y-1/2 border-l border-b ${ tooltip.theme === "green" ? "border-cyber-green/50" : "border-cyber-purple/50" }`} />
            {tooltip.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && !contextMenu.isGame && (
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
            {/* Top section: Open in Obsidian & Creation */}
            {contextMenu.node && contextMenu.node.type === "file" && (
              <button
                onClick={() => handleContextAction("open-obsidian")}
                className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/20 hover:text-cyber-green rounded flex items-center gap-2 transition-colors font-bold text-cyber-green"
              >
                <ObsidianIcon className="w-3.5 h-3.5 text-cyber-green" />
                <span>Открыть в Obsidian</span>
              </button>
            )}
            <button
              onClick={() => handleContextAction("new-note")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-cyber-green" />
              <span>Новая заметка</span>
            </button>
            <button
              onClick={() => handleContextAction("new-folder")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-cyber-purple" />
              <span>Новая папка</span>
            </button>
            <button
              onClick={() => handleContextAction("new-canvas")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-gray-400" />
              <span>Новый холст</span>
            </button>
            <button
              onClick={() => handleContextAction("new-db")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-gray-400" />
              <span>Создать базу данных</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Middle section: File operations */}
            <button
              onClick={() => handleContextAction("copy")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Создать копию</span>
            </button>
            <button
              onClick={() => handleContextAction("move")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <CornerUpRight className="w-3.5 h-3.5 text-gray-400" />
              <span>Переместить...</span>
            </button>
            <button
              onClick={() => handleContextAction("search")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>Искать в папке</span>
            </button>
            <button
              onClick={() => handleContextAction("bookmark")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-gray-400" />
              <span>Добавить в закладки...</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Path operations */}
            <button
              onClick={() => handleContextAction("copy-path")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center justify-between transition-colors"
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
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>Показать в Проводнике</span>
            </button>

            <div className="h-[1px] bg-cyber-purple/15 my-1.5" />

            {/* Rename and delete */}
            <button
              onClick={() => handleContextAction("rename")}
              className="w-full text-left py-1.5 px-3 hover:bg-cyber-purple/15 hover:text-white rounded flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Переименовать</span>
            </button>
            <button
              onClick={() => handleContextAction("delete")}
              className="w-full text-left py-1.5 px-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded flex items-center gap-2 transition-colors font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Удалить</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Game Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && contextMenu.isGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed bg-[#0e091a]/95 border border-cyber-yellow/45 text-xs text-gray-300 py-2 px-1.5 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.7)] z-[9999] min-w-[210px] backdrop-blur-md select-none font-mono"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-3.5 py-1.5 text-[9px] text-gray-500 uppercase tracking-wider border-b border-cyber-yellow/15 mb-2 select-none">
              Управление ПО
            </div>
            <button
              onClick={() => handleGameContextAction("edit")}
              className="w-full text-left py-3 px-4 hover:bg-cyber-yellow/10 hover:text-cyber-yellow rounded flex items-center gap-3 transition-colors font-bold"
            >
              <Settings className="w-4.5 h-4.5 text-cyber-yellow" />
              <span>Изменить параметры</span>
            </button>
            <button
              onClick={() => handleGameContextAction("delete")}
              className="w-full text-left py-3 px-4 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded flex items-center gap-3 transition-colors font-black"
            >
              <Trash2 className="w-4.5 h-4.5 text-red-500" />
              <span>Удалить программу</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Obsidian News Path Prompt Modal */}
      <AnimatePresence>
        {isNewsPathPromptOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-6 select-none font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-cyber-sidebar border border-cyber-yellow/45 rounded-2xl p-6 shadow-[0_15px_40px_rgba(255,183,0,0.2)] relative text-left"
            >
              <div className="flex items-center gap-2 border-b border-cyber-yellow/20 pb-3 mb-4 text-cyber-yellow">
                <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
                <span className="text-xs font-black uppercase tracking-widest">
                  // CONFIG: OBSIDIAN PATH
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Пожалуйста, укажите путь к вашему каталогу новостей в Obsidian (например, папку "Лента новостей"):
                </p>
                <input
                  type="text"
                  placeholder="Например: C:\Vault\Лента новостей"
                  value={currentObsidianNewsPath}
                  onChange={(e) => setObsidianNewsPath(e.target.value)}
                  className="w-full bg-[#06040c]/85 border border-cyber-yellow/20 focus:border-cyber-yellow text-cyber-yellow placeholder-gray-700 focus:ring-1 focus:ring-cyber-yellow rounded px-3 py-2 text-xs transition-all font-mono shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)] cursor-text"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewsPathPromptOpen(false)}
                  className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all text-xs"
                >
                  ОТМЕНА
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewsPathPromptOpen(false);
                    const pathParam = currentObsidianNewsPath ? `?path=${encodeURIComponent(currentObsidianNewsPath)}` : "";
                    invoke("open_url", { url: `obsidian://open${pathParam}` })
                      .catch(err => console.error("Failed to open Obsidian:", err));
                  }}
                  className="flex-1 bg-cyber-yellow/10 border border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow hover:text-black rounded-xl py-2.5 text-center font-bold uppercase transition-all text-xs shadow-[0_0_15px_rgba(255,183,0,0.15)]"
                >
                  ОТКРЫТЬ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {gameToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-6 select-none font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-cyber-sidebar border border-red-500/50 rounded-2xl p-6 shadow-[0_15px_40px_rgba(239,68,68,0.15)] relative text-left"
            >
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-3 mb-4 text-red-500">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">
                  ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Вы действительно хотите удалить <span className="text-white font-bold">{gameToDelete.name}</span> из лаунчера? 
                </p>
                <p className="text-[10px] text-gray-500 leading-normal border-l-2 border-red-500/30 pl-3">
                  Вся статистика запущенных сессий и общее время игры ({formatPlayTime(gameToDelete.playTime)}) будут безвозвратно удалены.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setGameToDelete(null)}
                  className="flex-1 border border-white/10 hover:bg-white/5 rounded-xl py-2.5 text-center text-gray-400 font-bold uppercase transition-all text-xs"
                >
                  ОТМЕНА
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteGame(gameToDelete.id);
                    setGameToDelete(null);
                  }}
                  className="flex-1 bg-red-950/20 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 rounded-xl py-2.5 text-center font-bold uppercase transition-all text-xs shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  УДАЛИТЬ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-6 select-none font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-cyber-sidebar border border-cyber-green/40 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,255,102,0.15)] relative text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2 text-cyber-green">
                  <Settings className="w-5 h-5 text-cyber-green" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    НАСТРОЙКИ ХРАНИЛИЩА И МЕДИА
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-cyber-green" />
                    Основной путь к Obsidian Vault
                  </label>
                  <input
                    type="text"
                    value={vaultPath}
                    onChange={(e) => setVaultPath(e.target.value)}
                    placeholder="C:\Users\Имя\Хранилище"
                    className="w-full bg-[#06040c]/80 border border-cyber-green/30 text-cyber-green placeholder-gray-600 focus:outline-none focus:border-cyber-green rounded px-3 py-2 text-xs transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Папка вашего хранилища заметок .md
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-cyber-yellow" />
                    Прямой путь к папке с изображениями (опционально)
                  </label>
                  <input
                    type="text"
                    value={customImagesPath}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomImagesPath(val);
                      localStorage.setItem("cyber_custom_images_path", val);
                      resolvedRef.current = {};
                      setResolvedImageUrls({});
                    }}
                    placeholder="C:\Users\Имя\Хранилище\img"
                    className="w-full bg-[#06040c]/80 border border-cyber-yellow/40 text-cyber-yellow placeholder-gray-600 focus:outline-none focus:border-cyber-yellow rounded px-3 py-2 text-xs transition-all font-mono"
                  />
                  <span className="text-[10px] text-cyber-yellow/70 mt-1 block">
                    Укажите папки типа C:\Vault\img — фото будут грузиться напрямую и мгновенно!
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full bg-cyber-green text-black font-black rounded-xl py-2.5 px-4 shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-[#15ff7a] transition-all text-xs font-mono uppercase"
                >
                  СОХРАНИТЬ И ЗАКРЫТЬ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
