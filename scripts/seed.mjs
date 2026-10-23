// Dev seed: 3 fake sellers + 24 listings with generated photos.
//   node --env-file=.env.local scripts/seed.mjs          create
//   node --env-file=.env.local scripts/seed.mjs --clean  remove everything it created
// Seed accounts are identified by the @seed.2ndu.test email domain, so --clean only touches them.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const DOMAIN = "seed.2ndu.test";
const BUCKET = "listing-images";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SELLERS = [
  { key: "mali", name: "Mali S.", studentId: "6401001" },
  { key: "ken", name: "Ken P.", studentId: "6402002" },
  { key: "ploy", name: "Ploy R.", studentId: "6403003" },
];

const COLORS = {
  appliances: ["#1f6f5c", "#0d3b30"],
  furniture: ["#8a6a3f", "#4a3a20"],
  electronics: ["#2f5d9e", "#142c52"],
  books: ["#9e4a4a", "#4f2020"],
  clothing: ["#7a4a9e", "#3a2050"],
  bikes: ["#c2762b", "#6b3d10"],
  other: ["#5f6b6b", "#2b3333"],
};

// [seller, title, categories, price, original, description, location, fulfillment, note, status]
const L = [
  ["mali", "Samsung fridge 7 cu.ft.", ["appliances"], 3500, 6900, "Works perfectly, quiet. Selling because I'm graduating. Freezer compartment included.", "Lake Rangsit apartments, building B", "both", "Delivery within Rangsit, 100 THB fee", "available"],
  ["ken", "Rice cooker 1.8L", ["appliances"], 450, 890, "Used one semester. Keep-warm function works. Inner pot has no scratches.", "RSU dorm 3", "pickup", "", "available"],
  ["ploy", "Mini air fryer", ["appliances"], 900, 1590, "4L basket, barely used. Comes with the recipe booklet.", "Rangsit Soi 6", "both", "Can deliver after 5pm", "available"],
  ["mali", "Standing fan 16 inch", ["appliances"], 350, null, "Three speeds and oscillation. A little dusty but runs well.", "Lake Rangsit apartments, building B", "pickup", "", "sold"],
  ["ken", "Study desk with shelf", ["furniture"], 1200, 2400, "120 cm wide, sturdy. Small mark on one corner. Disassembles for transport.", "Rangsit Soi 6", "pickup", "", "available"],
  ["ploy", "Ergonomic office chair", ["furniture"], 1500, 3200, "Adjustable height and armrests, mesh back. Very comfortable for long study sessions.", "RSU dorm 1", "both", "Delivery inside campus only", "available"],
  ["mali", "Bookshelf, 4 tiers", ["furniture", "books"], 700, null, "White, 160 cm tall. Holds a lot of textbooks.", "Lake Rangsit apartments, building B", "pickup", "", "available"],
  ["ken", "Single mattress topper", ["furniture"], 600, 1200, "5 cm memory foam, used for 4 months. Always had a cover on.", "RSU dorm 3", "both", "", "available"],
  ["ploy", "Laptop stand, aluminium", ["electronics"], 250, 590, "Foldable, fits up to 15.6 inch. No scratches.", "RSU dorm 1", "both", "", "available"],
  ["mali", "Wireless earbuds", ["electronics"], 800, 1990, "Good battery, case included. Selling because I upgraded.", "Lake Rangsit apartments, building B", "both", "Can meet on campus", "available"],
  ["ken", "27 inch monitor, 75Hz", ["electronics"], 2800, 5500, "Full HD IPS. HDMI cable included. No dead pixels.", "Rangsit Soi 6", "pickup", "", "available"],
  ["ploy", "Scientific calculator Casio fx-991", ["electronics", "books"], 300, 650, "Works like new, cover included. Allowed in most exams.", "RSU dorm 1", "both", "", "available"],
  ["mali", "Intro to Economics textbook", ["books"], 350, 1100, "Latest edition, light highlighting in first chapters.", "RSU library lobby", "pickup", "", "available"],
  ["ken", "Calculus textbook + solutions", ["books"], 400, 1250, "Both books together. No missing pages.", "RSU dorm 3", "both", "", "available"],
  ["ploy", "Anatomy atlas", ["books"], 650, 1800, "Colour plates, clean. Great for first-year students.", "RSU dorm 1", "pickup", "", "sold"],
  ["mali", "Graduation gown, size M", ["clothing"], 500, null, "Cleaned and ironed, hood included. Fits about 160-170 cm.", "Lake Rangsit apartments, building B", "both", "", "available"],
  ["ken", "Denim jacket", ["clothing"], 350, 990, "Size L, worn a few times. Slightly oversized fit.", "RSU dorm 3", "both", "", "available"],
  ["ploy", "Sports shoes, size 40", ["clothing"], 600, 1700, "Running shoes with plenty of tread left. Washed.", "RSU dorm 1", "both", "", "available"],
  ["mali", "Student uniform set", ["clothing"], 400, null, "Shirt and skirt, size S. Barely worn.", "Lake Rangsit apartments, building B", "pickup", "", "available"],
  ["ken", "City bike with basket", ["bikes"], 2200, 4500, "Single speed, new tyres last month. Lock included.", "Rangsit Soi 6", "pickup", "", "available"],
  ["ploy", "Folding bike 20 inch", ["bikes"], 3800, 7900, "Folds in seconds, fits in a dorm room. Smooth ride.", "RSU dorm 1", "both", "Delivery on campus", "available"],
  ["mali", "Bike helmet, adjustable", ["bikes"], 200, 450, "Used lightly, no cracks. Adjustable dial at the back.", "Lake Rangsit apartments, building B", "both", "", "available"],
  ["ken", "Desk lamp with USB port", ["other", "electronics"], 180, 390, "Three brightness levels, flexible neck.", "RSU dorm 3", "both", "", "available"],
  ["ploy", "Storage boxes, set of 3", ["all"], 150, null, "Stackable with lids. Handy for moving out.", "RSU dorm 1", "pickup", "", "available"],
];

