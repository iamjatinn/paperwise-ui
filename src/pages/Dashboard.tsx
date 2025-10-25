// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw,
  Upload,
  BarChart3,
  Zap,
  Users,
  ArrowUpRight,
  FolderOpen,
  Clock,
  FileCheck,
} from "lucide-react";
import { useDocumentSummary } from "@/hooks/useDocumentSummary";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 300,
    },
  },
};

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
      const storedDocuments = JSON.parse(
        localStorage.getItem("indexedDocuments") || "[]"
      );
      setDocuments(storedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
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
    generateSummary.mutate({ documentId, summaryType: "overview" });
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== documentId);
    setDocuments(updatedDocuments);
    localStorage.setItem("indexedDocuments", JSON.stringify(updatedDocuments));

    toast({
      title: "Document deleted",
      description: "Document has been removed from your dashboard.",
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
        >
          <div className="mb-6 lg:mb-0">
            <motion.h1
              className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Paperwise Dashboard
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Manage and analyze your documents with AI-powered insights
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              asChild
              className="gradient-primary text-white border-0 hover:opacity-90 px-6 py-3 h-auto group relative overflow-hidden"
            >
              <Link to="/upload">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">Upload New</span>
                </motion.div>
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Documents
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {documents.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-green-500/30 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    With AI Summary
                  </p>
                  <p className="text-3xl font-bold text-green-500">
                    {documents.filter((d) => d.ai_summary).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-blue-500/30 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Size
                  </p>
                  <p className="text-3xl font-bold text-blue-500">
                    {formatFileSize(
                      documents.reduce((acc, doc) => acc + doc.file_size, 0)
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-orange-500/30 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Latest Upload
                  </p>
                  <p className="text-lg font-bold text-orange-500">
                    {documents.length > 0
                      ? formatDate(documents[0].upload_date)
                      : "No files"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search documents by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Zap className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Users className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover="hover"
                  layout
                >
                  <motion.div
                    variants={cardHoverVariants}
                    className="relative group"
                  >
                    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg glow-effect">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateSummary(doc.id)}
                            disabled={generateSummary.isPending}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            {generateSummary.isPending ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {doc.filename}
                        </h3>

                        {/* AI Summary */}
                        <div className="mb-4">
                          {doc.ai_summary ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-medium">AI Summary</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                                {doc.ai_summary}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                              <Sparkles className="w-4 h-4" />
                              <span>
                                Click the sparkle to generate AI summary
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                          <span className="px-2 py-1 bg-accent rounded-full font-medium">
                            {doc.file_type.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                            {formatDate(doc.upload_date)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 group/btn"
                        >
                          <Link to={`/document/${doc.id}`}>
                            <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            View Details
                            <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </Link>
                        </Button>
                      </div>
                    </Card>

                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? "No documents match your search. Try different keywords."
                : "Get started by uploading your first document to analyze with AI."}
            </p>
            <Button asChild size="lg" className="gradient-primary text-white">
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your First Document
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
