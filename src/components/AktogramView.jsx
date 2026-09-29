import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Plus, Flame, Zap, Heart, Sparkles, MessageSquare, Eye, Trash2, 
  Share2, Image as ImageIcon, Send, Filter, Check, CornerDownRight, 
  Layers, User, Hash, Clock, RefreshCw, UploadCloud,
  Frown, Angry, Laugh, Skull
} from "lucide-react";
import { CyberCameraIcon } from "./Icons";
import { simulatePostEngagement, VIRTUAL_BOTS, formatMetricNumber } from "../utils/aktogramEngine";
import { generateSmartComments, generateAiComments } from "../utils/aktogramAiService";

// Available emotional reactions in Aktogram
const REACTION_CONFIGS = [
  { key: "likes", label: "Нравится (⚡)", icon: Zap, activeClass: "bg-cyber-yellow text-black shadow-[0_0_10px_rgba(255,183,0,0.4)]", hoverClass: "hover:border-cyber-yellow/50 text-gray-300 hover:text-cyber-yellow" },
  { key: "flames", label: "Огонь (🔥)", icon: Flame, activeClass: "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]", hoverClass: "hover:border-red-400/50 text-gray-300 hover:text-red-400" },
  { key: "sparks", label: "Кибер / Вайб (❤️)", icon: Heart, activeClass: "bg-cyber-purple text-white shadow-[0_0_10px_rgba(176,38,255,0.4)]", hoverClass: "hover:border-cyber-purple/50 text-gray-300 hover:text-cyber-purple" },
  { key: "diamonds", label: "Алмаз (💎)", icon: Sparkles, activeClass: "bg-cyan-400 text-black shadow-[0_0_10px_rgba(56,189,248,0.4)]", hoverClass: "hover:border-cyan-400/50 text-gray-300 hover:text-cyan-400" },
  { key: "laugh", label: "Рофл / Смех (😂)", icon: Laugh, activeClass: "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]", hoverClass: "hover:border-amber-400/50 text-gray-300 hover:text-amber-400" },
  { key: "skull", label: "Разрыв (💀)", icon: Skull, activeClass: "bg-zinc-200 text-black shadow-[0_0_10px_rgba(228,228,231,0.4)]", hoverClass: "hover:border-zinc-400/50 text-gray-300 hover:text-zinc-200" },
  { key: "sad", label: "Грусть / F (😢)", icon: Frown, activeClass: "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]", hoverClass: "hover:border-blue-400/50 text-gray-300 hover:text-blue-400" },
  { key: "angry", label: "Гнев / Рейдж (😡)", icon: Angry, activeClass: "bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.4)]", hoverClass: "hover:border-orange-500/50 text-gray-300 hover:text-orange-400" },
];

