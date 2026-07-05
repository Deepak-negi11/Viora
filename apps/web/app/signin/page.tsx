"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { TextField } from "../../components/TextField";
import { signinUser } from "../../lib/auth-api";
import { saveAuthToken } from "../../lib/auth-token";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { token } = await signinUser({ email, password });
      saveAuthToken(token);
      router.push("/spaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
        <h1 className="text-center text-sm font-semibold tracking-widest text-neutral-500">
          2D METAVERSE
        </h1>
        <h2 className="mt-2 mb-6 text-center text-2xl font-bold text-neutral-100">
          Sign in
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            maxLength={30}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-neutral-100 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          New here?{" "}
          <Link href="/signup" className="font-medium text-neutral-100 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
