import type { Metadata } from "next";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "About & Credits" };

export default function AboutPage() {
  return (
    <div>
      <PageHead kicker="Project" title="About Tideforge">A fan-made Wuthering Waves companion built around trustworthy data and transparent math.</PageHead>
      <div className="prose-wuwa max-w-3xl">
        <h2>Principles</h2>
        <ul><li>Read, calculate and plan with no account. Your roster is stored on your device.</li><li>Every number shows where it came from. Placeholders are labelled, never hidden.</li><li>Opinion (tier list) is labelled as opinion and has a public changelog.</li></ul>
        <h2>Credits</h2>
        <p>Game data currently comes from the Wuthering Waves community wiki (Fandom). Banner and event dates were collected from public announcements. We plan to move to datamined sources.</p>
        <h2>Disclaimer</h2>
        <p>Tideforge is an unofficial fan project and is not affiliated with or endorsed by Kuro Games. Wuthering Waves, its characters, names and artwork are © Kuro Games. If you represent Kuro Games and want something changed or removed, please open an issue in the project repository.</p>
        <h2>Privacy</h2>
        <p>No account, no tracking cookies. Shared builds and error reports you choose to send are stored on our server. Your roster and settings stay in your browser&apos;s local storage.</p>
      </div>
    </div>
  );
}
