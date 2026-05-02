import type { LucideIcon } from "lucide-react";

export type DashboardMenuItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  active: boolean;
  iconClassName?: string;
  activeIconClassName?: string;
  activeItemClassName?: string;
};

export type MobileNavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  active: boolean;
};

export type StudyShortcutCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName: string;
  cardClassName: string;
};

export type RecentVocabulary = {
  kanji: string;
  hiragana: string;
  meaning: string;
  level: string;
  correctCount: number;
  wrongCount: number;
  difficulty: number;
};

export type StudyStatistic = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  chartClassName: string;
};

export type MobileStatistic = {
  label: string;
  value: string;
  trend: string;
};
