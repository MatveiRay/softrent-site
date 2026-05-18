import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ScrollSection from "@/components/ScrollSection";
import Manifesto from "@/components/Manifesto";
import ListingsGrid from "@/components/ListingsGrid";
import Footer from "@/components/Footer";
import { getAllListings } from "@/lib/listings-db";

// Cache for 5 minutes so the home page is mostly static
export const revalidate = 300;

export default async function Home() {
  const listings = await getAllListings();
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScrollSection />
        <Manifesto />
        <ListingsGrid listings={listings} />
      </main>
      <Footer />
    </>
  );
}
