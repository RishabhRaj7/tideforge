import type { Metadata } from "next";
import CalculatorClient from "@/components/CalculatorClient";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Build Simulator" };

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<{ c?: string; w?: string; b?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <PageHead kicker="Tool" title="Build & Damage Simulator">
        Pick a Resonator, equip a weapon and five Echoes with real main stats and substat rolls, define a rotation, and see the damage change as you swap gear.
      </PageHead>
      <CalculatorClient initialChar={sp.c} initialWeapon={sp.w} code={sp.b} />
    </div>
  );
}
