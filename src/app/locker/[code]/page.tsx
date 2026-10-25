import { redirect } from "next/navigation";

// Redirect old /locker/[code] URLs to the new /drop/locker/[code] path
export default function OldLockerRedirect({ params }: { params: { code: string } }) {
  redirect(`/drop/locker/${params.code}`);
}
