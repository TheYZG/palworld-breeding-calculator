// 配种计算主页：组装顶部栏、选择器、我的帕鲁条带、结果区、详情弹窗。

import { useMemo } from "react";
import { usePalsData } from "@/hooks/usePalsData";
import { computeBreedable } from "@/lib/breeding";
import { usePalStore } from "@/store/usePalStore";
import TopBar from "@/components/TopBar";
import PalPicker from "@/components/PalPicker";
import MyPalsStrip from "@/components/MyPalsStrip";
import ResultsGrid from "@/components/ResultsGrid";
import PalDetailModal from "@/components/PalDetailModal";

export default function Home() {
  const { pals, bySlug, breedingByFather, palStats, workTypes, loading, error } =
    usePalsData();
  const myPals = usePalStore((s) => s.myPals);

  const result = useMemo(
    () => computeBreedable(myPals, breedingByFather),
    [myPals, breedingByFather],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        加载配种数据...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="flex h-[42vh] shrink-0 flex-col border-b border-border bg-surface p-3 md:h-auto md:w-80 md:border-b-0 md:border-r">
          <PalPicker pals={pals} />
        </aside>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MyPalsStrip bySlug={bySlug} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ResultsGrid
              result={result}
              bySlug={bySlug}
              palStats={palStats}
              workTypes={workTypes}
              hasMyPals={myPals.size > 0}
            />
          </div>
        </main>
      </div>
      <PalDetailModal
        bySlug={bySlug}
        palStats={palStats}
        workTypes={workTypes}
      />
    </div>
  );
}
