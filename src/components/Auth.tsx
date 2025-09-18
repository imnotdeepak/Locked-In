"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const clearFields = () => {
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    clearFields();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Signed in successfully!");
      } else {
        // Check if this email has been used for signup before (localStorage)
        const attemptedEmails = JSON.parse(
          localStorage.getItem("attemptedSignupEmails") || "[]"
        );

        if (attemptedEmails.includes(email)) {
          setMessage(
            "An account with this email already exists. Please sign in instead."
          );
          return;
        }

        // Check if user already exists by trying to sign in with a dummy password
        try {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password: "dummy_check_password_12345",
            });

          // If sign in doesn't fail with "Invalid login credentials", user might exist
          if (
            signInData.user ||
            (signInError &&
              !signInError.message.includes("Invalid login credentials"))
          ) {
            setMessage(
              "An account with this email already exists. Please sign in instead."
            );
            return;
          }
        } catch (checkError) {
          // If there's any error during the check, assume user exists
          setMessage(
            "An account with this email already exists. Please sign in instead."
          );
          return;
        }

        // Try to sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.log("Signup error:", error);
          throw error;
        }

        // If signup was successful, store this email as attempted
        attemptedEmails.push(email);
        localStorage.setItem(
          "attemptedSignupEmails",
          JSON.stringify(attemptedEmails)
        );

        setMessage("Check your email for the confirmation link!");
      }

      onAuthSuccess();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white text-center">Locked In</h1>
      </div>
      <div className="max-w-md w-full">
        <div className="bg-black border-2 border-[#080808] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isLogin ? "Sign In" : "Sign Up"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white border border-white disabled:opacity-50"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 text-center ${
                message.includes("successfully") ||
                message.includes("Check your email")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
