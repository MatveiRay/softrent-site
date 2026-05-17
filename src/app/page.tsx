import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ScrollSection from "@/components/ScrollSection";
import Manifesto from "@/components/Manifesto";
import ListingsGrid from "@/components/ListingsGrid";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScrollSection />
        <Manifesto />
        <ListingsGrid />
      </main>
      <Footer />
    </>
  );
}
