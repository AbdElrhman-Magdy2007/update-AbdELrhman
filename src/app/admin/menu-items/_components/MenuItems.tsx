"use client";

import { Pages, Routes } from "@/constants/enums";
import { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interface for Props with explicit definition
interface MenuItemsProps {
  products: Product[];
}

export default function MenuItems({ products }: MenuItemsProps) {
  const router = useRouter();
  // Log the number of products for debugging (in development mode only)
  if (process.env.NODE_ENV === "development") {
    console.log(`MenuItems received ${products?.length || 0} products:`, products);
  }

  // Validate data
  if (!products || !Array.isArray(products)) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <p className="text-lg font-medium text-red-600">
          Error: Invalid products data
        </p>
      </div>
    );
  }

  // Display message if the list is empty
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <p className="text-lg font-medium text-gray-500">
          No products found
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {products.map((product) => {
        // Guard against invalid product IDs
        if (!product?.id) return null;

        const target = `/${Routes.ADMIN}/${Pages.MENU_ITEMS}/${encodeURIComponent(String(product.id))}/${Pages.EDIT}`;

        return (
          <li
            key={product.id}
            className="group bg-black rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-indigo-700 hover:border-indigo-500"
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
                  loading="lazy" // Lazy loading for performance
                  placeholder="blur"
                  blurDataURL="/placeholder-image.png"
                />
              </div>
              <h3 className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors duration-200 truncate max-w-full">
                {product.name}
              </h3>
              <span className="mt-2 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Text
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}