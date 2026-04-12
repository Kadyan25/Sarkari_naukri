"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card text-center py-12 space-y-4 max-w-md mx-auto mt-8">
      <p className="text-2xl">😕</p>
      <h2 className="hindi font-semibold text-gray-800">
        कुछ गड़बड़ हो गई
      </h2>
      <p className="hindi text-sm text-gray-500">
        पेज लोड नहीं हो सका। कृपया दोबारा कोशिश करें।
      </p>
      <button onClick={reset} className="btn-primary mx-auto">
        दोबारा कोशिश करें
      </button>
    </div>
  );
}
