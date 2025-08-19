// app/menu-items/_actions/product.ts
"use server";

import { db } from "@/lib/prisma";
import { Pages, Routes } from "@/constants/enums";
import { addProductSchema, ProductValidatedData } from "@/app/validations/product";
import { PackageOption, ProductAddon, ProductTech } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Constants
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];
const LOG_PREFIX = "[ServerActions]";
const MAX_UPLOAD_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// Types
interface ActionResponse {
  status: number;
  message: string;
  error?: Record<string, string>;
  formData?: FormData;
}

interface ProductOptions {
  productTechs: Partial<ProductTech>[];
  productAddons: Partial<ProductAddon>[];
}

interface AddProductArgs {
  categoryId: string;
  options: ProductOptions;
}

interface UpdateProductArgs {
  productId: string;
  options: ProductOptions;
}

/**
 * Delays execution for a specified time.
 * @param ms - Milliseconds to delay.
 * @returns Promise that resolves after the delay.
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates and uploads an image file with retry logic and exponential backoff.
 * @param imageFile - The image file to upload.
 * @returns URL of the uploaded image.
 * @throws Error if the upload fails after retries.
 */
const uploadImage = async (imageFile: File): Promise<string> => {
  const requestId = crypto.randomUUID();
  console.log(`${LOG_PREFIX} [${requestId}] Validating image: ${imageFile.name} (${imageFile.size} bytes, type: ${imageFile.type})`);

  if (!VALID_IMAGE_TYPES.includes(imageFile.type)) {
    console.error(`${LOG_PREFIX} [${requestId}] Invalid image type: ${imageFile.type}`);
    throw new Error(`Invalid image type: ${imageFile.type}. Supported types: ${VALID_IMAGE_TYPES.join(", ")}`);
  }
  if (imageFile.size > MAX_IMAGE_SIZE) {
    const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
    console.error(`${LOG_PREFIX} [${requestId}] Image too large: ${sizeMB}MB`);
    throw new Error(`Image size (${sizeMB}MB) exceeds the 15MB limit`);
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("pathName", "product_images");

  let lastError: Error | null = null;
  // Build absolute base URL for server-side fetch
  const getBaseUrl = () => {
    const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) return (vercel.startsWith("http") ? vercel : `https://${vercel}`).replace(/\/+$/, "");
    const port = process.env.PORT || "3000";
    return `http://localhost:${port}`;
  };

  for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
    try {
      console.log(`${LOG_PREFIX} [${requestId}] Upload attempt ${attempt}`);
      const url = `${getBaseUrl()}/api/upload`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let serverMessage = "";
        let details = "";
        try {
          const errJson = await response.json();
          const name = errJson?.name;
          const httpCode = errJson?.httpCode;
          const cloudinaryError = errJson?.cloudinaryError;
          serverMessage = errJson?.error || "";
          const parts: string[] = [];
          if (name) parts.push(`name=${name}`);
          if (typeof httpCode === "number") parts.push(`httpCode=${httpCode}`);
          if (cloudinaryError) parts.push(`cloudinaryError=${typeof cloudinaryError === "string" ? cloudinaryError : JSON.stringify(cloudinaryError)}`);
          details = parts.length ? ` [${parts.join(", ")}]` : "";
        } catch {
          try {
            const text = await response.text();
            if (text) serverMessage = text;
          } catch {}
        }
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}${serverMessage ? ` - ${serverMessage}` : ""}${details}`
        );
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error(`Invalid response: Missing image URL. Received keys: ${Object.keys(data || {}).join(", ")}`);
      }

      console.log(`${LOG_PREFIX} [${requestId}] Image uploaded: ${data.url}`);
      return data.url;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown upload error");
      console.error(`${LOG_PREFIX} [${requestId}] Upload attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_UPLOAD_RETRIES) {
        const retryDelay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`${LOG_PREFIX} [${requestId}] Retrying after ${retryDelay}ms`);
        await delay(retryDelay);
      }
    }
  }

  console.error(`${LOG_PREFIX} [${requestId}] Image upload failed after ${MAX_UPLOAD_RETRIES} attempts`);
  throw lastError || new Error("Image upload failed");
};

/**
 * Revalidates cache for relevant paths in a batch.
 * @param productId - Optional product ID for specific paths.
 */
