"use client";

import React, { createContext, useContext, useState, useTransition } from "react";

interface SkeletonContextType {
  isAddingCategory: boolean;
  setIsAddingCategory: (val: boolean) => void;
  pendingProductCategoryId: string | null;
  setPendingProductCategoryId: (id: string | null) => void;
  isRefreshing: boolean;
  startRefresh: (callback: () => void) => void;
}

const SkeletonContext = createContext<SkeletonContextType | undefined>(undefined);

export function SkeletonProvider({ children }: { children: React.ReactNode }) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [pendingProductCategoryId, setPendingProductCategoryId] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const startRefresh = (callback: () => void) => {
    startTransition(() => {
      callback();
    });
  };

  return (
    <SkeletonContext.Provider
      value={{
        isAddingCategory,
        setIsAddingCategory,
        pendingProductCategoryId,
        setPendingProductCategoryId,
        isRefreshing,
        startRefresh,
      }}
    >
      {children}
    </SkeletonContext.Provider>
  );
}

export function useSkeleton() {
  const context = useContext(SkeletonContext);
  if (context === undefined) {
    throw new Error("useSkeleton must be used within a SkeletonProvider");
  }
  return context;
}
