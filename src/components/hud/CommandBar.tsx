import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Sparkles, Square, Wrench } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAgentStore } from "../../store/useAgentStore";

export const CommandBar: React.FC = () => {
  const { inputText, setInputText, sendMessage, cancelStreaming, isSending, currentToolName } = useChatStore();
  const { isListening, setIsListening, setAudioLevel, currentAgent } = useAgentStore();
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = "vi-VN"; // Vietnamese voice recognition

      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
        setAudioLevel(0.8);
      };

      recog.onend = () => {
        setIsListening(false);
        setAudioLevel(0);
      };

      recog.onerror = (event: any) => {
        console.warn("Lỗi nhận diện giọng nói:", event.error);
        setIsListening(false);
        setAudioLevel(0);
      };

      setRecognition(recog);
    }
  }, [setInputText, setIsListening, setAudioLevel]);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognition) {
      alert("Trình duyệt không hỗ trợ Web Speech API. Vui lòng nhập bằng bàn phím.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Không thể bật micro:", e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isSending) return;
    sendMessage(inputText);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto space-y-1.5">
      {/* Tool Execution Notification Pill */}
      {currentToolName && (
        <div className="flex items-center space-x-1.5 text-[10px] text-[#ffaa00] bg-[#020813]/90 border border-[#ffaa00]/40 px-3 py-0.5 rounded-full w-fit animate-pulse shadow-[0_0_8px_rgba(255,170,0,0.3)]">
          <Wrench className="w-3 h-3" />
          <span className="font-bold">ĐANG THỰC THI CÔNG CỤ:</span>
          <span className="font-mono text-white">{currentToolName}</span>
        </div>
      )}

      {/* Main Command Input Box */}
      <div className="relative bg-[#051428]/95 border border-[#00f0ff]/40 rounded-lg p-2 flex items-center space-x-2 box-glow-cyan shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {/* Terminal Indicator Icon & Agent Tag */}
        <div className="flex items-center space-x-1 pl-2 text-[#00f0ff] shrink-0">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest font-['Orbitron',sans-serif] hidden sm:inline text-[#00f0ff]/80">
            {currentAgent}://
          </span>
        </div>

        {/* Textarea Input supporting multi-line with Shift+Enter */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="Nhập mệnh lệnh hoặc câu hỏi cho HADES (Enter gửi, Shift+Enter xuống dòng)..."
          className="flex-1 bg-transparent text-[#e0f7ff] placeholder-[#00f0ff]/30 text-sm focus:outline-none font-['Rajdhani',sans-serif] tracking-wider py-1 resize-none max-h-24"
        />

        {/* Voice Push-to-Talk Toggle */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          disabled={isSending}
          title={isListening ? "Đang lắng nghe (Bấm để dừng)" : "Bấm để nói (Voice Push-to-Talk vi-VN)"}
          className={`p-2 rounded transition-all duration-200 cursor-pointer shrink-0 ${
            isListening
              ? "bg-[#ff3344]/30 text-[#ff3344] border border-[#ff3344] animate-pulse shadow-[0_0_12px_#ff3344]"
              : "text-[#00f0ff]/70 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 disabled:opacity-30"
          }`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Action Button: Send or Stop Streaming */}
        {isSending ? (
          <button
            type="button"
            onClick={cancelStreaming}
            title="Dừng phản hồi AI"
            className="bg-[#ff3344]/20 hover:bg-[#ff3344]/40 text-[#ff8088] border border-[#ff3344] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-['Orbitron',sans-serif] transition-all flex items-center space-x-1 cursor-pointer shadow-[0_0_12px_rgba(255,51,68,0.4)] animate-pulse shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>DỪNG</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/50 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-['Orbitron',sans-serif] transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] shrink-0"
          >
            <span>GỬI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