export default function AktogramView({
  posts = [],
  setPosts,
  compressImage,
  aiConfig = { mode: "offline" },
  onOpenSettings,
}) {
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'media', 'game', 'dev'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostForView, setSelectedPostForView] = useState(null);

  // New Post Form State
  const [newText, setNewText] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState(["киберпанк"]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Comment input state for modal viewer
  const [commentInput, setCommentInput] = useState("");

  // Periodically refresh/simulate engagement for all posts
  useEffect(() => {
    const updateEngagement = () => {
      setPosts(prevPosts => {
        return prevPosts.map(post => simulatePostEngagement(post));
      });
    };

    updateEngagement();
    const interval = setInterval(updateEngagement, 45000); // refresh every 45s
    return () => clearInterval(interval);
  }, [setPosts]);

  // Handle adding tag
  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = newTagInput.trim().replace(/^#/, "");
      if (tag && !newTags.includes(tag)) {
        setNewTags([...newTags, tag]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewTags(newTags.filter(t => t !== tagToRemove));
  };

  // Handle image pick
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target.result;
      if (compressImage) {
        try {
          const compressed = await compressImage(rawDataUrl, 1600, 1000, 0.85);
          setImagePreview(compressed);
          setSelectedImage(compressed);
        } catch {
          setImagePreview(rawDataUrl);
          setSelectedImage(rawDataUrl);
        }
      } else {
        setImagePreview(rawDataUrl);
        setSelectedImage(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newText.trim() && !selectedImage) return;

    setIsSubmitting(true);
    const trimmedText = newText.trim();
    const currentTags = [...newTags];
    const newPostId = `post_${Date.now()}`;

    // Instant smart contextual comments matching the post's event
    const initialComments = generateSmartComments(trimmedText, currentTags, 2);

    const newPostObj = {
      id: newPostId,
      text: trimmedText,
      tags: currentTags,
      imageUrl: selectedImage || null,
      createdAt: new Date().toISOString(),
      reactions: { likes: 0, flames: 0, sparks: 0, diamonds: 0, laugh: 0, skull: 0, sad: 0, angry: 0 },
      userReacted: {},
      comments: initialComments,
      views: 1
    };

    // Calculate initial base simulation
    const simulated = simulatePostEngagement(newPostObj);

    setPosts(prev => [simulated, ...prev]);
    setIsSubmitting(false);
    setIsCreateModalOpen(false);
    setNewText("");
    setNewTags(["киберпанк"]);
    setSelectedImage(null);
    setImagePreview(null);

    // If neural AI API is active, run single-shot background enhancement
    if (aiConfig && (aiConfig.mode === "groq" || aiConfig.mode === "ollama")) {
      try {
        const aiComments = await generateAiComments(trimmedText, currentTags, aiConfig);
        if (aiComments && aiComments.length > 0) {
          setPosts(prev => prev.map(p => {
            if (p.id !== newPostId) return p;
            return {
              ...p,
              comments: aiComments
            };
          }));
        }
      } catch (err) {
        console.warn("AI background comments generation failed:", err);
      }
    }
  };

  // User Reaction Toggle
  const handleToggleReaction = (postId, reactionType) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id !== postId) return p;
        const currentReacted = p.userReacted?.[reactionType] || false;
        const nextReacted = !currentReacted;

        const currentCount = p.reactions?.[reactionType] || 0;
        const nextCount = nextReacted ? currentCount + 1 : Math.max(0, currentCount - 1);

        const updated = {
          ...p,
          userReacted: {
            ...(p.userReacted || {}),
            [reactionType]: nextReacted
          },
          reactions: {
            ...(p.reactions || {}),
            [reactionType]: nextCount
          }
        };

        if (selectedPostForView?.id === postId) {
          setSelectedPostForView(updated);
        }
        return updated;
      })
    );
  };

  // Add custom comment from user
  const handleAddUserComment = (postId) => {
    if (!commentInput.trim()) return;
    const newComment = {
      id: `usr_cmt_${Date.now()}`,
      bot: {
        id: "me",
        name: "Оператор (Вы)",
        handle: "@operator",
        avatarColor: "#ffb700",
        role: "Host"
      },
      text: commentInput.trim(),
      createdAt: new Date().toISOString()
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const updated = {
          ...p,
          comments: [...(p.comments || []), newComment]
        };
        if (selectedPostForView?.id === postId) {
          setSelectedPostForView(updated);
        }
        return updated;
      })
    );
    setCommentInput("");
  };

  // Delete post
  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPostForView?.id === postId) {
      setSelectedPostForView(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (activeFilter === "media") return !!post.imageUrl;
    if (activeFilter === "game") {
      const txt = `${post.text} ${(post.tags || []).join(" ")}`.toLowerCase();
      return txt.includes("game") || txt.includes("игра") || txt.includes("steam");
    }
    if (activeFilter === "dev") {
      const txt = `${post.text} ${(post.tags || []).join(" ")}`.toLowerCase();
      return txt.includes("code") || txt.includes("код") || txt.includes("dev");
    }
    return true;
  });

  // Calculate total stats
  const totalReactions = posts.reduce((acc, p) => {
    const r = p.reactions || {};
    return acc + (r.likes || 0) + (r.flames || 0) + (r.sparks || 0) + (r.diamonds || 0)
      + (r.laugh || 0) + (r.skull || 0) + (r.sad || 0) + (r.angry || 0);
  }, 0);

  const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

  return (
    <div className="flex-1 h-full overflow-hidden bg-[#05030a] text-gray-200 flex flex-col font-mono select-none">
      {/* Top Header Bar */}
      <div className="h-16 border-b border-cyber-yellow/20 bg-cyber-sidebar/75 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-center justify-center text-cyber-yellow shadow-[0_0_15px_rgba(255,183,0,0.2)]">
            <CyberCameraIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black uppercase tracking-wider text-white">АКТОГРАММ</h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40">
                LOCAL FEED v1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Локальная сеть с живой симуляцией аудитории и эмоций
            </p>
          </div>
        </div>

        {/* Global Activity Stats & Create Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Layers className="w-3.5 h-3.5 text-cyber-yellow" />
              <span>Постов: <strong className="text-white">{posts.length}</strong></span>
            </div>
            <div className="w-[1px] h-3.5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-gray-400">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Эмоций: <strong className="text-white">{formatMetricNumber(totalReactions)}</strong></span>
            </div>
            <div className="w-[1px] h-3.5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageSquare className="w-3.5 h-3.5 text-cyber-green" />
              <span>Откликов: <strong className="text-white">{totalComments}</strong></span>
            </div>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                aiConfig?.mode === "groq"
                  ? "border-cyber-purple/50 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 shadow-[0_0_12px_rgba(176,38,255,0.25)]"
                  : aiConfig?.mode === "ollama"
                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20"
              }`}
              title="Настройки генератора комментариев (Groq, Ollama или Умный контекст)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {aiConfig?.mode === "groq" ? "AI: Groq Llama 3" : aiConfig?.mode === "ollama" ? "AI: Ollama" : "AI: Смарт-контекст"}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-yellow text-black font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 transition-all shadow-[0_0_18px_rgba(255,183,0,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Новый пост</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Feed & Sidebar */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left/Center Feed Stream */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
          {/* Feed Filter Pills */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            {[
              { id: "all", label: "Вся лента" },
              { id: "media", label: "Только фото" },
              { id: "game", label: "Игровые" },
              { id: "dev", label: "Код & Дев" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40 shadow-[0_0_10px_rgba(255,183,0,0.15)]"
                    : "bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center text-cyber-yellow mb-4">
                <CyberCameraIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Лента Актограмма пуста</h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5">
                Опубликуйте свой первый пост со скриншотом или мыслью — боты-подписчики сразу оценят его эмоциями!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40 font-bold text-xs uppercase hover:bg-cyber-yellow hover:text-black transition-all cursor-pointer"
              >
                Создать первую публикацию
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {filteredPosts.map(post => {
                const reactions = post.reactions || {};
                const userReacted = post.userReacted || {};
                const comments = post.comments || [];

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0714]/80 border border-cyber-yellow/20 hover:border-cyber-yellow/40 rounded-2xl p-5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-center justify-center text-cyber-yellow font-bold text-xs">
                          OP
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Оператор</span>
                            <span className="text-[10px] text-gray-500">@local_core</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <Eye className="w-3 h-3 ml-1 text-gray-400" />
                            <span>{formatMetricNumber(post.views || 1)} просм.</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Удалить пост"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Post Text */}
                    {post.text && (
                      <p className="text-xs text-gray-200 leading-relaxed mb-3.5 whitespace-pre-wrap select-text font-sans">
                        {post.text}
                      </p>
                    )}

                    {/* Post Image (Clickable for zoom) */}
                    {post.imageUrl && (
                      <div 
                        onClick={() => setSelectedPostForView(post)}
                        className="rounded-xl overflow-hidden border border-white/10 mb-3.5 max-h-[420px] bg-black/60 relative group cursor-pointer"
                      >
                        <img 
                          src={post.imageUrl} 
                          alt="Post media" 
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-lg bg-black/70 border border-white/20 text-[11px] text-white">
                            Нажмите для просмотра
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {post.tags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] text-cyber-yellow/80 bg-cyber-yellow/5 border border-cyber-yellow/20 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reactions Bar (Живые эмоции) */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                        {REACTION_CONFIGS.map(({ key, label, icon: Icon, activeClass, hoverClass }) => {
                          const isReacted = !!userReacted[key];
                          const count = reactions[key] || 0;
                          return (
                            <button
                              key={key}
                              onClick={() => handleToggleReaction(post.id, key)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isReacted
                                  ? activeClass
                                  : `bg-black/40 border border-white/10 ${hoverClass}`
                              }`}
                              title={`${label}: ${count}`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{formatMetricNumber(count)}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Comments Preview Button */}
                      <button
                        onClick={() => setSelectedPostForView(post)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyber-green" />
                        <span>{comments.length} отклик.</span>
                      </button>
                    </div>

                    {/* Latest Comment Snippet */}
                    {comments.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-2 text-[11px]">
                        <span 
                          className="font-bold shrink-0"
                          style={{ color: comments[comments.length - 1].bot?.avatarColor || "#ffb700" }}
                        >
                          {comments[comments.length - 1].bot?.name}:
                        </span>
                        <span className="text-gray-400 truncate flex-1 font-sans">
                          {comments[comments.length - 1].text}
                        </span>
                        {comments.length > 1 && (
                          <button
                            onClick={() => setSelectedPostForView(post)}
                            className="text-[10px] text-cyber-yellow hover:underline shrink-0"
                          >
                            все {comments.length}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Info Column: Virtual Feed Subscribers & Activity */}
        <div className="w-72 border-l border-white/10 bg-[#07050e]/60 p-4 hidden lg:flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
              <User className="w-4 h-4 text-cyber-yellow" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Участники сети ({VIRTUAL_BOTS.length})
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-none">
              {VIRTUAL_BOTS.map(bot => (
                <div 
                  key={bot.id} 
                  className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border"
                      style={{ 
                        backgroundColor: `${bot.avatarColor}20`,
                        borderColor: `${bot.avatarColor}50`,
                        color: bot.avatarColor 
                      }}
                    >
                      {bot.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{bot.name}</p>
                      <p className="text-[9px] text-gray-500 truncate">{bot.handle || `@${bot.name.toLowerCase()}`}</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse shrink-0" title="В сети" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyber-yellow/5 border border-cyber-yellow/20 text-[10px] text-gray-400">
            <span className="text-cyber-yellow font-bold block mb-1">Событийные комментарии:</span>
            Игроки реагируют на контекст вашего поста (боссы, лут, баги, графика) без фонового спама и нагрузки на систему.
          </div>
        </div>
      </div>

      {/* Modal: Create New Post */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateModalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0c0817] border border-cyber-yellow/40 rounded-2xl p-6 shadow-[0_15px_45px_rgba(0,0,0,0.85)] relative text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2 text-cyber-yellow">
                  <CyberCameraIcon className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    НОВАЯ ПУБЛИКАЦИЯ В АКТОГРАММ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Text Input */}
              <div className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Поделитесь скриншотом, заметкой или мыслью..."
                    className="w-full bg-black/60 border border-white/15 focus:border-cyber-yellow/60 text-white placeholder-gray-500 rounded-xl p-3 text-xs font-mono focus:ring-0 focus:outline-none transition-all resize-none cursor-text font-sans"
                  />
                </div>

                {/* Image Upload Area */}
                <div>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-cyber-yellow/40 max-h-56 bg-black/70 group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedImage(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        title="Удалить картинку"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-white/20 hover:border-cyber-yellow/50 rounded-xl p-5 text-center cursor-pointer bg-black/30 hover:bg-cyber-yellow/5 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-6 h-6 text-cyber-yellow" />
                      <span className="text-xs text-gray-300 font-bold">Прикрепить изображение</span>
                      <span className="text-[10px] text-gray-500">PNG, JPG, WebP (сжимается автоматически)</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Tags input */}
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1.5 font-bold">
                    Теги (нажмите Enter для добавления):
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-cyber-yellow/15 border border-cyber-yellow/30 text-cyber-yellow px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Например: gamedev, скриншот, cyberpunk"
                    className="w-full bg-black/60 border border-white/15 focus:border-cyber-yellow/60 text-white placeholder-gray-600 rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs uppercase font-bold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || (!newText.trim() && !selectedImage)}
                  onClick={handleCreatePost}
                  className="px-5 py-2 rounded-xl bg-cyber-yellow text-black font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(255,183,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Опубликовать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: View Post Details & Comments */}
      <AnimatePresence>
        {selectedPostForView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPostForView(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-6 select-none font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[88vh] bg-[#0c0817] border border-cyber-yellow/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Media on left/top */}
              {selectedPostForView.imageUrl ? (
                <div className="md:w-1/2 bg-black flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10 overflow-hidden max-h-[40vh] md:max-h-full">
                  <img
                    src={selectedPostForView.imageUrl}
                    alt="Post media"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}

              {/* Right Side Details & Comments */}
              <div className={`flex-1 flex flex-col justify-between overflow-hidden p-5 ${!selectedPostForView.imageUrl ? "w-full" : ""}`}>
                {/* Header & Post Content */}
                <div className="shrink-0 border-b border-white/10 pb-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-center justify-center text-cyber-yellow font-bold text-xs">
                        OP
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Оператор</span>
                        <span className="text-[10px] text-gray-500">{new Date(selectedPostForView.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPostForView(null)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedPostForView.text && (
                    <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-wrap select-text max-h-32 overflow-y-auto">
                      {selectedPostForView.text}
                    </p>
                  )}

                  {/* Modal Reactions Bar */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/5">
                    {REACTION_CONFIGS.map(({ key, label, icon: Icon, activeClass, hoverClass }) => {
                      const isReacted = !!selectedPostForView.userReacted?.[key];
                      const count = selectedPostForView.reactions?.[key] || 0;
                      return (
                        <button
                          key={key}
                          onClick={() => handleToggleReaction(selectedPostForView.id, key)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isReacted
                              ? activeClass
                              : `bg-black/40 border border-white/10 ${hoverClass}`
                          }`}
                          title={`${label}: ${count}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{formatMetricNumber(count)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
                    Комментарии подписчиков ({selectedPostForView.comments?.length || 0}):
                  </span>

                  {(selectedPostForView.comments || []).length === 0 ? (
                    <p className="text-xs text-gray-500 py-6 text-center">
                      Пока нет комментариев. Скоро аудитория откликнется!
                    </p>
                  ) : (
                    (selectedPostForView.comments || []).map((cmt, i) => (
                      <div key={cmt.id || i} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[11px] font-bold"
                              style={{ color: cmt.bot?.avatarColor || "#ffb700" }}
                            >
                              {cmt.bot?.name || "Аноним"}
                            </span>
                            <span className="text-[9px] text-gray-500">{cmt.bot?.handle}</span>
                          </div>
                          <span className="text-[9px] text-gray-600">
                            {cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-sans leading-relaxed select-text">
                          {cmt.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="pt-3 border-t border-white/10 shrink-0 mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddUserComment(selectedPostForView.id)}
                      placeholder="Написать ответ в тред..."
                      className="flex-1 bg-black/60 border border-white/15 focus:border-cyber-yellow/60 text-white placeholder-gray-600 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddUserComment(selectedPostForView.id)}
                      className="px-3 py-1.5 rounded-xl bg-cyber-yellow/20 hover:bg-cyber-yellow hover:text-black border border-cyber-yellow/40 text-cyber-yellow text-xs font-bold transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
