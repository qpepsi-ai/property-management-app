export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold">Sign-in link expired</h1>
        <p className="text-sm text-gray-600">
          That link is no longer valid. Go back and request a new one.
        </p>
        <a href="/login" className="mt-4 inline-block text-sm underline">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
