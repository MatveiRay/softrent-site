import { notFound } from "next/navigation";
import { listings } from "@/data/listings";
import ListingDetail from "./ListingDetail";

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = listings.find((l) => l.id === id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} />;
}
