import { dashboardMenuItems } from "@/data/dashboardData";

export function getCurrentPageTitle(pathname: string) {
  const matchedItem = dashboardMenuItems.find((item) => {
    if (item.href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(item.href);
  });

  return matchedItem?.label ?? "Home";
}

export function getCurrentSearchPlaceholder(pathname: string) {
  if (pathname.startsWith("/vocabulary")) {
    return "Tìm kiếm Kanji, Hiragana hoặc nghĩa tiếng Việt...";
  }

  if (pathname.startsWith("/grammar")) {
    return "Tìm kiếm mẫu ngữ pháp, cách dùng hoặc ví dụ...";
  }

  if (pathname.startsWith("/kaiwa")) {
    return "Tìm kiếm bài hội thoại, video hoặc PDF Kaiwa...";
  }

  if (pathname.startsWith("/flashcard")) {
    return "Tìm kiếm flashcard hoặc bộ ôn tập...";
  }

  if (pathname.startsWith("/quiz")) {
    return "Tìm kiếm bài quiz hoặc câu hỏi luyện tập...";
  }

  if (pathname.startsWith("/mock-test")) {
    return "Tìm kiếm đề thi thử hoặc JLPT level...";
  }

  if (pathname.startsWith("/exam-bank")) {
    return "Tìm kiếm đề thi, PDF hoặc ngân hàng câu hỏi...";
  }

  if (pathname.startsWith("/statistics")) {
    return "Tìm kiếm thống kê học tập...";
  }

  if (pathname.startsWith("/settings")) {
    return "Tìm kiếm cài đặt...";
  }

  if (pathname.startsWith("/profile")) {
    return "Tìm kiếm thông tin hồ sơ...";
  }

  return "Tìm kiếm bài học, từ vựng, ngữ pháp...";
}
