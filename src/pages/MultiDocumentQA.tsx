import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2, FileText, MessageSquare, Sparkles, Volume2, VolumeX } from 'lucide-react';
import VoiceInterface from '@/components/VoiceInterface';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  filename: string;
  uploadDate: string;
  totalChunks: number;
  ai_summary?: string;
}

interface QAResponse {
  answer: string;
  document_ids: string[];
  sources_used: Array<{
    document_id: string;
    content_preview: string;
    similarity: number;
    source_info: string;
  }>;
}

const MultiDocumentQA: React.FC = () => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{question: string, answer: string}>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  // Function to clean answer text by removing UUIDs and source references
  const cleanAnswerText = (text: string): string => {
    // Remove UUIDs in parentheses like (7124502b-08ae-4227-bfaa-e988ac3b3e46)
    let cleaned = text.replace(/\([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)/g, '');
    
    // Remove "Source X" references in parentheses
    cleaned = cleaned.replace(/\(Source\s+\d+\)/g, '');
    
    // Clean up any extra spaces or punctuation left behind
    cleaned = cleaned.replace(/\s+\./g, '.').replace(/\s+,/g, ',').trim();
    cleaned = cleaned.replace(/\s\s+/g, ' '); // Replace multiple spaces with single space
    
    return cleaned;
  };

  // Fetch indexed documents from localStorage
  const { data: documents = [] } = useQuery({
    queryKey: ['indexed-documents'],
    queryFn: () => {
      const stored = localStorage.getItem('indexedDocuments');
      return stored ? JSON.parse(stored) : [];
    }
  });

  // Multi-document QA mutation
  const qaMutation = useMutation({
    mutationFn: async (data: { document_ids: string[]; question: string }) => {
      const response = await fetch('http://localhost:8000/api/v1/qa/ask-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to get answer');
      return response.json();
    },
    onSuccess: (data: QAResponse, variables) => {
      // Clean the answer text before storing it
      const cleanedAnswer = cleanAnswerText(data.answer);
      
      setConversation(prev => [...prev, {
        question: variables.question,
        answer: cleanedAnswer
      }]);
      setQuestion('');
      
      // Speak answer only if not muted
      if (!isMuted) {
        speakAnswer(cleanedAnswer);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to get answer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAskQuestion = () => {
    if (!question.trim() || selectedDocs.length === 0) return;
    
    qaMutation.mutate({
      document_ids: selectedDocs,
      question: question.trim()
    });
  };

  const handleVoiceQuestion = (voiceQuestion: string) => {
    setQuestion(voiceQuestion);
    // Auto-send after a short delay if documents are selected
    if (selectedDocs.length > 0) {
      setTimeout(() => {
        handleAskQuestion();
      }, 500);
    }
  };

  const handleVoiceCommand = (command: string) => {
    switch (command) {
      case 'compare':
        setQuestion("Compare and contrast the selected documents");
        if (selectedDocs.length > 0) {
          setTimeout(() => {
            handleAskQuestion();
          }, 500);
        }
        break;
      case 'summarize':
        setQuestion("Provide a comprehensive summary across all selected documents");
        if (selectedDocs.length > 0) {
          setTimeout(() => {
            handleAskQuestion();
          }, 500);
        }
        break;
      case 'clear':
        setQuestion('');
        setConversation([]);
        toast({
          title: "🗑️ Conversation Cleared",
          description: "Ready for new questions!",
        });
        break;
      case 'help':
        toast({
          title: "🎤 Voice Commands Help",
          description: "Try: 'compare', 'summarize', 'clear', or ask any question",
        });
        break;
    }
  };

  const speakAnswer = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        toast({
          title: "🔊 Speaking Answer",
          description: "Playing audio response...",
        });
      };
      
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      // Stop any current speech when muting
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      toast({
        title: "🔇 Sound Muted",
        description: "Audio responses are now disabled",
      });
    } else {
      toast({
        title: "🔊 Sound Unmuted",
        description: "Audio responses are now enabled",
      });
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Multi-Document Q&A</h1>
        </div>
        
        {/* Mute/Unmute Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMute}
          className="flex items-center gap-2"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4" />
              Unmute Responses
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              Mute Responses
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Documents</CardTitle>
            <CardDescription>
              Choose documents to query across ({selectedDocs.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice Interface in document selection */}
            <VoiceInterface 
              onQuestion={handleVoiceQuestion}
              onCommand={handleVoiceCommand}
              compact
            />
            
            {documents.length === 0 ? (
              <p className="text-muted-foreground">No documents indexed yet.</p>
            ) : (
              documents.map((doc: Document) => (
                <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDocument(doc.id)}
                  />
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.totalChunks} chunks • {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Q&A Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ask Questions Across Documents</CardTitle>
            <CardDescription>
              Ask questions that will be answered using information from all selected documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Input */}
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question across all selected documents..."
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={qaMutation.isPending || selectedDocs.length === 0}
              />
              
              {/* Voice interface next to input */}
              <VoiceInterface 
                onQuestion={handleVoiceQuestion}
                onCommand={handleVoiceCommand}
                compact
                disabled={selectedDocs.length === 0}
              />
              
              <Button 
                onClick={handleAskQuestion}
                disabled={qaMutation.isPending || !question.trim() || selectedDocs.length === 0}
              >
                {qaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
              </Button>
            </div>

            {/* Conversation */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {conversation.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">Q: {item.question}</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg border">
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap flex-1">A: {item.answer}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                        onClick={() => speakText(item.answer)}
                        disabled={isMuted}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {qaMutation.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p>Searching across documents...</p>
                </div>
              )}
            </div>

            {/* Sources (when available) */}
            {qaMutation.data?.sources_used && qaMutation.data.sources_used.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Sources Used:</h4>
                <div className="space-y-2">
                  {qaMutation.data.sources_used.map((source, index) => (
                    <div key={index} className="text-xs p-2 border rounded bg-muted/50">
                      <p className="font-medium">Source {index + 1}</p>
                      <p className="text-muted-foreground mt-1">{source.content_preview}</p>
                      <p className="text-muted-foreground mt-1">Similarity: {(source.similarity * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultiDocumentQA;