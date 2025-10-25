import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Upload, MessageSquare, FileSearch, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: "Multi-Format Support",
      description: "Upload DOCX, PDF, and TXT files with ease. Drag and drop or click to select."
    },
    {
      icon: FileSearch,
      title: "Smart Summarization",
      description: "AI-powered section-wise breakdowns that capture key information and context."
    },
    {
      icon: MessageSquare,
      title: "Contextual Q&A",
      description: "Ask questions and get precise answers with highlighted references in the document."
    },
    {
      icon: Zap,
      title: "RAG Technology",
      description: "Retrieval-Augmented Generation ensures accurate, contextually relevant responses."
    },
    {
      icon: Shield,
      title: "Secure Processing",
      description: "Your documents are processed securely with enterprise-grade encryption."
    },
    {
      icon: Globe,
      title: "Multi-Document Analysis",
      description: "Compare and analyze multiple documents simultaneously for deeper insights."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {/* Hero Section with Large Paperwise Title */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10 blur-3xl"></div>
        <div className="container mx-auto text-center relative z-10">
          {/* Large Paperwise Title */}
          <div className="mb-16 animate-fade-in">
            <h1 className="text-8xl md:text-9xl font-bold mb-8 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
              PAPERWISE
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto font-light">
              Intelligent Document Processing & Analysis
            </p>
          </div>

          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Document Intelligence
              <br />
              Powered by AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform lengthy documents into actionable insights. Upload,
              summarize, and interact with your documents using advanced AI
              technology.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-white border-0 hover:opacity-90 glow-effect"
              >
                <Link to="/auth">Start Analyzing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-accent/20">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to understand and interact with your documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in border-border/50 bg-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Simple, powerful, and intelligent
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 glow-effect">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Document</h3>
              <p className="text-muted-foreground">
                Upload your DOCX, PDF, or TXT file to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 glow-effect">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI analyzes and creates section-wise summaries
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 glow-effect">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
              <p className="text-muted-foreground">
                Interact with your document through natural conversation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Transform the way you work with documents. Start analyzing and
            understanding your documents in seconds.
          </p>
          <Button
            asChild
            size="lg"
            className="gradient-primary text-white border-0 hover:opacity-90 glow-effect"
          >
            <Link to="/upload">Upload Your First Document</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
