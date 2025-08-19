'use server';

import { cache } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/prisma';
import { ProductWithRelations } from '@/app/types/product';
import { revalidatePath } from 'next/cache';

interface CategoryWithProducts {
  id: string;
  name: string;
  order: number;
  products: ProductWithRelations[];
}

// Constants
const LOG_PREFIX = '[Products]';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 0;
const DEFAULT_SORT_BY = 'order';
const DEFAULT_ORDER = 'asc';
const ERROR_MESSAGES = {
  INVALID_PAGE: 'Page number must be positive',
  INVALID_LIMIT: 'Limit must be non-negative',
  INVALID_CATEGORY_ID: 'Category ID is required',
  INVALID_LIVE_DEMO_LINK: 'Live demo link cannot point to admin routes',
  INVALID_CATEGORY_NAME: 'Category name contains invalid characters',
  NO_PRODUCTS: 'No products found',
  NO_BEST_SELLERS: 'No best-selling products found',
  NO_CATEGORIES: 'No categories found',
  FETCH_FAILED: 'Failed to fetch data',
  DB_CONNECTION_FAILED: 'Database connection failed',
};

// Generate unique request ID for logging
const generateRequestId = () => uuidv4();

// Interface for product fetch options
interface GetProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'order' | 'name' | 'createdAt' | 'liveDemoLink' | 'gitHubLink';
  order?: 'asc' | 'desc';
}

// Interface for error response
interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}

// Common include configuration for product queries
const productInclude = {
  category: { select: { id: true, name: true, order: true } },
  ProductTech: { select: { id: true, name: true, productId: true } },
  ProductAddon: { select: { id: true, name: true, productId: true } },
  orders: { select: { id: true, quantity: true, productId: true, orderId: true } },
  downloadVerifications: { select: { id: true } },
};

// Utility to validate URLs
const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false; // Treat null/undefined as invalid for UI consistency
  try {
    new URL(url);
    return !url.includes('/admin/');
  } catch {
    return false;
  }
};

// Utility to sanitize category names
const sanitizeCategoryName = (name: string): string => {
  return name.replace(/[ممممممممتتتdggfjgjgh]+/g, '').trim() || 'Unnamed Category';
};

/**
 * Fetches all products without pagination or filtering.
 */
