"use client";

import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

interface MabiniButtonProps {
  pageContext: string;
}

export function MabiniButton({ pageContext }: MabiniButtonProps) {
  return null;
  /*
  const router = useRouter();

  const handleClick = () => {
    const encoded = encodeURIComponent(pageContext);
    router.push(`/dashboard/ai?context=${encoded}`);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Ask Mabini AI"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 text-sm font-medium text-white shadow-lg hover:from-orange-500 hover:to-orange-400 transition-all duration-200 hover:scale-105"
    >
      <Bot className="h-4 w-4 shrink-0" />
      <span>Mabini</span>
    </button>
  );
  */
}
