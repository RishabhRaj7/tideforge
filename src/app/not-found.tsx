import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return <EmptyState title="Page not found" href="/" cta="Back to home">That page does not exist, or the slug changed. Try the search (Ctrl K).</EmptyState>;
}
