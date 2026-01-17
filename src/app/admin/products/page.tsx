"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface Product {
  id?: string;
  _id?: string;
  name: string;
  link: string;
  email: string;
  photo: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductDetails extends Product {
  [key: string]: string | number | boolean | undefined;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "admin/getproduct/list",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        // Handle different response formats
        const productList =
          data.productData || data.products || data.data || [];

        setProducts(productList);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to load products. Please try again.",
          "error"
        );
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleEditClick = async (productId: string) => {
    setIsEditModalOpen(true);
    setIsLoadingProduct(true);
    setProductDetails(null);
    setEditPhoto(null);
    setEditPhotoPreview("");

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `admin/product/${productId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }

      const data = await response.json();
      const productData = data.productData || data.product || data;
      setProductDetails(productData);
      if (productData.photo) {
        setEditPhotoPreview(productData.photo);
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to load product details. Please try again.",
        "error"
      );
      console.error("Error fetching product details:", error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setProductDetails(null);
    setEditPhoto(null);
    setEditPhotoPreview("");
  };

  const handleFieldChange = (field: keyof ProductDetails, value: string) => {
    setProductDetails((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        showToast(
          "Please upload a valid image file (JPG, PNG, or JPEG).",
          "error"
        );
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast("Image size should be less than 5MB.", "error");
        return;
      }

      setEditPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = async () => {
    if (!productDetails || isUpdatingProduct) return;

    const id = (productDetails.id || productDetails._id || "") as string;
    if (!id) {
      showToast("Product id is missing, cannot update.", "error");
      return;
    }

    // Validate required fields
    if (
      !productDetails.name ||
      !productDetails.link ||
      !productDetails.email ||
      !productDetails.description
    ) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(productDetails.email as string)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    // Basic URL validation
    try {
      new URL(productDetails.link as string);
    } catch {
      showToast("Please enter a valid URL for the link field.", "error");
      return;
    }

    try {
      setIsUpdatingProduct(true);

      const formData = new FormData();
      formData.append("id", id);
      formData.append("name", productDetails.name as string);
      formData.append("link", productDetails.link as string);
      formData.append("email", productDetails.email as string);
      formData.append("description", productDetails.description as string);

      if (editPhoto) {
        formData.append("photo", editPhoto);
      } else if (productDetails.photo) {
        // If no new photo, send the existing photo URL
        formData.append("photo", productDetails.photo as string);
      }

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "admin/edit-product",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update product");
      }

      const data = await response.json().catch(() => ({}));

      // Update product in local state
      setProducts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === id
            ? {
                ...p,
                name: (productDetails.name as string) || p.name,
                link: (productDetails.link as string) || p.link,
                email: (productDetails.email as string) || p.email,
                description:
                  (productDetails.description as string) || p.description,
                photo:
                  editPhotoPreview ||
                  (productDetails.photo as string) ||
                  p.photo,
              }
            : p
        )
      );

      showToast(
        (data && data.message) || "Product updated successfully!",
        "success"
      );

      // Close modal and reset states
      closeEditModal();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update product. Please try again.",
        "error"
      );
      console.error("Error updating product:", error);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 px-4 py-8 dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:px-6 lg:px-8">
      {/* Toast Container - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm sm:max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800"
                : toast.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800"
                : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="shrink-0">
              {toast.type === "success" ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : toast.type === "error" ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            <p className="flex-1 text-sm font-medium">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Products
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage and view all products in Shop
              <span className="text-blue-600 dark:text-blue-400">Sphere</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/addproduct"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500 transition-colors"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Product
            </Link>
            <Link
              href="/admin/list"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-500 transition-colors"
            >
              Back to Users
            </Link>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 dark:shadow-zinc-900/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Loading products...
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <svg
                className="h-16 w-16 text-zinc-400 dark:text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                No products found
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get started by creating a new product.
              </p>
              <Link
                href="/admin/addproduct"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                Add New Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Link
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                  {products.map((product, index) => (
                    <tr
                      key={product.id || product._id || index}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-4">
                          {product.photo && (
                            <img
                              src={product.photo}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-900 dark:text-zinc-50">
                          {product.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-xs block"
                        >
                          {product.link}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {product.description || "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(product.id || product._id || "");
                          }}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500 transition-colors"
                        >
                          <svg
                            className="mr-1.5 h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Count */}
        {!isLoading && products.length > 0 && (
          <div className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Showing <span className="font-semibold">{products.length}</span>{" "}
            {products.length === 1 ? "product" : "products"}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm overflow-y-auto py-8"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900 z-10">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Edit Product
              </h2>
              <button
                onClick={closeEditModal}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingProduct ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Loading product details...
                    </p>
                  </div>
                </div>
              ) : productDetails ? (
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="edit-name"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                      >
                        Product Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        required
                        value={(productDetails.name as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-link"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                      >
                        Product Link
                      </label>
                      <input
                        id="edit-link"
                        type="url"
                        required
                        value={(productDetails.link as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("link", e.target.value)
                        }
                        className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                        placeholder="https://example.com/product"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-email"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="edit-email"
                        type="email"
                        required
                        value={(productDetails.email as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-photo"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                      >
                        Product Photo
                      </label>
                      <input
                        id="edit-photo"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleEditPhotoChange}
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50 file:cursor-pointer cursor-pointer rounded-lg border-0 px-4 py-3 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:ring-zinc-700 dark:focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Accepted formats: JPG, PNG, JPEG (Max 5MB). Leave empty
                        to keep current photo.
                      </p>
                      {editPhotoPreview && (
                        <div className="mt-3">
                          <img
                            src={`http://localhost:3001/${editPhotoPreview.replace(
                              /^\/+/,
                              ""
                            )}`}
                            alt="Product preview"
                            className="h-32 w-32 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="edit-description"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                      >
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        rows={4}
                        required
                        value={(productDetails.description as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("description", e.target.value)
                        }
                        className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter product description"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg
                    className="h-16 w-16 text-zinc-400 dark:text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Unable to load product details
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Please try again later.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {productDetails && (
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900 z-10">
                <button
                  onClick={closeEditModal}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={isUpdatingProduct}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors ${
                    isUpdatingProduct
                      ? "bg-blue-400 cursor-not-allowed opacity-80"
                      : "bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500"
                  }`}
                >
                  {isUpdatingProduct && (
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isUpdatingProduct ? "Updating..." : "Update Product"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
