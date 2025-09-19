import { notFound } from "next/navigation";
import { getSettings } from "@/db/settings";
import { EditForm } from "./edit-form";
import Link from "next/link";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettings(id);

  console.log(`EditPage: Loaded settings for id ${id}:`, settings);

  if (!settings) {
    notFound();
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Edit Settings: {settings.name}
        </h1>
        <EditForm settings={settings} />
        <Link
          href={`/play/${settings.id}`}
          className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Play
        </Link>
      </div>
    </div>
  );
}
