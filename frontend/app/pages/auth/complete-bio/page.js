import { Suspense } from "react";
import CompleteBio from "../../../components/complete-bio";

export default function CompleteBioPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteBio />
    </Suspense>
  );
}
