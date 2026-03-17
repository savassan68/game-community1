"use client";

import { NewsCategory } from "@/lib/gamemeca";

type Props = {
  activeCategory: NewsCategory;
  onChange: (category: NewsCategory) => void;
};

const categories: { label: string; value: NewsCategory }[] = [
  { label: "메인", value: "main" },
  { label: "산업", value: "industry" },
  { label: "eSports", value: "esports" },
  { label: "PC", value: "pc" },
  { label: "모바일", value: "mobile" },
  { label: "콘솔", value: "console" },
];

export default function CategoryTabs({ activeCategory, onChange }: Props) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = activeCategory === category.value;

        return (
          <button
            key={category.value}
            onClick={() => onChange(category.value)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            ].join(" ")}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}