import { getAllSettings } from "@/db/settings";
import { MainClient } from "./main-client";

export default async function Home() {
  const settings = await getAllSettings();

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Bloom</h1>

        <MainClient settings={settings} />
      </div>
    </div>
  );
}
