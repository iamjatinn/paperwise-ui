import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus, X, ArrowRight } from "lucide-react";
import { useState } from "react";

interface ComparisonDoc {
  id: string;
  name: string;
  summary: string;
  keyPoints: string[];
}

export default function Comparison() {
  const [selectedDocs, setSelectedDocs] = useState<ComparisonDoc[]>([
    {
      id: "1",
      name: "Contract Version 1.pdf",
      summary: "Initial contract proposal with standard terms and 24-month duration.",
      keyPoints: [
        "Duration: 24 months",
        "Value: $500,000",
        "Payment: Quarterly",
        "Termination: 60 days notice",
      ],
    },
    {
      id: "2",
      name: "Contract Version 2.pdf",
      summary: "Revised contract with extended duration and modified payment structure.",
      keyPoints: [
        "Duration: 36 months",
        "Value: $650,000",
        "Payment: Monthly",
        "Termination: 90 days notice",
      ],
    },
  ]);

  const differences = [
    {
      category: "Duration",
      doc1: "24 months",
      doc2: "36 months",
      significant: true,
    },
    {
      category: "Contract Value",
      doc1: "$500,000",
      doc2: "$650,000",
      significant: true,
    },
    {
      category: "Payment Schedule",
      doc1: "Quarterly",
      doc2: "Monthly",
      significant: true,
    },
    {
      category: "Termination Notice",
      doc1: "60 days",
      doc2: "90 days",
      significant: false,
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold mb-2">Document Comparison</h1>
            <p className="text-muted-foreground">
              Compare multiple documents side-by-side
            </p>
          </div>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Selected Documents */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {selectedDocs.map((doc) => (
            <Card key={doc.id} className="p-6 animate-scale-in">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{doc.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      Selected
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{doc.summary}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Key Points:</p>
                {doc.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Analysis */}
        <Card className="p-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Comparison Analysis</h2>
          
          <div className="space-y-4">
            {differences.map((diff, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  diff.significant
                    ? "bg-accent border-primary/30"
                    : "bg-background border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{diff.category}</h3>
                  {diff.significant && (
                    <Badge variant="destructive" className="text-xs">
                      Significant Change
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center p-3 bg-background rounded border">
                    <p className="text-xs text-muted-foreground mb-1">Document 1</p>
                    <p className="font-medium">{diff.doc1}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="text-center p-3 bg-background rounded border">
                    <p className="text-xs text-muted-foreground mb-1">Document 2</p>
                    <p className="font-medium">{diff.doc2}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Summary Card */}
        <Card className="mt-6 p-6 bg-accent/50 animate-fade-in">
          <h3 className="font-semibold mb-3">Comparison Summary</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Found 4 key differences between documents</li>
            <li>• 3 significant changes requiring review</li>
            <li>• Contract value increased by $150,000 (30%)</li>
            <li>• Duration extended by 12 months (50%)</li>
            <li>• Payment frequency changed from quarterly to monthly</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
