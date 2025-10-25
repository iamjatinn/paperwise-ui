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
  MicOff
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useDocumentSummary } from "@/hooks/useDocumentSummary";

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

// Standalone Voice Agent Component - Completely isolated
const VoiceAgent = ({ 
  onQuestion, 
  disabled, 
  id,
  onVoiceCommand,
  isSpeaking,
  isPaused
}: { 
  onQuestion: (question: string) => void; 
  disabled: boolean;
  id: string;
  onVoiceCommand: (command: string) => void;
  isSpeaking: boolean;
  isPaused: boolean;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Voice commands mapping
  const voiceCommands = {
    'pause': 'pause',
    'play': 'play', 
    'resume': 'play',
    'stop': 'stop',
    'halt': 'stop',
    'end': 'stop',
    'summarize': 'summarize',
    'summary': 'summarize',
    'explain': 'explain',
    'what is this': 'what_is_this',
    'what is this about': 'what_is_this',
    'tell me about this': 'what_is_this',
    'clear': 'clear',
    'help': 'help'
  };

  // Check if text contains a voice command
  const processVoiceCommand = (text: string): boolean => {
    const cleanText = text.toLowerCase().trim();
    
    // Check for exact matches first
    for (const [phrase, command] of Object.entries(voiceCommands)) {
      if (cleanText === phrase) {
        console.log(`🎯 Voice command detected: ${command}`);
        onVoiceCommand(command);
        return true;
      }
    }

    // Check for partial matches
    for (const [phrase, command] of Object.entries(voiceCommands)) {
      if (cleanText.includes(phrase)) {
        console.log(`🎯 Voice command detected (partial): ${command}`);
        onVoiceCommand(command);
        return true;
      }
    }

    return false;
  };

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

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

      // Check for voice commands in final results
      if (finalTranscript.trim() && finalTranscript.trim().length > 1) {
        const isCommand = processVoiceCommand(finalTranscript.trim());
        
        if (isCommand) {
          // It was a command, don't send as question
          setTranscript('');
          console.log('✅ Processed as voice command');
        } else {
          // It's a regular question, send it
          console.log('🚀 Auto-sending question:', finalTranscript.trim());
          onQuestion(finalTranscript.trim());
          setTranscript('');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
      // Auto-restart after a short delay
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Recognition already started');
          }
        }
      }, 1000);
    };

    return recognition;
  }, [onQuestion, toast, onVoiceCommand]);

  const startListening = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        toast({
          title: "🎤 Voice Agent Started",
          description: "I'm listening. Say 'pause', 'play', 'stop', or ask questions.",
        });
      }
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  }, [initializeRecognition, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setTranscript('');
    toast({
      title: "🎤 Voice Agent Stopped",
      description: "Voice input has been disabled.",
    });
  }, [toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const manualSend = useCallback(() => {
    if (transcript.trim().length > 0) {
      const isCommand = processVoiceCommand(transcript);
      if (!isCommand) {
        onQuestion(transcript);
      }
      setTranscript('');
    }
  }, [transcript, onQuestion]);

  // Auto-start on component mount
  useEffect(() => {
    console.log('🎤 Voice Agent mounting');
    startListening();
    
    return () => {
      console.log('🎤 Voice Agent unmounting');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startListening]);

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
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <div>
              <p className="text-sm font-medium">
                {isListening ? '🎤 Voice Input Active' : '❌ Voice Input Inactive'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isListening ? 'Say "pause", "play", "stop", or ask questions' : 'Click Start to activate voice input'}
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
            {isListening ? 'Stop' : 'Start Voice'}
          </Button>
        </div>
      </div>

      {/* Speech Status */}
      {(isSpeaking || isPaused) && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {isPaused ? '⏸️ Speech Paused' : '🔊 Speaking Answer'}
              </p>
              <p className="text-xs text-amber-600">
                {isPaused ? 'Say "play" to resume' : 'Say "pause" or "stop" to control'}
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

// Main Document Viewer Component
export default function DocumentViewer() {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  const { generateSummary } = useDocumentSummary();

  useEffect(() => {
    if (id) {
      fetchDocument();
      setMessages([{
        role: "assistant",
        content: "Hello! I've analyzed your document. Ask me anything about it!",
      }]);
    }

    return () => {
      stopSpeech();
    };
  }, [id]);

  const fetchDocument = async () => {
    try {
      let storedDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
      let foundDocument = storedDocuments.find((doc: Document) => doc.id === id);
      
      if (!foundDocument) {
        storedDocuments = JSON.parse(localStorage.getItem('indexedDocuments') || '[]');
        foundDocument = storedDocuments.find((doc: Document) => doc.id === id);
      }
      
      if (!foundDocument) {
        throw new Error("Document not found");
      }
      
      setDocument(foundDocument);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: "Error loading document",
        description: "Failed to load document data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (questionToSend?: string) => {
    const finalQuestion = questionToSend || message.trim();
    if (!finalQuestion || sending || !id) return;
  
    const userMessage: Message = {
      role: "user",
      content: finalQuestion,
    };
  
    setMessages(prev => [...prev, userMessage]);
    if (!questionToSend) setMessage("");
    setSending(true);
  
    try {
      console.log('📤 Sending question to backend:', finalQuestion);
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/qa/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: id,
          question: finalQuestion
        })
      });
  
      if (!response.ok) {
        throw new Error(`Failed to get answer: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('✅ Received answer:', data.answer);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
  
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak the answer
      speakAnswer(data.answer);
      
      // Save conversation
      const conversation = {
        document_id: id,
        question: finalQuestion,
        answer: data.answer,
        timestamp: new Date().toISOString()
      };
      
      const existingConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      localStorage.setItem('conversations', JSON.stringify([...existingConversations, conversation]));
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Failed to get answer",
        description: "Could not process your question. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I couldn't process your question. Please make sure the AI backend is running.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceQuestion = useCallback((question: string) => {
    console.log('🎤 Voice question received:', question);
    handleSendMessage(question);
  }, [id]);

  const handleVoiceCommand = useCallback((command: string) => {
    console.log(`🎯 Executing voice command: ${command}`);
    
    switch (command) {
      case 'pause':
        pauseSpeech();
        toast({
          title: "⏸️ Speech Paused",
          description: "Say 'play' to resume",
        });
        break;
      case 'play':
        resumeSpeech();
        toast({
          title: "▶️ Speech Resumed",
          description: "Say 'pause' or 'stop' to control",
        });
        break;
      case 'stop':
        stopSpeech();
        toast({
          title: "⏹️ Speech Stopped",
          description: "Speech has been stopped",
        });
        break;
      case 'summarize':
        handleSendMessage("Please provide a comprehensive summary of this document");
        break;
      case 'explain':
        handleSendMessage("Explain the main concepts and findings in simple terms");
        break;
      case 'what_is_this':
        handleSendMessage("What is this document about?");
        break;
      case 'clear':
        setMessage('');
        setMessages([{
          role: "assistant",
          content: "Conversation cleared. How can I help you with this document?",
        }]);
        toast({
          title: "🗑️ Conversation Cleared",
          description: "Ready for new questions!",
        });
        break;
      case 'help':
        toast({
          title: "🎤 Voice Commands Help",
          description: "Try: 'pause', 'play', 'stop', 'summarize', 'explain', 'what is this', 'clear'",
        });
        break;
    }
  }, [toast]);

  const speakAnswer = (text: string) => {
    if ('speechSynthesis' in window) {
      stopSpeech();
      
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s?/g, '')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\n/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        currentSpeechRef.current = utterance;
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentSpeechRef.current = null;
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentSpeechRef.current = null;
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentSpeechRef.current = null;
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const resumeSpeech = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      stopSpeech();
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s?/g, '')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\n/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        currentSpeechRef.current = utterance;
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentSpeechRef.current = null;
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Global Audio Controls */}
      {(isSpeaking || isPaused) && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <div className="flex gap-1">
            {isSpeaking && !isPaused && (
              <>
                <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </>
            )}
            {isPaused && <div className="w-2 h-4 bg-white rounded"></div>}
          </div>
          <span className="text-sm">{isPaused ? 'Paused' : 'Speaking...'}</span>
          <div className="flex gap-1">
            {isPaused ? (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={resumeSpeech}>
                <Play className="w-3 h-3" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={pauseSpeech}>
                <Pause className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={stopSpeech}>
              <VolumeX className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="h-[calc(100vh-5rem)] flex">
        {/* Document Info Panel */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-6 border-b bg-accent/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{document.filename}</h1>
                  <p className="text-sm text-muted-foreground">
                    {(document.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(document.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Analysis
            </Badge>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Voice Agent - Completely isolated */}
              {id && (
                <VoiceAgent 
                  onQuestion={handleVoiceQuestion} 
                  disabled={sending} 
                  id={id}
                  onVoiceCommand={handleVoiceCommand}
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                />
              )}

              {/* Document Status */}
              <Card className="p-4 bg-accent/50 border-primary/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Document Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  This document has been successfully processed and indexed. 
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Processing Details:</p>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span className="text-muted-foreground">Status: {document.processing_status}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <span className="text-muted-foreground">Document ID: {document.id}</span>
                  </div>
                  {document.total_chunks && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                      <span className="text-muted-foreground">Chunks: {document.total_chunks}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b bg-accent/20">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Contextual Q&A
            </h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about the document and get instant answers
            </p>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap flex-1">{msg.content}</p>
                      {msg.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/20"
                          onClick={() => speakText(msg.content)}
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about this document..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={sending}
              />
              <Button 
                onClick={() => handleSendMessage()}
                disabled={sending || !message.trim()}
                className="gradient-primary text-white border-0 hover:opacity-90"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}