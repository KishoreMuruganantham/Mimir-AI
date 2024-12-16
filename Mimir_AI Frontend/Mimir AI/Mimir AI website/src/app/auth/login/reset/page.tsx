"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/auth/reset/success");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black">
      <div className="bg-gray-900 p-8 rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <h2 className="text-4xl font-extrabold text-white text-center mb-2">
          Reset Password
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Enter your email to receive a password reset link.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Reset Link
          </button>
        </form>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Remembered your password?{" "}
            <Link
              href="/auth/login"
              className="text-blue-400 hover:underline"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
