import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card text-center py-16 space-y-4 max-w-md mx-auto mt-8">
      <p className="text-5xl font-bold text-brand">404</p>
      <h2 className="hindi font-semibold text-gray-800 text-lg">
        पेज नहीं मिला
      </h2>
      <p className="hindi text-sm text-gray-500">
        यह पेज मौजूद नहीं है या हटा दिया गया है।
      </p>
      <Link href="/" className="btn-primary inline-block">
        होम पर जाएं →
      </Link>
    </div>
  );
}
