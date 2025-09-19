import { getSettings } from "@/db/settings";
import { notFound } from "next/navigation";
import { VoiceInteraction } from "./voice-interaction";
import Link from "next/link";

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { id } = await params;
  const setting = await getSettings(id);

  if (!setting) {
    notFound();
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <VoiceInteraction settings={setting} />

        <Link
          href={`/edit/${setting.id}`}
          className="w-full block text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Edit!
        </Link>
      </div>
    </div>
  );
}
