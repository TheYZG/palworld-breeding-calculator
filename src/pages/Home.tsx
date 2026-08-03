// 配种计算主页：组装顶部栏、选择器、我的帕鲁条带、结果区、详情弹窗、配种链查找器。

import { useEffect, useMemo, useState } from "react";
import { usePalsData } from "@/hooks/usePalsData";
import { computeBreedableClosure } from "@/lib/breeding";
import { usePalStore } from "@/store/usePalStore";
import { decodeMyPalsFromHash, clearShareHash, encodeMyPalsToHash } from "@/lib/share";
import TopBar from "@/components/TopBar";
import PalPicker from "@/components/PalPicker";
import MyPalsStrip from "@/components/MyPalsStrip";
import ResultsGrid from "@/components/ResultsGrid";
import PalDetailModal from "@/components/PalDetailModal";
import BreedingPathFinder from "@/components/BreedingPathFinder";

export default function Home() {
  const {
    pals,
    bySlug,
    breedingByFather,
    palStats,
    workTypes,
    palDetails,
    loading,
    error,
  } = usePalsData();
  const myPals = usePalStore((s) => s.myPals);
  const togglePal = usePalStore((s) => s.togglePal);
  const clearMyPals = usePalStore((s) => s.clearMyPals);

  // 从 URL hash 加载分享的 myPals（仅首次加载、数据就绪后执行一次）
  const [shareLoaded, setShareLoaded] = useState(false);
  useEffect(() => {
    if (loading || shareLoaded) return;
    const shared = decodeMyPalsFromHash();
    if (shared !== null) {
      // 先清空再逐个添加，确保与分享数据一致
      if (myPals.size > 0) clearMyPals();
      for (const slug of shared) {
        if (bySlug.has(slug)) togglePal(slug);
      }
      clearShareHash();
    }
    setShareLoaded(true);
  }, [loading, shareLoaded, bySlug, myPals, clearMyPals, togglePal]);

  // myPals 变化时同步到 URL hash（方便分享当前选择）
  useEffect(() => {
    if (!shareLoaded) return;
    const hash = encodeMyPalsToHash(Array.from(myPals));
    const current = window.location.hash;
    if (hash) {
      if (current !== hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search + hash);
      }
    } else if (current.startsWith("#pals=")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [myPals, shareLoaded]);

  const result = useMemo(
    () => computeBreedableClosure(myPals, breedingByFather),
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
          <MyPalsStrip bySlug={bySlug} palDetails={palDetails} palStats={palStats} workTypes={workTypes} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <BreedingPathFinder
              myPals={myPals}
              bySlug={bySlug}
              breedingByFather={breedingByFather}
              palDetails={palDetails}
              palStats={palStats}
              workTypes={workTypes}
            />
            <ResultsGrid
              result={result}
              bySlug={bySlug}
              palStats={palStats}
              workTypes={workTypes}
              palDetails={palDetails}
              hasMyPals={myPals.size > 0}
              breedingByFather={breedingByFather}
            />
          </div>
        </main>
      </div>
      <PalDetailModal
        bySlug={bySlug}
        palStats={palStats}
        workTypes={workTypes}
        palDetails={palDetails}
      />
    </div>
  );
}
