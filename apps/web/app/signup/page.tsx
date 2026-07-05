"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { TextField } from "../../components/TextField";
import { signinUser, signupUser } from "../../lib/auth-api";
import { saveAuthToken } from "../../lib/auth-token";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await signupUser({ username, email, password });
      const { token } = await signinUser({ email, password });
      saveAuthToken(token);
      router.push("/spaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
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
          Create account
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField
            id="username"
            label="Username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
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
            autoComplete="new-password"
            minLength={8}
            maxLength={30}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <TextField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={30}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-neutral-100 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-neutral-100 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
