export type KaiwaLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type KaiwaLesson = {
  id: string;
  level: KaiwaLevel;
  lessonNumber: number;
  title: string;
  source: string;
  description: string;
  duration: string;
  category: string;
  thumbnailUrl?: string;
  locked?: boolean;
  videoUrl: string;
  pdfUrl: string;
  audioUrl: string;
  videoUrls: string[];
  pdfUrls: string[];
  audioUrls: string[];
  notes: {
    vocabulary: string[];
    patterns: string[];
    reminders: string[];
  };
};
