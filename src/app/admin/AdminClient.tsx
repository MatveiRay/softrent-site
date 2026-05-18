"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type AdminListing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  country: string;
  category: "TROPICAL" | "MOUNTAIN";
  price: number;
  guests: number;
  isPublished: boolean;
};

type QueueBooking = {
  id: string;
  publicId: string;
  contactName: string;
  contactEmail: string;
  checkIn: string;
  checkOut: string;
  total: number;
  listing: {
    title: string;
    slug: string;
    location: string;
    country: string;
  };
};

type AvailabilityBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  listing: {
    title: string;
    slug: string;
  };
};

type IngestRecord = {
  id: string;
  source: string;
  status: string;
  message?: string | null;
  createdAt: string;
};

export default function AdminClient() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [bookings, setBookings] = useState<QueueBooking[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [records, setRecords] = useState<IngestRecord[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    location: "",
    country: "",
    category: "TROPICAL" as "TROPICAL" | "MOUNTAIN",
    price: 500,
    guests: 2,
  });
  const [blockForm, setBlockForm] = useState({
    listingId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const publishedCount = useMemo(
    () => listings.filter((listing) => listing.isPublished).length,
    [listings]
  );

  async function refresh() {
    const [listingRes, bookingRes, blockRes, ingestRes] = await Promise.all([
      fetch("/api/admin/listings"),
      fetch("/api/admin/bookings"),
      fetch("/api/admin/availability"),
      fetch("/api/admin/ingest"),
    ]);
    const [listingPayload, bookingPayload, blockPayload, ingestPayload] =
      await Promise.all([
        listingRes.json(),
        bookingRes.json(),
        blockRes.json(),
        ingestRes.json(),
      ]);
    setListings(listingPayload.listings ?? []);
    setBookings(bookingPayload.bookings ?? []);
    setBlocks(blockPayload.blocks ?? []);
    setRecords(ingestPayload.records ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createListing() {
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      slug: "",
      title: "",
      description: "",
      location: "",
      country: "",
      category: "TROPICAL",
      price: 500,
      guests: 2,
    });
    setNotice("Объект создан");
    await refresh();
  }

  async function togglePublish(listing: AdminListing) {
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: listing.id,
        isPublished: !listing.isPublished,
      }),
    });
    await refresh();
  }

  async function editListing(listing: AdminListing) {
    const title = window.prompt("Название", listing.title);
    if (title === null) return;
    const priceInput = window.prompt("Цена за ночь", String(listing.price));
    if (priceInput === null) return;
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) {
      setNotice("Некорректная цена");
      return;
    }
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: listing.id,
        title,
        price,
      }),
    });
    setNotice("Объект обновлён");
    await refresh();
  }

  async function reviewBooking(id: string, status: "CONFIRMED" | "CANCELED") {
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = await res.json();
    setNotice(res.ok ? "Статус обновлён" : payload.error ?? "Ошибка");
    await refresh();
  }

  async function createBlock() {
    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    const payload = await res.json();
    setNotice(res.ok ? "Даты закрыты" : payload.error ?? "Ошибка");
    if (res.ok) {
      setBlockForm({
        listingId: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
      await refresh();
    }
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <>
      <Nav />
      <main className="pt-28 pb-24 min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-12">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#d4b896] mb-3">
                Admin
              </p>
              <h1 className="font-serif text-4xl md:text-6xl">Operations</h1>
            </div>
            <div className="text-sm text-white/60">
              {publishedCount} опубликовано · {bookings.length} в очереди
            </div>
          </header>

          {notice && (
            <div className="rounded-2xl border border-[#d4b896]/25 bg-[#d4b896]/10 px-4 py-3 text-sm text-[#f1dec7]">
              {notice}
            </div>
          )}

          <section className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-serif text-2xl mb-4">Объекты</h2>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-white/10 p-4"
                  >
                    <div>
                      <Link href={`/listing/${listing.slug}`} className="font-medium">
                        {listing.title}
                      </Link>
                      <p className="text-sm text-white/55">
                        {listing.location}, {listing.country} · ${listing.price}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editListing(listing)}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(listing)}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em]"
                      >
                        {listing.isPublished ? "Снять" : "Опубликовать"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <h2 className="font-serif text-2xl">Новый объект</h2>
              {[
                ["slug", "Slug"],
                ["title", "Название"],
                ["description", "Описание"],
                ["location", "Локация"],
                ["country", "Страна"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1">
                    {label}
                  </span>
                  <input
                    value={String(form[key as keyof typeof form])}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  />
                </label>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category: e.target.value as "TROPICAL" | "MOUNTAIN",
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <option value="TROPICAL">Tropical</option>
                  <option value="MOUNTAIN">Mountain</option>
                </select>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      price: Number(e.target.value),
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
                <input
                  type="number"
                  value={form.guests}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      guests: Number(e.target.value),
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
              <button
                type="button"
                onClick={createListing}
                className="w-full rounded-full bg-[#d4b896] px-5 py-3 text-sm font-semibold text-black"
              >
                Создать
              </button>
            </div>
          </section>

          <section className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-serif text-2xl mb-4">Очередь бронирований</h2>
              <div className="space-y-3">
                {bookings.length === 0 && (
                  <p className="text-sm text-white/55">Очередь пуста.</p>
                )}
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-white/10 p-4 space-y-3"
                  >
                    <div>
                      <p className="font-medium">{booking.listing.title}</p>
                      <p className="text-sm text-white/55">
                        {booking.publicId} · {booking.contactName} ·{" "}
                        {booking.checkIn.slice(0, 10)} —{" "}
                        {booking.checkOut.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => reviewBooking(booking.id, "CONFIRMED")}
                        className="rounded-full bg-[#d4b896] px-4 py-2 text-xs font-semibold text-black"
                      >
                        Подтвердить
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewBooking(booking.id, "CANCELED")}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-serif text-2xl mb-4">Закрытые даты</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <select
                  value={blockForm.listingId}
                  onChange={(e) =>
                    setBlockForm((current) => ({
                      ...current,
                      listingId: e.target.value,
                    }))
                  }
                  className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <option value="">Выбрать объект</option>
                  {listings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={blockForm.startDate}
                  onChange={(e) =>
                    setBlockForm((current) => ({
                      ...current,
                      startDate: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
                <input
                  type="date"
                  value={blockForm.endDate}
                  onChange={(e) =>
                    setBlockForm((current) => ({
                      ...current,
                      endDate: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
                <input
                  value={blockForm.reason}
                  onChange={(e) =>
                    setBlockForm((current) => ({
                      ...current,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Причина"
                  className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
              <button
                type="button"
                onClick={createBlock}
                className="mb-4 rounded-full bg-[#d4b896] px-4 py-2 text-xs font-semibold text-black"
              >
                Закрыть даты
              </button>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-3"
                  >
                    <div className="text-sm">
                      <p>{block.listing.title}</p>
                      <p className="text-white/55">
                        {block.startDate.slice(0, 10)} —{" "}
                        {block.endDate.slice(0, 10)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className="text-xs text-white/60"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-serif text-2xl mb-4">Ingestion history</h2>
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="grid md:grid-cols-[140px_180px_1fr] gap-2 rounded-2xl border border-white/10 p-3 text-sm"
                >
                  <span>{record.source}</span>
                  <span className="text-white/60">{record.status}</span>
                  <span className="text-white/60">{record.message || "—"}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
