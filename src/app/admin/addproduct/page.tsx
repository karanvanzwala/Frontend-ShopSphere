"use client";

import { useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        showToast(
          "Please upload a valid image file (JPG, PNG, or JPEG).",
          "error"
        );
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showToast("Image size should be less than 5MB.", "error");
        return;
      }

      setPhoto(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all required fields
    if (!name || !link || !email || !photo || !description) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    // Basic URL validation for link
    try {
      new URL(link);
    } catch {
      showToast("Please enter a valid URL for the link field.", "error");
      return;
    }

    // Use multipart/form-data for form submission
    const formData = new FormData();
    formData.append("name", name);
    formData.append("link", link);
    formData.append("email", email);
    if (photo) {
      formData.append("photo", photo);
    }
    formData.append("description", description);

    setIsLoading(true);

    try {
      // Convert image to base64
      const photoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photo);
      });

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "admin/addproduct",
        {
          method: "POST",
          body: formData,
          // Do not set 'Content-Type' here; the browser will set the correct boundary for multipart/form-data automatically
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Failed to add product. Please try again"
        );
      }

      const data = await response.json();
      setIsLoading(false);
      showToast(data.message || "Product added successfully!", "success");
      // Clear form fields
      setName("");
      setLink("");
      setEmail("");
      setPhoto(null);
      setPhotoPreview("");
      setDescription("");
      // Reset file input
      const fileInput = document.getElementById("photo") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setIsLoading(false);
      showToast(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again",
        "error"
      );
      console.error("Add Product Error:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-50 via-white to-zinc-100 px-4 py-12 dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:px-6 lg:px-8">
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

      <div className="w-full max-w-xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Add Product
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add a new product to Shop
            <span className="text-blue-600 dark:text-blue-400">Sphere</span>
          </p>
        </div>

        <form
          className="space-y-6 rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 dark:shadow-zinc-900/50"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Product Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter product name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="link"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Product Link
              </label>
              <div className="mt-2">
                <input
                  id="link"
                  name="link"
                  type="url"
                  required
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com/product"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="photo"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Product Photo
              </label>
              <div className="mt-2">
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  required
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50 file:cursor-pointer cursor-pointer rounded-lg border-0 px-4 py-3 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:ring-zinc-700 dark:focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Accepted formats: JPG, PNG, JPEG (Max 5MB)
                </p>
              </div>
              {photoPreview && (
                <div className="mt-3">
                  <img
                    src={photoPreview}
                    alt="Product preview"
                    className="h-32 w-32 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-lg border-0 px-4 py-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => (window.location.href = "/admin/list")}
              className="flex w-full justify-center rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto"
            >
              Back to list
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {isLoading ? "Adding product..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
