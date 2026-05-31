import { notFound } from "next/navigation";
import { KaiwaDetailPage } from "@/components/kaiwa/KaiwaDetailPage";
import { getKaiwaLessonById } from "@/services/kaiwaService";

type PageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getKaiwaLessonById(lessonId).catch(() => null);

  if (!lesson) {
    notFound();
  }

  return <KaiwaDetailPage lesson={lesson} />;
}
