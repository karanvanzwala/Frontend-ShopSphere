"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  gender: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserDetails extends User {
  [key: string]: string | number | boolean | undefined; // Allow for additional fields from API
}

export default function AdminListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [favoritedUsers, setFavoritedUsers] = useState<Set<string>>(new Set());
  const [isFavoriting, setIsFavoriting] = useState<string | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "admin/list",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        // Handle different response formats
        const userList = data.userData;

        setUsers(userList);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to load users. Please try again.",
          "error"
        );
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const handleUserClick = async (userId: string) => {
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    setUserDetails(null);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `admin/user/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setUserDetails(data.userData || data.user || data);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to load user details. Please try again.",
        "error"
      );
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserDetails(null);
  };

  const handleFieldChange = (field: keyof UserDetails, value: string) => {
    setUserDetails((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdateUser = async () => {
    if (!userDetails || isUpdatingUser) return;

    const id = (userDetails.id || userDetails._id || "") as string;
    if (!id) {
      showToast("User id is missing, cannot update.", "error");
      return;
    }

    try {
      setIsUpdatingUser(true);

      const payload = {
        id,
        ...userDetails,
      };

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "admin/edit-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update user");
      }

      const data = await response.json().catch(() => ({}));

      // Update list with latest data for this user
      setUsers((prev) =>
        prev.map((u) =>
          (u.id || u._id) === id
            ? {
                ...u,
                fullName: (userDetails.fullName as string) || u.fullName,
                email: (userDetails.email as string) || u.email,
                mobile: (userDetails.mobile as string) || u.mobile,
                address: (userDetails.address as string) || u.address,
                gender: (userDetails.gender as string) || u.gender,
              }
            : u
        )
      );

      showToast(
        (data && data.message) || "User details updated successfully!",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update user. Please try again.",
        "error"
      );
      console.error("Error updating user:", error);
    } finally {
      setIsUpdatingUser(false);
      // Close modal and reset details after update attempt
      setIsModalOpen(false);
      setUserDetails(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userDetails || isDeletingUser) return;

    const id = (userDetails.id || userDetails._id || "") as string;
    if (!id) {
      showToast("User id is missing, cannot delete.", "error");
      return;
    }

    try {
      setIsDeletingUser(true);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `admin/delete-user/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete user");
      }

      const data = await response.json().catch(() => ({}));

      // Remove user from local state
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== id));

      // Remove from favorites if present
      setFavoritedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      showToast(
        (data && data.message) || "User deleted successfully!",
        "success"
      );

      // Close modal and reset states
      setIsModalOpen(false);
      setUserDetails(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again.",
        "error"
      );
      console.error("Error deleting user:", error);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleFavorite = async (
    e: React.MouseEvent,
    userId: string,
    userName: string
  ) => {
    e.stopPropagation(); // Prevent row click from firing

    if (isFavoriting) return; // Prevent multiple clicks

    setIsFavoriting(userId);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "admin/favourites",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add to favorites");
      }

      const data = await response.json();

      // Toggle favorite state
      setFavoritedUsers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      showToast(
        data.message || `${userName} added to favorites successfully!`,
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to add to favorites. Please try again.",
        "error"
      );
      console.error("Error adding to favorites:", error);
    } finally {
      setIsFavoriting(null);
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
              Admin Users
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage and view all admin users in Shop
              <span className="text-blue-600 dark:text-blue-400">Sphere</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signup"
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
              Add New User
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-500 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>

        {/* Users Table */}
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
                  Loading users...
                </p>
              </div>
            </div>
          ) : users.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                No users found
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get started by creating a new admin user.
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                Add New User
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
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                    >
                      Gender
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
                  {users.map((user, index) => (
                    <tr
                      key={user.id || user._id || index}
                      onClick={() => handleUserClick(user.id || user._id || "")}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <span className="text-sm font-semibold">
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-zinc-900 dark:text-zinc-50">
                          {user.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
                          {user.address || "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {user.gender || "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          onClick={(e) =>
                            handleFavorite(
                              e,
                              user.id || user._id || "",
                              user.fullName
                            )
                          }
                          disabled={
                            isFavoriting === (user.id || user._id || "")
                          }
                          className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
                            favoritedUsers.has(user.id || user._id || "")
                              ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              : "text-zinc-400 hover:bg-zinc-100 hover:text-yellow-500 dark:hover:bg-zinc-800 dark:hover:text-yellow-400"
                          } ${
                            isFavoriting === (user.id || user._id || "")
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title={
                            favoritedUsers.has(user.id || user._id || "")
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          {isFavoriting === (user.id || user._id || "") ? (
                            <svg
                              className="animate-spin h-5 w-5"
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
                          ) : favoritedUsers.has(user.id || user._id || "") ? (
                            <svg
                              className="h-5 w-5 fill-current"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
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
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Count */}
        {!isLoading && users.length > 0 && (
          <div className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Showing <span className="font-semibold">{users.length}</span>{" "}
            {users.length === 1 ? "user" : "users"}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                User Details
              </h2>
              <button
                onClick={closeModal}
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
              {isLoadingDetails ? (
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
                      Loading user details...
                    </p>
                  </div>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* User Avatar and Name */}
                  <div className="flex items-center gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <span className="text-xl font-semibold">
                        {userDetails.fullName
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={(userDetails.fullName as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("fullName", e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        User ID: {userDetails.id || userDetails._id || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* User Information Grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                        <svg
                          className="h-5 w-5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <input
                          type="email"
                          value={(userDetails.email as string) || ""}
                          onChange={(e) =>
                            handleFieldChange("email", e.target.value)
                          }
                          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50"
                          placeholder="Email"
                        />
                      </div>
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Mobile Number
                      </label>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                        <svg
                          className="h-5 w-5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <input
                          type="tel"
                          value={(userDetails.mobile as string) || ""}
                          onChange={(e) =>
                            handleFieldChange("mobile", e.target.value)
                          }
                          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50"
                          placeholder="Mobile number"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={(userDetails.gender as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("gender", e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Created At */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Created At
                      </label>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                        <svg
                          className="h-5 w-5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm text-zinc-900 dark:text-zinc-50">
                          {formatDateTime(userDetails.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Address
                    </label>
                    <div className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                      <svg
                        className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <textarea
                        value={(userDetails.address as string) || ""}
                        onChange={(e) =>
                          handleFieldChange("address", e.target.value)
                        }
                        rows={3}
                        className="flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50"
                        placeholder="Address"
                      />
                    </div>
                  </div>

                  {/* Updated At */}
                  {userDetails.updatedAt && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Last Updated
                      </label>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                        <svg
                          className="h-5 w-5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span className="text-sm text-zinc-900 dark:text-zinc-50">
                          {formatDateTime(userDetails.updatedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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
                    Unable to load user details
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Please try again later.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex justify-between items-center gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeletingUser || isUpdatingUser}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus-visible:outline-red-500"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isUpdatingUser || isDeletingUser}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors ${
                    isUpdatingUser
                      ? "bg-blue-400 cursor-not-allowed opacity-80"
                      : "bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-500"
                  }`}
                >
                  {isUpdatingUser && (
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
                  {isUpdatingUser ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Confirm Deletion
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                    Are you sure you want to delete this user?
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    This action cannot be undone. The user{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {userDetails?.fullName || "N/A"}
                    </span>{" "}
                    will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingUser}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors ${
                  isDeletingUser
                    ? "bg-red-400 cursor-not-allowed opacity-80"
                    : "bg-red-600 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                }`}
              >
                {isDeletingUser && (
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
                {isDeletingUser ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
