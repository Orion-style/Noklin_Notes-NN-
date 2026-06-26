import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Terminal, Folder, Layers, ChevronRight, ChevronLeft, X, HelpCircle, Gamepad2 } from "lucide-react";

const onboardingSteps = [
  {
    icon: Cpu,
    title: "ОБЗОР СИСТЕМЫ",
    subtitle: "Cybernetic Note Terminal",
    description: "Добро пожаловать в CYBER-NOTES — высокотехнологичный менеджер локальных заметок Obsidian. Система работает на базе сверхбыстрого движка Tauri и Rust, обеспечивая полную конфиденциальность и мгновенную загрузку ваших файлов.",
    colorClass: "text-cyber-green",
    borderColorClass: "border-cyber-green/30"
  },
  {
    icon: Terminal,
    title: "ПОДКЛЮЧЕНИЕ ХРАНИЛИЩА",
    subtitle: "Инициализация локального пути",
    description: "В боковой панели слева найдите поле ввода пути к вашему хранилищу (Obsidian Vault Path). Введите абсолютный путь (например, C:\\Users\\Name\\Vault) и нажмите кнопку «CONNECT VAULT» для запуска индексатора файлов.",
    colorClass: "text-cyber-purple",
    borderColorClass: "border-cyber-purple/30"
  },
  {
    icon: Folder,
    title: "ПРОВОДНИК ФАЙЛОВ",
    subtitle: "Управление заметками",
    description: "После успешной авторизации в списке «Vault Files» отобразится дерево ваших заметок в формате Markdown. Вы можете мгновенно переключаться между файлами с помощью адаптивного курсора. Количество файлов выводится в индикаторе.",
    colorClass: "text-cyber-green",
    borderColorClass: "border-cyber-green/30"
  },
  {
    icon: Layers,
    title: "ИНТЕРАКТИВНЫЙ РЕЖИМ",
    subtitle: "Мониторинг и диагностика",
    description: "Центральная панель служит вашим редактором и превьюером. Здесь вы увидите метаданные файлов, статус шифрования локального диска, системный лог целостности базы данных и интерактивные графики взаимосвязей.",
    colorClass: "text-cyber-purple",
    borderColorClass: "border-cyber-purple/30"
  },
  {
    icon: Gamepad2,
    title: "ИГРОВОЙ МЕНЕДЖЕР",
    subtitle: "Дорожная карта & Будущие фичи",
    description: "На следующем этапе разработки приложение превратится в полноценный игровой хаб. Вы сможете автоматически отслеживать часы, проведенные в любимых играх на ПК, привязывать игровые заметки к внутриигровым локациям, датам и времени, а также сортировать и фильтровать ваши отчеты.",
    colorClass: "text-cyber-green",
    borderColorClass: "border-cyber-green/30"
  }
];

export default function OnboardingWidget({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = onboardingSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center bg-[#06040c]/80 backdrop-blur-md z-[9998] p-4 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[#0e091a]/95 border border-cyber-purple/35 rounded-2xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col min-h-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Glowing Accents */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-cyber-purple/50" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-cyber-purple/50" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-cyber-green/50" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-cyber-green/50" />

        {/* Header Info */}
        <div className="flex items-center justify-between border-b border-cyber-purple/15 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-cyber-purple" />
            <span className="text-[11px] text-gray-400 font-mono tracking-widest uppercase">
              РУКОВОДСТВО ПОЛЬЗОВАТЕЛЯ & ДОРОЖНАЯ КАРТА
            </span>
          </div>
          <button
            onClick={onClose}
            className="magnetic-target w-6.5 h-6.5 rounded border border-cyber-purple/20 flex items-center justify-center hover:bg-cyber-purple/10 hover:border-cyber-purple/50 transition-all cursor-none"
            title="Закрыть"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Slide transition container */}
        <div className="flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Step Icon and Status */}
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-xl border ${step.borderColorClass} flex items-center justify-center bg-cyber-purple/5 shadow-[0_0_15px_rgba(176,38,255,0.1)]`}>
                  <StepIcon className={`w-7 h-7 ${step.colorClass}`} />
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-wider font-mono uppercase ${step.colorClass}`}>
                    {step.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono tracking-wide">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              {/* Description Text */}
              <p className="text-sm text-gray-300 font-sans leading-relaxed mb-6 font-normal">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Footer controls */}
          <div className="border-t border-cyber-purple/10 pt-5 flex items-center justify-between mt-auto">
            {/* Steps Dots */}
            <div className="flex gap-2">
              {onboardingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? "w-8 bg-cyber-green shadow-[0_0_8px_#00ff66]" : "w-1.5 bg-cyber-purple/30"
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="magnetic-target flex items-center gap-1.5 bg-transparent hover:bg-cyber-purple/10 border border-cyber-purple/30 text-gray-300 font-mono text-[10px] rounded px-3.5 py-2 transition-all cursor-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  НАЗАД
                </button>
              )}

              <button
                onClick={handleNext}
                className="magnetic-target flex items-center gap-1.5 bg-cyber-green hover:bg-[#15ff7a] text-[#06040c] font-black font-mono text-[10px] rounded px-5 py-2 shadow-[0_0_10px_rgba(0,255,102,0.2)] hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] transition-all cursor-none"
              >
                {currentStep === onboardingSteps.length - 1 ? "ПОНЯТНО" : "ДАЛЕЕ"}
                {currentStep < onboardingSteps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