export const getAllProducts = cache(async (): Promise<ProductWithRelations[] | ErrorResponse> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching all products`);

  try {
    const products = await db.product.findMany({
      include: productInclude,
      orderBy: { order: 'asc' },
    });

    console.log(`${LOG_PREFIX} [${requestId}]`, {
      action: 'FETCH_ALL',
      count: products.length,
      cache: products.length > 0 ? 'MISS' : 'HIT',
      timestamp: new Date().toISOString(),
    });

    return products.length > 0
      ? products
      : { error: ERROR_MESSAGES.NO_PRODUCTS, code: 'NO_PRODUCTS', details: 'The database contains no products' };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching products:`, error);
    return {
      error: ERROR_MESSAGES.FETCH_FAILED,
      code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Fetches products with support for filtering, sorting, and pagination.
 */
export const getProducts = cache(async (options: GetProductsOptions = {}): Promise<ProductWithRelations[] | ErrorResponse> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching products with options:`, options);

  try {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search, sortBy = DEFAULT_SORT_BY, order = DEFAULT_ORDER } = options;

    if (page < 1) throw new Error(ERROR_MESSAGES.INVALID_PAGE);
    if (limit < 0) throw new Error(ERROR_MESSAGES.INVALID_LIMIT);

    const skip = limit > 0 ? (page - 1) * limit : 0;
    const trimmedSearch = search?.trim();

    const products = await db.product.findMany({
      where: {
        name: trimmedSearch ? { contains: trimmedSearch, mode: 'insensitive' } : undefined,
      },
      include: productInclude,
      orderBy: { [sortBy]: order },
      skip,
      take: limit > 0 ? limit : undefined,
    });

    console.log(`${LOG_PREFIX} [${requestId}]`, {
      action: 'FETCH_FILTERED',
      count: products.length,
      options,
      cache: products.length > 0 ? 'MISS' : 'HIT',
      timestamp: new Date().toISOString(),
    });

    return products.length > 0
      ? products
      : { error: ERROR_MESSAGES.NO_PRODUCTS, code: 'NO_PRODUCTS', details: 'No products match the provided criteria' };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching products:`, error);
    return {
      error: ERROR_MESSAGES.FETCH_FAILED,
      code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Counts products with support for filtering.
 */
export const getProductsCount = cache(async (options: Pick<GetProductsOptions, 'search'> = {}): Promise<number | ErrorResponse> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Counting products with search:`, options.search);

  try {
    const trimmedSearch = options.search?.trim();
    const count = await db.product.count({
      where: {
        name: trimmedSearch ? { contains: trimmedSearch, mode: 'insensitive' } : undefined,
      },
    });

    console.log(`${LOG_PREFIX} [${requestId}]`, {
      action: 'COUNT',
      count,
      cache: count > 0 ? 'MISS' : 'HIT',
      timestamp: new Date().toISOString(),
    });

    return count;
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error counting products:`, error);
    return {
      error: ERROR_MESSAGES.FETCH_FAILED,
      code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Fetches best-selling products based on order count.
 */
export const getBestSellers = cache(async (limit?: number): Promise<ProductWithRelations[] | ErrorResponse> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching best sellers with limit:`, limit);

  try {
    if (limit && limit < 1) throw new Error(ERROR_MESSAGES.INVALID_LIMIT);

    const products = await db.product.findMany({
      where: { orders: { some: {} } },
      orderBy: { orders: { _count: 'desc' } },
      include: productInclude,
      take: limit,
    });

    console.log(`${LOG_PREFIX} [${requestId}]`, {
      action: 'FETCH_BEST_SELLERS',
      count: products.length,
      cache: products.length > 0 ? 'MISS' : 'HIT',
      timestamp: new Date().toISOString(),
    });

    return products.length > 0
      ? products
      : { error: ERROR_MESSAGES.NO_BEST_SELLERS, code: 'NO_BEST_SELLERS', details: 'No products with orders exist' };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching best sellers:`, error);
    return {
      error: ERROR_MESSAGES.FETCH_FAILED,
      code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Fetches all categories with their associated products.
 */
export const getProductsByCategory = cache(async (): Promise<CategoryWithProducts[] | ErrorResponse> => {
  const requestId = generateRequestId();
  console.log(`${LOG_PREFIX} [${requestId}] Fetching categories with products`);

  try {
    const categories = await db.category.findMany({
      include: {
        products: {
          include: productInclude,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    const validatedCategories = categories.map(category => ({
      ...category,
      name: sanitizeCategoryName(category.name),
      products: category.products,
    }));

    // Log details for debugging
    validatedCategories.forEach(category => {
      console.log(`${LOG_PREFIX} [${requestId}] Category: ${category.name}`, {
        categoryId: category.id,
        productCount: category.products.length,
        products: category.products.map(p => ({
          id: p.id,
          name: p.name,
          liveDemoLink: p.liveDemoLink,
          gitHubLink: p.gitHubLink,
          validLiveDemo: isValidUrl(p.liveDemoLink),
          validGitHub: isValidUrl(p.gitHubLink),
          addons: p.ProductAddon?.map(a => a.name) || [],
          techs: p.ProductTech?.map(t => t.name) || [],
        })),
      });
    });

    console.log(`${LOG_PREFIX} [${requestId}]`, {
      action: 'FETCH_CATEGORIES',
      categoryCount: validatedCategories.length,
      productCount: validatedCategories.reduce((sum, cat) => sum + cat.products.length, 0),
      cache: validatedCategories.length > 0 ? 'MISS' : 'HIT',
      timestamp: new Date().toISOString(),
    });

    revalidatePath('/projects');

    return validatedCategories.length > 0
      ? validatedCategories
      : { error: ERROR_MESSAGES.NO_CATEGORIES, code: 'NO_CATEGORIES', details: 'The database contains no categories' };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error fetching categories:`, error);
    return {
      error: ERROR_MESSAGES.FETCH_FAILED,
      code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
      details: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Fetches products by category ID with support for filtering and pagination.
 */
export const getProductsByCategoryId = cache(
  async (categoryId: string, options: GetProductsOptions = {}): Promise<ProductWithRelations[] | ErrorResponse> => {
    const requestId = generateRequestId();
    console.log(`${LOG_PREFIX} [${requestId}] Fetching products for category ID: ${categoryId}`);

    try {
      if (!categoryId) throw new Error(ERROR_MESSAGES.INVALID_CATEGORY_ID);

      const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search, sortBy = DEFAULT_SORT_BY, order = DEFAULT_ORDER } = options;

      if (page < 1) throw new Error(ERROR_MESSAGES.INVALID_PAGE);
      if (limit < 0) throw new Error(ERROR_MESSAGES.INVALID_LIMIT);

      const skip = limit > 0 ? (page - 1) * limit : 0;
      const trimmedSearch = search?.trim();

      const products = await db.product.findMany({
        where: {
          categoryId,
          name: trimmedSearch ? { contains: trimmedSearch, mode: 'insensitive' } : undefined,
        },
        include: productInclude,
        orderBy: { [sortBy]: order },
        skip,
        take: limit > 0 ? limit : undefined,
      });

      console.log(`${LOG_PREFIX} [${requestId}]`, {
        action: 'FETCH_BY_CATEGORY',
        categoryId,
        count: products.length,
        options,
        cache: products.length > 0 ? 'MISS' : 'HIT',
        timestamp: new Date().toISOString(),
      });

      return products.length > 0
        ? products
        : { error: ERROR_MESSAGES.NO_PRODUCTS, code: 'NO_PRODUCTS', details: `No products found for category ID ${categoryId}` };
    } catch (error) {
      console.error(`${LOG_PREFIX} [${requestId}] Error fetching products by category:`, error);
      return {
        error: ERROR_MESSAGES.FETCH_FAILED,
        code: error instanceof Error && error.message.includes('connection') ? 'DB_CONNECTION_FAILED' : 'FETCH_FAILED',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
);