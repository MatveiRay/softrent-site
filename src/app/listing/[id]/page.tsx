import { notFound } from "next/navigation";
import { getAllListingSlugs, getListingBySlug } from "@/lib/listings-db";
import ListingDetail from "./ListingDetail";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllListingSlugs();
  return slugs.map((slug) => ({ id: slug }));
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingBySlug(id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} />;
}