const revalidatePaths = async (productId?: string): Promise<void> => {
  const paths = [
    `/${Routes.MENU}`,
    `/${Routes.ADMIN}/${Pages.MENU_ITEMS}`,
    productId ? `/${Routes.ADMIN}/${Pages.MENU_ITEMS}/${productId}/${Pages.EDIT}` : null,
    `/projects`,
    "/",
  ].filter(Boolean) as string[];

  console.log(`${LOG_PREFIX} Revalidating paths: ${paths.join(", ")}`);
  await Promise.all(paths.map((path) => revalidatePath(path)));
};

/**
 * Reorders products by setting their `order` based on the provided array of IDs.
 * The first ID gets order=1, the second gets order=2, etc.
 */
export const reorderProducts = async (
  orderedIds: string[]
): Promise<ActionResponse> => {
  const requestId = crypto.randomUUID();
  console.log(`${LOG_PREFIX} [${requestId}] Reordering products`, orderedIds);

  try {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { status: 400, message: "orderedIds must be a non-empty array" };
    }

    // Ensure uniqueness
    const uniqueIds = Array.from(new Set(orderedIds));
    if (uniqueIds.length !== orderedIds.length) {
      return { status: 400, message: "orderedIds contains duplicates" };
    }

    await db.$transaction(async (tx) => {
      // Assign sequential order starting at 1
      for (let index = 0; index < uniqueIds.length; index++) {
        const id = uniqueIds[index];
        await tx.product.update({
          where: { id },
          data: { order: index + 1 },
        });
      }
    });

    console.log(`${LOG_PREFIX} [${requestId}] Reorder completed`);
    await revalidatePaths();

    return { status: 200, message: "Order updated successfully" };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Reorder failed`, error);
    return {
      status: 500,
      message: `Failed to reorder products: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Validates product options (techs and addons).
 * @param options - ProductTechs and ProductAddons arrays.
 * @returns ActionResponse if validation fails, null otherwise.
 */
const validateOptions = (options: ProductOptions): ActionResponse | null => {
  // Validate productTechs
  if (options.productTechs.length === 0) {
    return {
      status: 400,
      message: "At least one technology is required",
    };
  }
  for (const tech of options.productTechs) {
    if (!tech.name?.trim()) {
      return {
        status: 400,
        message: "All technologies must have a valid name",
      };
    }
  }

  // Validate productAddons
  if (options.productAddons.length !== 1) {
    return {
      status: 400,
      message: "Exactly one product addon is required",
    };
  }

  const addon = options.productAddons[0];
  if (!addon.name || !Object.values(PackageOption).includes(addon.name as PackageOption)) {
    return {
      status: 400,
      message: `Invalid addon name: ${addon.name || "undefined"}. Expected one of: ${Object.values(PackageOption).join(", ")}`,
    };
  }

  return null;
};

/**
 * Adds a new product to the database.
 * @param args - Category ID and product options.
 * @param _prevState - Previous state (unused).
 * @param formData - Form data containing product details.
 * @returns ActionResponse with status and message.
 */
export const addProduct = async (
  args: AddProductArgs,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> => {
  const requestId = crypto.randomUUID();
  console.log(`${LOG_PREFIX} [${requestId}] Processing addProduct`);

  try {
    // Log raw form data
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      rawData[key] = value instanceof File ? `[File: ${value.name}]` : value;
    });
    console.log(`${LOG_PREFIX} [${requestId}] Raw FormData:`, rawData);

    // Parse form data
    const productTechsRaw = formData.get("productTechs") as string | null;
    const productAddonsRaw = formData.get("productAddons") as string | null;
    const gitHubLinkRaw = formData.get("gitHubLink") as string | null;

    // Parse productTechs as strings
    const productTechs: { name: string }[] = productTechsRaw
      ? JSON.parse(productTechsRaw).map((tech: { name: string }) => ({
          name: tech.name,
        }))
      : [];

    // Validate and parse productAddons
    const productAddons: { name: PackageOption }[] = productAddonsRaw
      ? JSON.parse(productAddonsRaw).map((addon: { name: string }) => {
          if (!Object.values(PackageOption).includes(addon.name as PackageOption)) {
            throw new Error(`Invalid addon name: ${addon.name}. Expected one of: ${Object.values(PackageOption).join(", ")}`);
          }
          return { name: addon.name as PackageOption };
        })
      : [];

    const gitHubLink = gitHubLinkRaw === "" || gitHubLinkRaw === null ? undefined : gitHubLinkRaw;

    // Prepare validation input
    const validationInput: Partial<ProductValidatedData> = {
      name: formData.get("name") as string | undefined,
      description: formData.get("description") as string | undefined,
      categoryId: args.categoryId,
      image: formData.get("image") as File | undefined,
      productTechs,
      productAddons,
      liveDemoLink: formData.get("liveDemoLink") as string | undefined,
      gitHubLink,
    };
    console.log(`${LOG_PREFIX} [${requestId}] Validation Input:`, validationInput);

    // Validate form data using Zod schema
    const result = addProductSchema().safeParse(validationInput);

    if (!result.success) {
      const errorDetails = result.error.flatten();
      console.log(`${LOG_PREFIX} [${requestId}] Validation Errors:`, errorDetails);
      return {
        status: 400,
        message: "Invalid form data",
        error: Object.fromEntries(
          Object.entries(errorDetails.fieldErrors).map(([key, value]) => [
            key,
            value?.join(", ") || "",
          ])
        ),
        formData,
      };
    }

    const { name, description, categoryId, image, productTechs: validatedTechs, productAddons: validatedAddons, liveDemoLink, gitHubLink: validatedGitHubLink } = result.data;

    console.log(`${LOG_PREFIX} [${requestId}] Validated Data:`, {
      name,
      description,
      categoryId,
      liveDemoLink,
      gitHubLink: validatedGitHubLink,
      productTechs: validatedTechs,
      productAddons: validatedAddons,
    });

    // Validate image
    const imageFile = image as File;
    if (!imageFile || imageFile.size === 0) {
      console.error(`${LOG_PREFIX} [${requestId}] No image provided`);
      return {
        status: 400,
        message: "An image is required",
        error: { image: "Image is required" },
      };
    }

    // Upload image
    const imageUrl = await uploadImage(imageFile);

    // Validate options
    const optionsValidation = validateOptions({
      productTechs: validatedTechs.map((tech) => ({ name: tech.name })),
      productAddons: validatedAddons.map((addon) => ({ name: addon.name as PackageOption })),
    });
    if (optionsValidation) {
      console.error(`${LOG_PREFIX} [${requestId}] Options validation failed: ${optionsValidation.message}`);
      return optionsValidation;
    }

    // Create product and related entities in a transaction
    const product = await db.$transaction(async (tx) => {
      // Get current max order to append new product at the end
      const agg = await tx.product.aggregate({ _max: { order: true } });
      const nextOrder = (agg._max.order ?? 0) + 1;

      const created = await tx.product.create({
        data: {
          name,
          description,
          image: imageUrl,
          categoryId,
          liveDemoLink: liveDemoLink || null,
          gitHubLink: validatedGitHubLink || null,
          order: nextOrder,
        },
      });

      if (validatedTechs.length > 0) {
        await tx.productTech.createMany({
          data: validatedTechs.map((tech) => ({
            productId: created.id,
            name: tech.name,
          })),
        });
      }

      if (validatedAddons.length > 0) {
        await tx.productAddon.createMany({
          data: validatedAddons.map((addon) => ({
            productId: created.id,
            name: addon.name as PackageOption,
          })),
        });
      }

      return created;
    });

    console.log(`${LOG_PREFIX} [${requestId}] Product created: ${product.id}`);

    // Revalidate cache
    await revalidatePaths();

    return {
      status: 201,
      message: "Product added successfully",
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error:`, error);
    return {
      status: 500,
      message: `Failed to add product: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Updates an existing product in the database.
 * @param args - Product ID and product options.
 * @param _prevState - Previous state (unused).
 * @param formData - Form data containing updated product details.
 * @returns ActionResponse with status and message.
 */
export const updateProduct = async (
  args: UpdateProductArgs,
  _prevState: unknown,
  formData: FormData
): Promise<ActionResponse> => {
  const requestId = crypto.randomUUID();
  console.log(`${LOG_PREFIX} [${requestId}] Processing updateProduct for ID: ${args.productId}`);

  try {
    // Log raw form data
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      rawData[key] = value instanceof File ? `[File: ${value.name}]` : value;
    });
    console.log(`${LOG_PREFIX} [${requestId}] Raw FormData:`, rawData);

    // Parse form data
    const productTechsRaw = formData.get("productTechs") as string | null;
    const productAddonsRaw = formData.get("productAddons") as string | null;
    const gitHubLinkRaw = formData.get("gitHubLink") as string | null;

    // Parse productTechs as strings
    const productTechs: { name: string }[] = productTechsRaw
      ? JSON.parse(productTechsRaw).map((tech: { name: string }) => ({
          name: tech.name,
        }))
      : [];

    // Validate and parse productAddons
    const productAddons: { name: PackageOption }[] = productAddonsRaw
      ? JSON.parse(productAddonsRaw).map((addon: { name: string }) => {
          if (!Object.values(PackageOption).includes(addon.name as PackageOption)) {
            throw new Error(`Invalid addon name: ${addon.name}. Expected one of: ${Object.values(PackageOption).join(", ")}`);
          }
          return { name: addon.name as PackageOption };
        })
      : [];

    const gitHubLink = gitHubLinkRaw === "" || gitHubLinkRaw === null ? undefined : gitHubLinkRaw;

    // Prepare validation input
    const validationInput: Partial<ProductValidatedData> = {
      name: formData.get("name") as string | undefined,
      description: formData.get("description") as string | undefined,
      categoryId: formData.get("categoryId") as string | undefined,
      image: formData.get("image") as File | undefined,
      productTechs,
      productAddons,
      liveDemoLink: formData.get("liveDemoLink") as string | undefined,
      gitHubLink,
    };
    console.log(`${LOG_PREFIX} [${requestId}] Validation Input:`, validationInput);

    // Validate form data using Zod schema
    const result = addProductSchema().safeParse(validationInput);

    if (!result.success) {
      const errorDetails = result.error.flatten();
      console.log(`${LOG_PREFIX} [${requestId}] Validation Errors:`, errorDetails);
      return {
        status: 400,
        message: "Invalid form data",
        error: Object.fromEntries(
          Object.entries(errorDetails.fieldErrors).map(([key, value]) => [
            key,
            value?.join(", ") || "",
          ])
        ),
        formData,
      };
    }

    const { name, description, categoryId, image, productTechs: validatedTechs, productAddons: validatedAddons, liveDemoLink, gitHubLink: validatedGitHubLink } = result.data;

    console.log(`${LOG_PREFIX} [${requestId}] Validated Data:`, {
      name,
      description,
      categoryId,
      liveDemoLink,
      gitHubLink: validatedGitHubLink,
      productTechs: validatedTechs,
      productAddons: validatedAddons,
    });

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: args.productId },
    });
    if (!product) {
      console.error(`${LOG_PREFIX} [${requestId}] Product not found: ${args.productId}`);
      return {
        status: 404,
        message: "Product not found",
      };
    }

    // Handle image upload if provided
    let imageUrl = product.image;
    const imageFile = image as File | null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
    }

    // Validate options
    const optionsValidation = validateOptions({
      productTechs: validatedTechs.map((tech) => ({ name: tech.name })),
      productAddons: validatedAddons.map((addon) => ({ name: addon.name as PackageOption })),
    });
    if (optionsValidation) {
      console.error(`${LOG_PREFIX} [${requestId}] Options validation failed: ${optionsValidation.message}`);
      return optionsValidation;
    }

    // Update product in a transaction
    const updatedProduct = await db.$transaction(async (tx) => {
      const productUpdate = await tx.product.update({
        where: { id: args.productId },
        data: {
          name,
          description,
          image: imageUrl,
          categoryId,
          liveDemoLink: liveDemoLink || null,
          gitHubLink: validatedGitHubLink || null,
        },
      });

      await tx.productTech.deleteMany({ where: { productId: args.productId } });
      await tx.productAddon.deleteMany({ where: { productId: args.productId } });

      await tx.productTech.createMany({
        data: validatedTechs.map((tech) => ({
          productId: args.productId,
          name: tech.name, // Store as string
        })),
      });

      await tx.productAddon.createMany({
        data: validatedAddons.map((addon) => ({
          productId: args.productId,
          name: addon.name as PackageOption,
        })),
      });

      return productUpdate;
    });

    console.log(`${LOG_PREFIX} [${requestId}] Product updated: ${updatedProduct.id}`);

    // Revalidate cache
    await revalidatePaths(updatedProduct.id);

    return {
      status: 200,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error:`, error);
    return {
      status: 500,
      message: `Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Deletes a product from the database.
 * @param id - The ID of the product to delete.
 * @returns ActionResponse with status and message.
 */
export const deleteProduct = async (id: string): Promise<ActionResponse> => {
  const requestId = crypto.randomUUID();
  console.log(`${LOG_PREFIX} [${requestId}] Processing deleteProduct for ID: ${id}`);

  try {
    const product = await db.product.findUnique({
      where: { id },
    });
    if (!product) {
      console.error(`${LOG_PREFIX} [${requestId}] Product not found: ${id}`);
      return {
        status: 404,
        message: "Product not found",
      };
    }

    await db.product.delete({
      where: { id },
    });

    console.log(`${LOG_PREFIX} [${requestId}] Product deleted: ${id}`);

    // Revalidate cache
    await revalidatePaths(id);

    return {
      status: 200,
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error:`, error);
    return {
      status: 500,
      message: `Failed to delete product: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};