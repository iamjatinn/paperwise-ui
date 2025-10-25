import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Send,
  Download,
  Share2,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Mic,
  MicOff,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { useToast } from "@/hooks/use-toast";
import { useDocumentSummary } from "@/hooks/useDocumentSummary"; // Assuming this hook is correctly defined

// --- INTERFACE DEFINITIONS (Moved up for clarity) ---

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Document {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  user_id: string;
  processing_status: string;
  uploaded_at: string;
  ai_summary?: string;
  total_chunks?: number;
}

// --- FIXED VOICE AGENT COMPONENT ---

const VoiceAgent = ({
  onQuestion,
  disabled,
  onVoiceCommand,
  isSpeaking,
  isPaused,
}: {
  onQuestion: (question: string) => void;
  disabled: boolean;
  onVoiceCommand: (command: string) => void;
  isSpeaking: boolean;
  isPaused: boolean;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const voiceCommands: { [key: string]: string } = {
    pause: "pause",
    play: "play",
    resume: "play",
    stop: "stop",
    halt: "stop",
    end: "stop",
    summarize: "summarize",
    summary: "summarize",
    explain: "explain",
    "what is this": "what_is_this",
    "what is this about": "what_is_this",
    "tell me about this": "what_is_this",
    clear: "clear",
    help: "help",
  };

  const processVoiceCommand = useCallback(
    (text: string): boolean => {
      const cleanText = text.toLowerCase().trim();

      for (const [phrase, command] of Object.entries(voiceCommands)) {
        if (cleanText === phrase || cleanText.startsWith(phrase + " ")) {
          console.log(`🎯 Voice command detected: ${command}`);
          onVoiceCommand(command);
          return true;
        }
      }
      return false;
    },
    [onVoiceCommand]
  );

  const initializeRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Single utterance mode
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      console.log("🎤 Voice recognition started");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      if (currentTranscript.trim()) {
        setTranscript(currentTranscript.trim());
      }

      if (finalTranscript.trim()) {
        const finalCleanText = finalTranscript.trim();
        const isCommand = processVoiceCommand(finalCleanText);

        if (!isCommand) {
          onQuestion(finalCleanText);
        }

        setTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone blocked",
          description:
            "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("🎤 Voice recognition ended");
      setIsListening(false);
    };

    return recognition;
  }, [onQuestion, toast, processVoiceCommand]);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && isListening) {
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        toast({
          title: "🎤 Voice Agent Started",
          description: "I'm listening. Ask a question or say a command.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  }, [initializeRecognition, toast, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setTranscript("");
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      toast({
        title: "🎤 Voice Stopped",
        description: "Voice input has been stopped.",
        duration: 2000,
      });
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, toast]);

  const manualSend = useCallback(() => {
    if (transcript.trim().length > 0) {
      const isCommand = processVoiceCommand(transcript);
      if (!isCommand) {
        onQuestion(transcript);
      }
      setTranscript("");
      stopListening();
    }
  }, [transcript, onQuestion, stopListening, processVoiceCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Voice Agent
          {isListening && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Listening...
            </span>
          )}
        </h3>
      </div>

      {/* Status Display */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isListening ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <div>
              <p className="text-sm font-medium">
                {isListening
                  ? "🎤 Voice Input Active"
                  : "❌ Voice Input Inactive"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isListening
                  ? "Speak your question or command"
                  : "Click Start to activate voice"}
              </p>
            </div>
          </div>

          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={toggleListening}
            className="gap-2"
            disabled={disabled}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Voice
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Speech Status */}
      {(isSpeaking || isPaused) && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isSpeaking ? "bg-blue-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {isPaused ? "⏸️ Speech Paused" : "🔊 Speaking Answer"}
              </p>
              <p className="text-xs text-amber-600">
                {isPaused
                  ? 'Say "play" to resume'
                  : 'Say "pause" or "stop" to control'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">You said:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={manualSend}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Send className="w-4 h-4" />
              Send Now
            </Button>
          </div>
          <p className="text-sm text-amber-700">"{transcript}"</p>
        </div>
      )}

      {/* Quick Actions & Voice Commands Help */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuestion("What is this document about?")}
            disabled={disabled}
          >
            What is this?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuestion("Summarize the key points")}
            disabled={disabled}
          >
            Summarize
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Voice Commands:</p>
          <div className="grid grid-cols-2 gap-1">
            <span>• "pause" - Pause speech</span>
            <span>• "play" - Resume speech</span>
            <span>• "stop" - Stop speech</span>
            <span>• "summarize" - Get summary</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- MAIN DOCUMENT VIEWER COMPONENT (with TTS logic) ---

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Voice States and Ref
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Constants
  const AI_BACKEND_URL = "http://localhost:8001";

  // --- TTS Functions ---
  const speakText = useCallback(
    (text: string) => {
      if (!synthRef.current || !voiceEnabled) return;

      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (event) => {
        console.error("Speech Synthesis Error:", event.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      synthRef.current.speak(utterance);
    },
    [voiceEnabled]
  );

  const pauseSpeech = useCallback(() => {
    if (
      synthRef.current &&
      synthRef.current.speaking &&
      !synthRef.current.paused
    ) {
      synthRef.current.pause();
      setIsPaused(true);
      console.log("TTS Paused");
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
      console.log("TTS Resumed");
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      console.log("TTS Stopped");
    }
  }, []);

  // --- Voice Command Handler ---
  const handleVoiceCommand = useCallback(
    (command: string) => {
      console.log(`Executing voice command: ${command}`);
      const latestSummary =
        document?.ai_summary || "Document summary is not yet available.";

      switch (command) {
        case "pause":
          pauseSpeech();
          break;
        case "play":
          resumeSpeech();
          break;
        case "stop":
          stopSpeech();
          break;
        case "summarize":
          // Send a question to get a fresh summary instead of reading the static metadata summary
          handleSendMessage("Summarize the key points of this document.");
          break;
        case "what_is_this":
          speakText(
            `This document is titled ${document?.filename}. ${latestSummary}`
          );
          break;
        case "clear":
          setMessages([]);
          speakText("Chat history cleared.");
          break;
        case "help":
          speakText(
            "I can answer questions about the document, or you can use commands like pause, play, or stop."
          );
          break;
        default:
          console.log("Unhandled command:", command);
      }
    },
    [document, pauseSpeech, resumeSpeech, stopSpeech, speakText]
  );

  // --- AI Q&A Function (Updated) ---

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (sending || !text.trim() || !document) return;

      stopSpeech(); // Stop speech before sending new query

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setMessage("");

      setSending(true);

      try {
const response = await fetch(`${AI_BACKEND_URL}/api/v1/qa/ask`, {          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_id: document.id,
            question: text,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const assistantAnswer =
          result.answer || "I received no answer from the AI model.";

        const assistantMessage: Message = {
          role: "assistant",
          content: assistantAnswer,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Speak the response (New TTS Integration)
        if (voiceEnabled) {
          speakText(assistantAnswer);
        }
      } catch (error) {
        const errorMessage = `Failed to get AI response: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMessage },
        ]);
        // Fallback speech for error
        speakText(
          "I'm sorry, an error occurred while processing your request."
        );
      } finally {
        setSending(false);
      }
    },
    [document, sending, stopSpeech, speakText, voiceEnabled]
  );

  // Function for the text input form
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(message);
  };

  // --- Data Fetching and Initialization ---

  // Placeholder function to fetch document data from localStorage
  const fetchDocumentData = useCallback((docId: string) => {
    try {
      const storedDocuments = JSON.parse(
        localStorage.getItem("indexedDocuments") || "[]"
      ) as Document[];
      return storedDocuments.find((doc) => doc.id === docId);
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return null;
    }
  }, []);

  // Document loading and TTS init useEffect
  useEffect(() => {
    // 1. Initialize TTS
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    // 2. Load Document
    if (id) {
      const docData = fetchDocumentData(id);
      if (docData) {
        setDocument(docData);
        setLoading(false);
        // Automatically set initial summary message if available
        if (docData.ai_summary) {
          setMessages([
            {
              role: "assistant",
              content: `Hello! I have analyzed **${docData.filename}**. Here is the AI-generated summary: \n\n${docData.ai_summary}`,
            },
          ]);
          speakText(
            `Hello! I have analyzed ${docData.filename}. Here is the AI-generated summary.`
          );
        } else {
          setMessages([
            {
              role: "assistant",
              content: `Hello! I have indexed **${docData.filename}**. Ask me anything about it!`,
            },
          ]);
          speakText(
            `Hello! I have indexed ${docData.filename}. Ask me anything about it!`
          );
        }
      } else {
        setLoading(false);
        // Navigate to NotFound or Dashboard if document not found locally
        navigate("/404");
      }
    }
  }, [id, navigate, fetchDocumentData, speakText]); // Added speakText to dependencies

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="ml-3 text-lg text-muted-foreground">
          Loading Document...
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24">
        <h1 className="text-2xl font-bold text-destructive">
          Document Not Found
        </h1>
      </div>
    );
  }

  // --- JSX RENDER ---

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document Details & Voice Agent */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
          {/* Document Card */}
          <Card className="p-6">
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold line-clamp-2">
                  {document.filename}
                </h2>
                <p className="text-sm text-muted-foreground">
                  ID: {document.id.substring(0, 8)}...
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <Badge variant="secondary">
                  {document.file_type.split("/").pop()?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Size:</span>
                <span>
                  {(document.file_size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge
                  variant={
                    document.processing_status.includes("PROCESSED")
                      ? "default"
                      : "outline"
                  }
                >
                  {document.processing_status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Voice Agent - Passing new props */}
          <VoiceAgent
            onQuestion={handleSendMessage}
            disabled={sending || !document}
            onVoiceCommand={handleVoiceCommand} // Now handles voice commands
            isSpeaking={isSpeaking} // Reflects TTS state
            isPaused={isPaused} // Reflects TTS state
          />
        </div>

        {/* Right Column: AI Chat/Q&A Interface */}
        <Card className="lg:col-span-2 p-6 flex flex-col h-[70vh] order-1 lg:order-2">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 border-b pb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Document Q&A
          </h2>

          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3/4 p-3 rounded-lg shadow-md ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-tl-none"
                    }`}
                  >
                    <p className="font-semibold mb-1 capitalize">
                      {msg.role === "assistant" ? "AI Assistant" : "You"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder={
                sending
                  ? "AI is typing..."
                  : "Ask a question about the document..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !message.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>

            {/* Toggle TTS Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setVoiceEnabled((prev) => !prev);
                if (voiceEnabled) stopSpeech();
              }}
              title={voiceEnabled ? "Turn off AI Voice" : "Turn on AI Voice"}
            >
              {voiceEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
