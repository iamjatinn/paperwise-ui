// src/hooks/useDocumentSummary.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const useDocumentSummary = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateSummary = useMutation({
    mutationFn: async ({ documentId, summaryType = 'overview' }: { documentId: string; summaryType?: string }) => {
      const response = await fetch(`http://localhost:8000/api/v1/document/${documentId}/generate-summary?summary_type=${summaryType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Summary generated",
        description: `AI summary has been created for the document.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Summary generation failed",
        description: "Could not generate AI summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  return { generateSummary };
};