// Simple line icons, drawn around (0,0) within about +-130px.
const ICONS = {
  appliances: '<rect x="-70" y="-130" width="140" height="260" rx="18"/><path d="M-70 -30H70M45 -100V-60M45 -10V40"/>',
  furniture: '<rect x="-55" y="-130" width="110" height="140" rx="16"/><rect x="-85" y="10" width="170" height="34" rx="12"/><path d="M-60 44L-70 130M60 44L70 130"/>',
  electronics: '<rect x="-110" y="-100" width="220" height="150" rx="14"/><rect x="-150" y="66" width="300" height="28" rx="14"/>',
  books: '<rect x="-110" y="-115" width="220" height="55" rx="8"/><rect x="-90" y="-50" width="200" height="55" rx="8"/><rect x="-120" y="15" width="230" height="55" rx="8"/><path d="M-80 -88H-30M-60 -22H-10M-90 42H-40"/>',
  clothing: '<path d="M-50 -110L-120 -60L-85 -15L-60 -35V110H60V-35L85 -15L120 -60L50 -110Q0 -70 -50 -110Z"/>',
  bikes: '<circle cx="-90" cy="50" r="60"/><circle cx="90" cy="50" r="60"/><path d="M-90 50L-20 50L-50 -40H20M-20 50L50 -50L90 50M50 -50L40 -80H70"/>',
  other: '<rect x="-110" y="-60" width="220" height="170" rx="12"/><rect x="-130" y="-110" width="260" height="50" rx="12"/><path d="M-30 -5H30"/>',
};

function listingSvg(title, category) {
  const [a, b] = COLORS[category] ?? COLORS.other;
  const icon = ICONS[category] ?? ICONS.other;
  const esc = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <circle cx="400" cy="250" r="190" fill="#fff" fill-opacity=".1"/>
    <g transform="translate(400 250)" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
    <text x="400" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#fff">${esc.length > 30 ? esc.slice(0, 29) + "…" : esc}</text>
  </svg>`;
}

async function listSeedUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.filter((u) => u.email?.endsWith(`@${DOMAIN}`));
}

async function clean() {
  for (const u of await listSeedUsers()) {
    const { data: files } = await supabase.storage.from(BUCKET).list(u.id, { limit: 1000 });
    if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f) => `${u.id}/${f.name}`));
    const { error } = await supabase.auth.admin.deleteUser(u.id); // cascades to profile + listings
    if (error) throw error;
    console.log("removed", u.email);
  }
}

async function seed() {
  if ((await listSeedUsers()).length) throw new Error("Seed data already exists; run with --clean first.");

  const ids = {};
  for (const s of SELLERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${s.key}@${DOMAIN}`,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
    if (error) throw error;
    ids[s.key] = data.user.id;
    const { error: pe } = await supabase
      .from("profiles")
      .update({ display_name: s.name, is_seller: true, student_id: s.studentId, school_email: `${s.key}@rsu.ac.th` })
      .eq("id", data.user.id);
    if (pe) throw pe;
  }

  const day = 24 * 60 * 60 * 1000;
  for (const [i, row] of L.entries()) {
    const [seller, title, categories, price, original, description, location, fulfillment, note, status] = row;
    const jpeg = await sharp(Buffer.from(listingSvg(title, categories[0]))).jpeg({ quality: 82 }).toBuffer();
    const path = `${ids[seller]}/seed-${i + 1}.jpg`;
    const up = await supabase.storage.from(BUCKET).upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
    if (up.error) throw up.error;
    const created = new Date(Date.now() - ((L.length - i) / L.length) * 14 * day).toISOString();
    const { error } = await supabase.from("listings").insert({
      seller_id: ids[seller],
      title,
      description,
      price,
      original_price: original,
      categories,
      images: [supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl],
      location_text: location,
      fulfillment,
      delivery_note: note,
      status,
      created_at: created,
    });
    if (error) throw error;
  }
  console.log(`Created ${SELLERS.length} sellers and ${L.length} listings.`);
}

await (process.argv.includes("--clean") ? clean() : seed());
