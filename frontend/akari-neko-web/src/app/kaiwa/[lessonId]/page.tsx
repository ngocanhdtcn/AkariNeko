import { KaiwaDetailRoute } from "@/components/kaiwa/KaiwaDetailRoute";

type PageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { lessonId } = await params;

  return <KaiwaDetailRoute lessonId={lessonId} />;
}
