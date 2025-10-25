// Update your Dashboard.tsx to use the new document structure
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { FileText, Search, Trash2, Eye, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { useDocumentSummary } from "@/hooks/useDocumentSummary";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  total_chunks: number;
  ai_summary?: string;
  processing_status: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { generateSummary } = useDocumentSummary();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    try {
      const storedDocuments = JSON.parse(localStorage.getItem('indexedDocuments') || '[]');
      setDocuments(storedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = (documentId: string) => {
    generateSummary.mutate({ documentId, summaryType: 'overview' });
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    localStorage.setItem('indexedDocuments', JSON.stringify(updatedDocuments));
    
    toast({
      title: "Document deleted",
      description: "Document has been removed from your dashboard.",
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold mb-2">Document Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and access your AI-analyzed documents
            </p>
          </div>
          <Button asChild className="gradient-primary text-white border-0 hover:opacity-90">
            <Link to="/upload">Upload New</Link>
          </Button>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6 animate-scale-in">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc, index) => (
              <Card
                key={doc.id}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGenerateSummary(doc.id)}
                      disabled={generateSummary.isPending}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-2 line-clamp-1">{doc.filename}</h3>
                
                {/* AI Summary */}
                <div className="mb-4">
                  {doc.ai_summary ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {doc.ai_summary}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
                      <span>No AI summary yet</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className="px-2 py-1 bg-accent rounded">{doc.file_type}</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/document/${doc.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  {!doc.ai_summary && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateSummary(doc.id)}
                      disabled={generateSummary.isPending}
                    >
                      {generateSummary.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-3xl font-bold">{documents.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">With AI Summary</p>
            <p className="text-3xl font-bold">
              {documents.filter(d => d.ai_summary).length}
            </p>
          </Card>
          {/* <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Chunks</p>
            <p className="text-3xl font-bold">
              {documents.reduce((acc, doc) => acc + doc.total_chunks, 0)}
            </p>
          </Card> */}
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Size</p>
            <p className="text-3xl font-bold">
              {formatFileSize(documents.reduce((acc, doc) => acc + doc.file_size, 0))}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}