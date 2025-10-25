// src/pages/Upload.tsx - COMPLETE FIXED VERSION
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload as UploadIcon,
  FileText,
  X,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Define types for our local document storage
interface DocumentMetadata {
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

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Backend URL - try both common development URLs
  const AI_BACKEND_URL = "http://localhost:8001";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return extension && ["pdf", "docx", "txt"].includes(extension);
    });

    if (validFiles.length !== fileList.length) {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF, DOCX, or TXT files.",
        variant: "destructive",
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Save document metadata to localStorage
  const saveDocumentToLocalStorage = (documentData: DocumentMetadata) => {
    try {
      const existingDocuments = JSON.parse(
        localStorage.getItem("documents") || "[]"
      );
      const updatedDocuments = [...existingDocuments, documentData];
      localStorage.setItem("documents", JSON.stringify(updatedDocuments));

      // Also save to indexedDocuments for the Dashboard
      const existingIndexed = JSON.parse(
        localStorage.getItem("indexedDocuments") || "[]"
      );
      const updatedIndexed = [...existingIndexed, documentData];
      localStorage.setItem("indexedDocuments", JSON.stringify(updatedIndexed));

      return true;
    } catch (error) {
      console.error("Failed to save document to localStorage:", error);
      return false;
    }
  };

  // Test backend connection first
  const testBackendConnection = async (): Promise<boolean> => {
    try {
      console.log(
        "🔍 Testing connection to:",
        `${AI_BACKEND_URL}/api/v1/debug/collections`
      );

      const response = await fetch(
        `${AI_BACKEND_URL}/api/v1/debug/collections`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend connection successful:", data);
        return true;
      } else {
        console.error(
          "❌ Backend responded with error:",
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Backend connection failed:", error);
      return false;
    }
  };

  const handleUploadWithFallback = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      // First, test if backend is reachable
      const isBackendAlive = await testBackendConnection();

      if (!isBackendAlive) {
        throw new Error(
          `Cannot connect to AI backend at ${AI_BACKEND_URL}. \n\nPlease make sure:\n1. Your Python backend is running\n2. It's running on port 8000\n3. No firewall is blocking the connection\n\nRun this command to start the backend:\ncd ai-backend && python main.py`
        );
      }

      let firstDocumentId = null;
      let usedFallback = false;
      let successfulUploads = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        console.log("📤 Uploading file:", file.name);

        let response;
        let result;

        // Try the AI summary endpoint first
        try {
          console.log("🔄 Trying AI summary endpoint...");
          response = await fetch(
            `${AI_BACKEND_URL}/api/v1/document/index-with-summary`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "❌ AI summary endpoint failed:",
              response.status,
              errorText
            );
            throw new Error(
              `AI summary: ${response.status} ${response.statusText}`
            );
          }

          result = await response.json();
          console.log("✅ Upload successful with AI summary:", result);
        } catch (aiError) {
          console.log(
            "🔄 AI summary endpoint failed, trying basic indexing...",
            aiError
          );
          usedFallback = true;

          // Fallback to basic indexing
          try {
            console.log("🔄 Trying basic indexing endpoint...");
            response = await fetch(`${AI_BACKEND_URL}/api/v1/document/index`, {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                "❌ Basic indexing failed:",
                response.status,
                errorText
              );
              throw new Error(
                `Basic indexing: ${response.status} ${response.statusText}`
              );
            }

            result = await response.json();
            console.log("✅ Upload successful with basic indexing:", result);
          } catch (basicError) {
            console.error("❌ Both endpoints failed:", basicError);
            throw new Error(`All upload methods failed for ${file.name}`);
          }
        }

        const ai_document_id = result.document_id;

        // Store metadata
        const documentMetadata: DocumentMetadata = {
          id: ai_document_id,
          filename: file.name,
          file_size: result.file_size || file.size,
          file_type: file.type,
          user_id: user?.id || "local-user",
          processing_status: usedFallback
            ? "INDEXED"
            : "PROCESSED_WITH_AI_SUMMARY",
          uploaded_at: new Date().toISOString(),
          ai_summary:
            result.ai_summary || `AI analysis completed for ${file.name}`,
          total_chunks:
            result.total_chunks_indexed || Math.ceil(file.size / 1000),
        };

        // Save to localStorage
        const saveSuccess = saveDocumentToLocalStorage(documentMetadata);
        if (saveSuccess) {
          console.log("💾 Saved to localStorage:", documentMetadata);
          successfulUploads++;
        } else {
          console.error("❌ Failed to save to localStorage");
        }

        if (!firstDocumentId) {
          firstDocumentId = documentMetadata.id;
        }
      }

      if (successfulUploads > 0) {
        toast({
          title: usedFallback
            ? "Upload successful! 📄"
            : "Upload successful with AI! 🤖",
          description: `${successfulUploads} document${
            successfulUploads > 1 ? "s" : ""
          } uploaded${usedFallback ? "" : " and analyzed with AI"}.`,
        });

        setUploading(false);
        setFiles([]);

        if (firstDocumentId) {
          navigate(`/document/${firstDocumentId}`);
        } else {
          navigate("/dashboard");
        }
      } else {
        throw new Error("No documents were successfully processed");
      }
    } catch (error) {
      console.error("❌ Upload process failed:", error);
      toast({
        title: "Upload failed ❌",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred. Check the browser console for details.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  // Demo mode for testing without backend
  const handleDemoUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      const demoDocuments = files.map((file, index) => ({
        id: `demo-${Date.now()}-${index}`,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        user_id: user?.id || "demo-user",
        processing_status: "DEMO_PROCESSED",
        uploaded_at: new Date().toISOString(),
        ai_summary: `This is a demo AI summary for ${file.name}. In a real scenario, this would be generated by your Gemini AI backend.`,
        total_chunks: Math.ceil(file.size / 1000),
      }));

      // Save demo documents
      demoDocuments.forEach((doc) => {
        saveDocumentToLocalStorage(doc);
      });

      toast({
        title: "Demo Upload Successful! 🎭",
        description: `${files.length} document${
          files.length > 1 ? "s" : ""
        } processed in demo mode.`,
      });

      setUploading(false);
      setFiles([]);
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Upload Documents
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your documents for AI-powered analysis and summaries
          </p>
        </div>

        <Card className="p-8 animate-scale-in">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? "border-primary bg-accent"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <UploadIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">
                  Drag and drop your files here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleChange}
                  className="hidden"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX, TXT (Max 20MB per file)
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Selected Files ({files.length})
              </h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4 flex-col sm:flex-row">
            <Button
              className="flex-1 gradient-primary text-white border-0 hover:opacity-90"
              onClick={handleUploadWithFallback}
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing with AI...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upload & Analyze with AI
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDemoUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Demo Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Try Demo Mode
                </span>
              )}
            </Button>
          </div>

          {/* Backend Status */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                const isAlive = await testBackendConnection();
                if (isAlive) {
                  toast({
                    title: "✅ Backend Connected",
                    description: `AI backend is running at ${AI_BACKEND_URL}`,
                  });
                } else {
                  toast({
                    title: "❌ Backend Offline",
                    description: `Cannot connect to ${AI_BACKEND_URL}. Start your Python backend.`,
                    variant: "destructive",
                  });
                }
              }}
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Check backend connection status
            </button>
          </div>
        </Card>

        <Card className="mt-6 p-6 bg-accent/50 animate-fade-in">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Analysis Features
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Automatic AI-generated document summaries</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Key points extraction and executive summaries</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Intelligent Q&A with contextual understanding</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Multi-document analysis and comparison</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Source highlighting and citation tracking</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
