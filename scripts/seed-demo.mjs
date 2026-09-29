// Demo seed: generates placeholder images, then loads owners into D1 + images into R2.
// Run: npm run seed:demo            (local bindings)
//      npm run seed:demo -- --remote (real Cloudflare account)
import { deflateSync } from "zlib";
import { randomBytes, scryptSync } from "crypto";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const ROOT = process.cwd();
const UPLOADS = path.join(ROOT, "data", "uploads");
const OWNERS_FILE = path.join(ROOT, "data", "owners.json");
const WRANGLER = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const REMOTE = process.argv.includes("--remote");
const SCOPE = REMOTE ? "--remote" : "--local";
const D1 = "pg-owner-site";
const BUCKET = "pg-owner-media";
const DEMO_PASSWORD = "demo1234";

function wrangler(args) {
  execFileSync(process.execPath, [WRANGLER, ...args], { stdio: "inherit", cwd: ROOT });
}

const CRC = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// ponytail: flat gradient + blocks, not real photos. Swap in real uploads to make it pretty.
function placeholder(w, h, [r1, g1, b1], [r2, g2, b2], seed) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0;
    const t = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = (x / (w - 1) * 0.35 + t * 0.65) % 1;
      // soft window-grid pattern so slides look distinct
      const grid = (x % (w / 6) < 3 || y % (h / 4) < 3 ? 0.1 : 0) + ((x + y) % 97 < 40 ? 0.04 : 0);
      const k = Math.min(1, u + grid + ((seed * 37) % 11) / 100);
      raw[o++] = Math.round(r1 + (r2 - r1) * k);
      raw[o++] = Math.round(g1 + (g2 - g1) * k);
      raw[o++] = Math.round(b1 + (b2 - b1) * k);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade([r, g, b], k) {
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const NOW = "2026-09-29T10:00:00.000Z";
const OWNERS = [
  {
    id: "own-demo-1",
    name: "Sunrise Boys Hostel",
    email: "demo@pgowner.test",
    password: DEMO_PASSWORD,
    slug: "sunrise-boys-hostel",
    phone: "+919000000001",
    whatsapp: "+919000000001",
    website: "https://example.com/sunrise",
    tagline: "Boys PG in Jaipur with home-style meals and a study-first culture",
    about:
      "Sunrise Boys Hostel is a demo listing. Triple, double and single sharing rooms near Vaishali Nagar with 3 meals a day, high-speed WiFi, laundry and 24x7 power backup.",
    city: "Jaipur",
    address: "12, Vaishali Nagar Extension, Jaipur, Rajasthan 302021",
    brandName: "Sunrise",
    brandColor: "#d97706",
    branches: [
      {
        id: "br-demo-1",
        name: "Sunrise Boys Hostel — Vaishali Nagar",
        gender: "male",
        city: "Jaipur",
        locality: "Vaishali Nagar",
        address: "12, Vaishali Nagar Extension, Jaipur, Rajasthan 302021",
        description:
          "Demo branch. Quiet residential lane, 10 minutes from MMI hospital. Rooms with study table, wardrobe and attached bath.",
        amenities: ["WiFi", "Food (3 meals)", "Laundry", "Hot Water", "Power Backup", "CCTV", "Housekeeping", "Study Table"],
        highlights: ["Boys only", "Study table in every room", "3 home-style meals", "Power backup 24/7", "CCTV monitored"],
        pricing: [
          { type: "Triple Sharing", price: 6500, meals: "3 meals" },
          { type: "Double Sharing", price: 7500, meals: "3 meals" },
          { type: "AC Double Sharing", price: 9500, meals: "3 meals" },
          { type: "AC Single", price: 11500, meals: "3 meals" },
        ],
        lat: 26.9124,
        lng: 75.7873,
        phone: "+919000000001",
        whatsapp: "+919000000001",
      },
      {
        id: "br-demo-2",
        name: "Sunrise Boys Hostel — Malviya Nagar",
        gender: "male",
        city: "Jaipur",
        locality: "Malviya Nagar",
        address: "45, Gopalbari Circle, Malviya Nagar, Jaipur, Rajasthan 302017",
        description:
          "Demo branch. Spacious rooms for working professionals and students, with covered parking and a rooftop study deck.",
        amenities: ["WiFi", "Food (2 meals)", "Parking", "Laundry", "Power Backup", "Gym", "CCTV"],
        highlights: ["Covered parking", "Rooftop study deck", "Monthly housekeeping", "Gym access"],
        pricing: [
          { type: "Triple Sharing", price: 7000, meals: "2 meals" },
          { type: "Double Sharing", price: 8200, meals: "2 meals" },
          { type: "AC Single", price: 12000, meals: "2 meals" },
        ],
        lat: 26.8544,
        lng: 75.8136,
        phone: "+919000000002",
        whatsapp: "+919000000002",
      },
    ],
  },
  {
    id: "own-demo-2",
    name: "Green Nest Girls PG",
    email: "girls@pgowner.test",
    password: DEMO_PASSWORD,
    slug: "green-nest-girls-pg",
    phone: "+919000000003",
    whatsapp: "+919000000003",
    tagline: "Girls-only PG in Indore with a full-time warden and home food",
    about:
      "Green Nest Girls PG is a demo listing. Safe gated campus in Vijay Nagar with 24x7 warden, biometric entry, three meals a day and laundry included.",
    city: "Indore",
    address: "78, Vijay Nagar, Indore, Madhya Pradesh 452010",
    brandName: "Green Nest",
    brandColor: "#059669",
    branches: [
      {
        id: "br-demo-3",
        name: "Green Nest Girls PG — Vijay Nagar",
        gender: "female",
        city: "Indore",
        locality: "Vijay Nagar",
        address: "78, Vijay Nagar, Indore, Madhya Pradesh 452010",
        description:
          "Demo branch. Gated girls-only campus with warden on site, biometric entry and separate study and dining halls.",
        amenities: ["WiFi", "Food (3 meals)", "Warden", "Biometric Entry", "Laundry", "Hot Water", "CCTV", "Power Backup"],
        highlights: ["24x7 female warden", "Biometric entry", "Separate study hall", "Home-style meals"],
        pricing: [
          { type: "Triple Sharing", price: 7800, meals: "3 meals" },
          { type: "Double Sharing", price: 9000, meals: "3 meals" },
          { type: "AC Double Sharing", price: 11000, meals: "3 meals" },
        ],
        lat: 22.7533,
        lng: 75.8937,
        phone: "+919000000003",
        whatsapp: "+919000000003",
      },
      {
        id: "br-demo-4",
        name: "Green Nest Girls PG — Rau",
        gender: "female",
        city: "Indore",
        locality: "Rau",
        address: "9, Rau Industrial Area Road, Indore, Madhya Pradesh 452010",
        description:
          "Demo branch. Small 24-bed facility close to the Rau industrial belt, popular with working women.",
        amenities: ["WiFi", "Food (3 meals)", "Warden", "CCTV", "Laundry", "Power Backup"],
        highlights: ["24 beds only", "Close to Rau MIDC", "In-house laundry", "Family visiting hours"],
        pricing: [
          { type: "Triple Sharing", price: 6800, meals: "3 meals" },
          { type: "Double Sharing", price: 8200, meals: "3 meals" },
        ],
        lat: 22.6522,
        lng: 75.8121,
        phone: "+919000000004",
        whatsapp: "+919000000004",
      },
    ],
  },
  {
    id: "own-demo-3",
    name: "Scholars Co-ed Stay",
    email: "kota@pgowner.test",
    password: DEMO_PASSWORD,
    slug: "scholars-co-ed-stay",
    phone: "+919000000005",
    whatsapp: "+919000000005",
    tagline: "Co-ed PG in Kota built for IIT/NEET aspirants",
    about:
      "Scholars Co-ed Stay is a demo listing. Ten minutes from coaching hubs, with a strict study schedule, doubt-solving room and monthly parent reporting.",
    city: "Kota",
    address: "31, Talwandi, Kota, Rajasthan 325002",
    brandName: "Scholars",
    brandColor: "#2563eb",
    branches: [
      {
        id: "br-demo-5",
        name: "Scholars Co-ed Stay — Talwandi",
        gender: "unisex",
        city: "Kota",
        locality: "Talwandi",
        address: "31, Talwandi, Kota, Rajasthan 325002",
        description:
          "Demo branch. Fixed study hours, dedicated doubt-solving room, and separate floors for boys and girls.",
        amenities: ["WiFi", "Food (3 meals)", "Study Room", "Laundry", "Power Backup", "CCTV", "Hot Water", "Housekeeping"],
        highlights: ["Fixed study schedule", "Doubt-solving room", "Separate floors", "Monthly parent report", "Mess on rent"],
        pricing: [
          { type: "Triple Sharing", price: 7200, meals: "3 meals" },
          { type: "Double Sharing", price: 8600, meals: "3 meals" },
          { type: "AC Double Sharing", price: 10500, meals: "3 meals" },
        ],
        lat: 25.2138,
        lng: 75.8648,
        phone: "+919000000005",
        whatsapp: "+919000000005",
      },
    ],
  },
];

fs.mkdirSync(UPLOADS, { recursive: true });
for (const f of fs.readdirSync(UPLOADS)) {
  if (f !== ".gitkeep") fs.rmSync(path.join(UPLOADS, f));
}

const owners = OWNERS.map((o, oi) => {
  const base = hexToRgb(o.brandColor);
  const images = [];
  const files = [];
  for (let i = 0; i < 6; i++) {
    const name = `demo-${o.id}-${i}.png`;
    const file = path.join(UPLOADS, name);
    fs.writeFileSync(file, placeholder(960, 640, shade(base, 0.55), shade(base, 1.25), oi * 6 + i));
    images.push(`/api/uploads/${name}`);
    files.push(file);
  }
  const logo = `demo-${o.id}-logo.png`;
  const logoFile = path.join(UPLOADS, logo);
  fs.writeFileSync(logoFile, placeholder(320, 320, shade(base, 0.7), shade(base, 1.3), 99));
  files.push(logoFile);
  return {
    owner: {
      id: o.id,
      name: o.name,
      email: o.email,
      passwordHash: hashPassword(o.password),
      slug: o.slug,
      phone: o.phone,
      whatsapp: o.whatsapp,
      website: o.website,
      tagline: o.tagline,
      about: o.about,
      city: o.city,
      address: o.address,
      brandName: o.brandName,
      brandColor: o.brandColor,
      logo: `/api/uploads/${logo}`,
      carousel: images,
      branches: o.branches.map((b, bi) => ({
        ...b,
        images: images.slice(0, 4 + (bi % 2)),
        videos: [],
        mapsUrl: "",
        createdAt: NOW,
        updatedAt: NOW,
      })),
      createdAt: NOW,
      updatedAt: NOW,
    },
    files,
  };
});

const sql = [
  "DELETE FROM owners;",
  ...owners.map(({ owner }) => {
    const json = JSON.stringify(owner).replace(/'/g, "''");
    return `INSERT INTO owners (id, email, slug, json) VALUES ('${owner.id}', '${owner.email}', '${owner.slug}', '${json}') ON CONFLICT(id) DO UPDATE SET email = excluded.email, slug = excluded.slug, json = excluded.json;`;
  }),
].join("\n");

const sqlFile = path.join(os.tmpdir(), "pg-owner-seed.sql");
fs.writeFileSync(sqlFile, sql);
fs.writeFileSync(OWNERS_FILE, JSON.stringify(owners.map((o) => o.owner), null, 2) + "\n");

wrangler(["d1", "execute", D1, SCOPE, "--file", sqlFile]);
for (const { files } of owners) {
  for (const file of files) {
    wrangler(["r2", "object", "put", `${BUCKET}/${path.basename(file)}`, "--file", file, SCOPE]);
  }
}

const branches = owners.reduce((n, o) => n + o.owner.branches.length, 0);
console.log(
  `Seeded ${owners.length} demo owners, ${branches} branches into D1(${D1}) + ${owners.reduce((n, o) => n + o.files.length, 0)} images in R2(${BUCKET}) [${REMOTE ? "remote" : "local"}]`
);
console.log(`Login: ${owners[0].owner.email} / ${DEMO_PASSWORD}`);

