export type BeritaAcaraCategory =
  | "Cuaca Ekstrem BMKG"
  | "Siaga Darurat Bencana"
  | "Banjir & Hidrometeorologi"
  | "Longsor & Infrastruktur";

export interface BeritaAcaraItem {
  id: string;
  docNumber: string;
  category: BeritaAcaraCategory;
  title: string;
  summary: string;
  region: string;
  adm2: string;
  sourceName: string;
  sourceDomainUrl: string;
  articleUrl: string;
  publishedAt: string;
  isLiveFeed?: boolean;
}

export const INITIAL_BERITA_ACARA_JABAR: BeritaAcaraItem[] = [
  {
    id: "ba-jabar-01",
    docNumber: "BA-BMKG/32/XI/001",
    category: "Cuaca Ekstrem BMKG",
    title:
      "Prakiraan Cuaca Sepekan: Curah Hujan Tinggi & Potensi Hujan Lebat Masih Berlanjut di Jawa Barat",
    summary:
      "BMKG mencatat pertumbuhan awan konvektif intensif di wilayah Jawa Barat dengan potensi hujan sedang hingga lebat disertai kilat/petir dan angin kencang.",
    region: "Seluruh Provinsi Jawa Barat (Kode 32)",
    adm2: "32.73",
    sourceName: "BMKG Resmi",
    sourceDomainUrl: "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32",
    articleUrl:
      "https://news.google.com/rss/articles/CBMiswJBVV95cUxQa3Rhdm94ZHd1aUtub1h6Ym9vZTdpWnhuc2txQWxoNjlJU1pMUjZsaXFGUVVpaXpFR042Zi1IdmNSTW1oT2thUXBrb3pRWnJMMnd0UTJqNEtMUGNpYnYtS25KTlNNVlZIaE9ZR295bERKNjVBaFdUQXpGeHdELXpjbUFPNkQtYl91ZEpaMlV6a3BGX0JDUC1ESlBKS3lfU2J0c1M3MThBZUVva2lPelhEaEM3U2w0ZGpRSzFCTzJSdXg4aGxFMnJWZ3hpWFBZY05LN0ZTMnItcWNqdUlmVTdDVDg3SEJVdEtRNjRZNmdXN1dHVjVnLV9EVnNyMDhNM0ZFQ2lXS3V4RWtsR0YyakN1ZHZ2RHhtQU1iWlp3UmVpYnN6TWppTGlOQ3BCbzlSclVRVW9n?oc=5",
    publishedAt: "24 November 2026 • Pembaruan BMKG",
  },
  {
    id: "ba-jabar-02",
    docNumber: "BA-PEMPROV/32/XI/002",
    category: "Siaga Darurat Bencana",
    title:
      "Pemprov Jabar Tetapkan Status Siaga Darurat Bencana Hidrometeorologi di Seluruh 27 Kota & Kabupaten",
    summary:
      "Pemerintah Provinsi Jawa Barat menetapkan status Siaga Darurat Bencana menghadapi puncak musim hujan, banjir, tanah longsor, dan cuaca ekstrem di 27 Kabupaten/Kota.",
    region: "27 Kota & Kabupaten Jawa Barat",
    adm2: "32.73",
    sourceName: "Pemprov Jabar (jabarprov.go.id)",
    sourceDomainUrl: "https://jabarprov.go.id",
    articleUrl:
      "https://news.google.com/search?q=Pemprov+Jabar+Tetapkan+Status+Siaga+Darurat+Bencana+Jawa+Barat&hl=id&gl=ID&ceid=ID:id",
    publishedAt: "24 November 2026 • Portal Resmi Jabar",
  },
  {
    id: "ba-jabar-03",
    docNumber: "BA-BNPB/32/XI/003",
    category: "Banjir & Hidrometeorologi",
    title:
      "BNPB Catat Longsor, Banjir, dan Tanggul Meluap Akibat Hujan Lebat; Warga Diimbau Pantau Peringatan Dini",
    summary:
      "Laporan situasi BNPB merangkum kejadian hidrometeorologi akibat hujan intensitas tinggi serta langkah penanganan cepat bersama BPBD daerah.",
    region: "Cekungan Bandung & Jawa Barat",
    adm2: "32.04",
    sourceName: "BNPB (bnpb.go.id)",
    sourceDomainUrl: "https://bnpb.go.id",
    articleUrl:
      "https://news.google.com/search?q=BNPB+Catat+Longsor+Banjir+Bandang+Hujan+Lebat+Jawa+Barat&hl=id&gl=ID&ceid=ID:id",
    publishedAt: "24 November 2026 • Pusdalops BNPB",
  },
  {
    id: "ba-jabar-04",
    docNumber: "BA-PU/32.07/XI/004",
    category: "Longsor & Infrastruktur",
    title:
      "KemenPU Tangani Longsor di Jalan Nasional Ciamis–Banjar, Akses Lintas Priangan Timur Kembali Aman Dilalui",
    summary:
      "Penanganan material longsor tebing akibat hujan deras di jalur nasional Kabupaten Ciamis menuju Kota Banjar telah selesai dibersihkan.",
    region: "Kab. Ciamis (32.07) & Kota Banjar (32.79)",
    adm2: "32.07",
    sourceName: "detikNews",
    sourceDomainUrl: "https://news.detik.com",
    articleUrl:
      "https://news.google.com/search?q=KemenPU+Tangani+Longsor+di+Jalan+Nasional+Ciamis&hl=id&gl=ID&ceid=ID:id",
    publishedAt: "24 November 2026 • Priangan Timur",
  },
  {
    id: "ba-jabar-05",
    docNumber: "BA-BPBD/32.15/XI/005",
    category: "Banjir & Hidrometeorologi",
    title:
      "BPBD Karawang Tingkatkan Kewaspadaan Ancaman Banjir Luapan Sungai Citarum & Cibeet pada Musim Hujan",
    summary:
      "BPBD Kabupaten Karawang menyiagakan personel dan perahu karet di kecamatan rawan genangan sepanjang DAS Citarum dan Cibeet.",
    region: "Kab. Karawang (32.15)",
    adm2: "32.15",
    sourceName: "ANTARA News",
    sourceDomainUrl: "https://megapolitan.antaranews.com",
    articleUrl:
      "https://news.google.com/search?q=BPBD+Karawang+mulai+waspadai+ancaman+banjir+dan+longsor&hl=id&gl=ID&ceid=ID:id",
    publishedAt: "24 November 2026 • Pantura Jabar",
  },
  {
    id: "ba-jabar-06",
    docNumber: "BA-BMKG/32.02/XI/006",
    category: "Cuaca Ekstrem BMKG",
    title:
      "Peringatan Cuaca Sukabumi & Priangan Barat: Pagi Berawan, Siang–Sore Waspada Hujan Petir",
    summary:
      "BMKG mengingatkan potensi hujan sedang–lebat di kecamatan wilayah Kabupaten dan Kota Sukabumi serta Cianjur pada siang hingga malam hari.",
    region: "Kab. Sukabumi (32.02) & Kota Sukabumi (32.72)",
    adm2: "32.02",
    sourceName: "Radar Sukabumi / Katadata",
    sourceDomainUrl: "https://radarsukabumi.com",
    articleUrl:
      "https://news.google.com/rss/articles/CBMitAFBVV95cUxNT1BWR0U4RG4zTkdZNnVTaGduZVlpNDNCdEpoM3NTR05ZT1hCZ2x2clNjV2oxMWw0U3RfVDBQNU01VGFvVkVFRlpOcDFwYVRrWF9hMXhzMmpUaThOdklLaG93czEwY2t0ODNVSHI3VW1XMHBFR0VRaXgwZXg3UlE1QS1Ua1U1SW9VWGtoMEttWUxxQXU0SDNFX0RMWFljaDhnbkR3QnFsSzRiQjBnMm43cERCRDQ?oc=5",
    publishedAt: "24 November 2026 • Priangan Barat",
  },
];
