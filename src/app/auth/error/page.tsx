import { linkClass } from "@/lib/ui";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Sign-in link expired</h1>
        <p className="text-sm text-muted">
          That link is no longer valid. Go back and request a new one.
        </p>
        <a href="/login" className={`mt-4 inline-block text-sm ${linkClass}`}>
          Back to sign in
        </a>
      </div>
    </div>
  );
}
