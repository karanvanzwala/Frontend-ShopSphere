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

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
          process.env.NEXT_PUBLIC_API_URL + "admin/products",
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
                        <Link
                          href={`/admin/products/edit/${
                            product.id || product._id || ""
                          }`}
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
                        </Link>
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
    </div>
  );
}
