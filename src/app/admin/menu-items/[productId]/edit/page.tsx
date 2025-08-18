import { cache } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/prisma";
import { Pages, Routes } from "@/constants/enums";
import { ProductWithRelations } from "@/app/types/product";
import { Category } from "@prisma/client";
import Form from "../../_components/Form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCategories } from "@/app/server/db/categories";
import { getProducts } from "@/app/server/db/products";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader } from "lucide-react";
import clsx from "clsx";

// Constants
const LOG_PREFIX = "[EditProductPage]";
const ERROR_MESSAGES = {
  INVALID_ID: "Invalid product ID provided",
  PRODUCT_NOT_FOUND: "Product not found",
  NO_CATEGORIES: "No categories available. Please create a category first.",
  FETCH_ERROR: "Failed to fetch data. Please try again later.",
};

// Generate unique request ID for logging
const generateRequestId = () => uuidv4();

// Cached database queries with revalidation tags
const cachedGetProducts = cache(async () => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching products`);
  try {
    const result = await getProducts();
    if ("error" in result || !Array.isArray(result)) {
      console.error(`${LOG_PREFIX} [${requestId}] Failed to fetch products:`, result?.error);
      return [];
    }
    return result as ProductWithRelations[];
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching products:`, error);
    return [];
  }
});

const cachedGetCategories = cache(async () => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching categories`);
  try {
    const result = await getCategories();
    if ("error" in result || !Array.isArray(result)) {
      console.error(`${LOG_PREFIX} [${requestId}] Failed to fetch categories:`, result?.error);
      return [];
    }
    return result as Category[];
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching categories:`, error);
    return [];
  }
});

/**
 * Generates static parameters for dynamic routes.
 * @returns Array of product ID parameters.
 */
export async function generateStaticParams() {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Generating static params`);

  try {
    const products = await cachedGetProducts();
    const params = products.map((product) => ({
      productId: product.id,
    }));

    if (process.env.NODE_ENV === "development") {
      console.log(`${LOG_PREFIX} [${requestId}] Generated params:`, params.length);
    }

    return params;
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error in generateStaticParams:`, error);
    return [];
  }
}

/**
 * Fetches a product by ID with optimized field selection.
 * @param productId - The ID of the product to fetch.
 * @returns Product with relations or null if not found.
 */
const getProduct = cache(async (productId: string): Promise<ProductWithRelations | null> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching product ID: ${productId}`);

  if (!productId || typeof productId !== "string") {
    console.warn(`${LOG_PREFIX} [${requestId}] ${ERROR_MESSAGES.INVALID_ID}`);
    return null;
  }

  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        ProductTech: { select: { id: true, name: true } },
        ProductAddon: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, order: true } },
        orders: { select: { id: true } },
        downloadVerifications: { select: { id: true } },
      },
    });

    if (!product) {
      console.warn(`${LOG_PREFIX} [${requestId}] ${ERROR_MESSAGES.PRODUCT_NOT_FOUND}`);
    }

    return product as ProductWithRelations | null;
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching product:`, error);
    return null;
  }
});

/**
 * Server component for editing a product.
 * @param params - Dynamic route parameters containing the product ID.
 * @returns JSX.Element
 */
export default async function EditProductPage({
  params,
}: {
  params: { productId: string };
}) {
  const requestId = generateRequestId();
  const { productId } = params;

  if (process.env.NODE_ENV === "development") {
    console.log(`${LOG_PREFIX} [${requestId}] Rendering page for product ID: ${productId}`);
  }

  // Validate productId early
  if (!productId || typeof productId !== "string") {
    console.error(`${LOG_PREFIX} [${requestId}] ${ERROR_MESSAGES.INVALID_ID}`);
    notFound();
  }

  // Fetch data concurrently
  const [product, categories] = await Promise.all([
    getProduct(productId),
    cachedGetCategories(),
  ]);

  // Handle product not found
  if (!product) {
    console.error(`${LOG_PREFIX} [${requestId}] ${ERROR_MESSAGES.PRODUCT_NOT_FOUND}`);
    notFound();
  }

  // Handle no categories
  if (!categories || categories.length === 0) {
    console.error(`${LOG_PREFIX} [${requestId}] ${ERROR_MESSAGES.NO_CATEGORIES}`);
    return (
      <main
        className={clsx(
          "min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950",
          "relative overflow-hidden flex items-center justify-center p-6"
        )}
        dir="auto"
      >
        {/* Particle Background */}
        <div className="particle-wave pointer-events-none">
          <div
            className="particle"
            style={{
              width: "8px",
              height: "8px",
              top: "20%",
              left: "15%",
              animationDuration: "3s",
              animationDelay: "0.3s",
            }}
          />
          <div
            className="particle"
            style={{
              width: "6px",
              height: "6px",
              top: "70%",
              left: "80%",
              animationDuration: "2.5s",
              animationDelay: "0.8s",
            }}
          />
        </div>

        <Alert
          variant="destructive"
          className={clsx(
            "max-w-md glass-card border-indigo-600/30 bg-slate-800/30",
            "animate-reveal-text delay-200"
          )}
        >
          <AlertTitle
            className={clsx(
              "text-indigo-200 text-2xl font-bold",
              "text-gradient-primary animate-glow"
            )}
          >
            No Categories Available
          </AlertTitle>
          <AlertDescription className="text-red-400 text-lg">
            {ERROR_MESSAGES.NO_CATEGORIES}
          </AlertDescription>
          <Link
            href={`/${Routes.ADMIN}/${Pages.CATEGORIES}`}
            className={clsx(
              "mt-4 inline-block btn-secondary text-indigo-100 font-semibold",
              "hover:text-indigo-50 transition-colors duration-300"
            )}
            aria-label="Navigate to categories management"
          >
            Go to Categories
          </Link>
        </Alert>
      </main>
    );
  }

  return (
    <main
      className={clsx(
        "min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950",
        "relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8"
      )}
      dir="auto"
    >
      {/* Particle Background */}
      <div className="particle-wave pointer-events-none">
        <div
          className="particle"
          style={{
            width: "8px",
            height: "8px",
            top: "20%",
            left: "15%",
            animationDuration: "3s",
            animationDelay: "0.3s",
          }}
        />
        <div
          className="particle"
          style={{
            width: "6px",
            height: "6px",
            top: "70%",
            left: "80%",
            animationDuration: "2.5s",
            animationDelay: "0.8s",
          }}
        />
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader className="w-8 h-8 text-indigo-200 animate-spin" />
          </div>
        }
      >
        <section className="max-w-5xl mx-auto">
          <Card
            className={clsx(
              "glass-card bg-slate-800/30 border-indigo-600/30 shadow-lg",
              "rounded-xl animate-reveal-text delay-200"
            )}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle
                  className={clsx(
                    "text-3xl font-bold text-indigo-200",
                    "text-gradient-primary animate-glow"
                  )}
                >
                  Edit Product: {product.name}
                </CardTitle>
                <Link
                  href={`/${Routes.ADMIN}/${Pages.MENU_ITEMS}`}
                  className={clsx(
                    "btn-secondary text-indigo-100 font-semibold",
                    "hover:text-indigo-50 transition-colors duration-300"
                  )}
                  aria-label="Return to menu items"
                >
                  Back to Menu Items
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Form product={product} categories={categories} />
            </CardContent>
          </Card>
        </section>
      </Suspense>
    </main>
  );
}