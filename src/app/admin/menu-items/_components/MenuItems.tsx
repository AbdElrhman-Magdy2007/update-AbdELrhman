"use client";

import { Pages, Routes } from "@/constants/enums";
import { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { reorderProducts } from "../_actions/product";

// Interface for Props with explicit definition
interface MenuItemsProps {
  products: Product[];
}

export default function MenuItems({ products }: MenuItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<Product[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // Initialize local items sorted by current order then name as tiebreaker
    const sorted = [...(products || [])].sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    setItems(sorted);
  }, [products]);

  // Log in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`MenuItems received ${products?.length || 0} products:`, products);
  }

  // Validate data
  if (!products || !Array.isArray(products)) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <p className="text-lg font-medium text-red-600">Error: Invalid products data</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <p className="text-lg font-medium text-gray-500">No products found</p>
      </div>
    );
  }

  const onDragStart = (index: number) => (e: React.DragEvent<HTMLLIElement>) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (overIndex: number) => async (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const from = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(from)) return;
    if (from === overIndex) return;

    // Optimistic reorder
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    setDragIndex(null);

    // Persist order
    const ids = (prevIds => prevIds)(items.map(p => p.id));
    // Recompute ids after optimistic change
    const optimisticIds = ((list: Product[]) => list.map(p => p.id))(
      (() => {
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(overIndex, 0, moved);
        return next;
      })()
    );

    startTransition(async () => {
      setStatus("Saving order...");
      const res = await reorderProducts(optimisticIds);
      if (res.status === 200) {
        setStatus("Order saved ✅");
      } else {
        setStatus(res.message || "Failed to save order");
        // Revert on failure
        setItems((prev) => {
          const original = [...prev];
          // Reconstruct from current products props as fallback
          const rebuilt = [...products].sort((a, b) => {
            const ao = a.order ?? 0;
            const bo = b.order ?? 0;
            if (ao !== bo) return ao - bo;
            return a.name.localeCompare(b.name);
          });
          return rebuilt.length ? rebuilt : original;
        });
      }
      // Clear status after short delay
      setTimeout(() => setStatus(""), 1500);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {status && (
        <div className="mb-4 text-sm text-indigo-300">{status}</div>
      )}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product, index) => {
          if (!product?.id) return null;
          const target = `/${Routes.ADMIN}/${Pages.MENU_ITEMS}/${encodeURIComponent(String(product.id))}/${Pages.EDIT}`;
          return (
            <li
              key={product.id}
              draggable
              onDragStart={onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={onDrop(index)}
              className="group bg-black rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-indigo-700 hover:border-indigo-500 cursor-move"
              aria-grabbed={dragIndex === index}
            >
              <button
                type="button"
                onClick={() => router.push(target)}
                className="w-full flex flex-col items-center justify-center p-6 text-center focus:outline-none"
                aria-label={`Edit ${product.name ?? 'product'}`}
              >
                <div className="relative w-36 h-36 mb-4">
                  <Image
                    src={product.image || "/default-product-image.png"}
                    alt={product.name || "Product image"}
                    width={144}
                    height={144}
                    className="rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="/placeholder-image.png"
                  />
                </div>
                <h3 className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors duration-200 truncate max-w-full">
                  {product.name}
                </h3>
                <span className="mt-2 text-xs font-medium text-indigo-500 opacity-80">
                  #{index + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}