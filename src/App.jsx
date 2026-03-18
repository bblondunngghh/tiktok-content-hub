import { useState, useEffect, useRef } from "react";
import { Camera, Copy, Check, ChevronRight, Sparkles, Calendar, Hash, Type, Film, MessageCircle, BarChart3, Zap, RefreshCw, Clock, Target, TrendingUp, CheckCircle2, ArrowRight, Star, Home, BookOpen, Lightbulb, Link, Loader2, Video, ListOrdered, Send, Settings, X, Eye, EyeOff, CheckCircle, Trash2, CalendarPlus, FolderOpen } from "lucide-react";

// ─── DATA ───────────────────────────────────────────────────────────
const HOOKS = {
  curiosity: [
    "This $85K home has something no $300K home has...",
    "Wait until you see this kitchen for under $100K...",
    "Nobody told me manufactured homes could look like THIS",
    "I've sold 200 homes and this one still shocked me...",
    "You won't believe what $1,200/month gets you in 2026...",
    "POV: You just found your dream home for half the price",
    "This is what people don't show you about manufactured homes...",
    "The home everyone's been asking about is finally here...",
    "I wasn't going to post this one but you NEED to see it...",
    "This floor plan is the reason we can't keep these in stock...",
  ],
  controversy: [
    "Stop calling manufactured homes 'trailers.' Watch this.",
    "Your realtor doesn't want you to see this...",
    "Why are people paying $400K when THIS exists for $90K?",
    "The biggest lie in real estate right now...",
    "Everyone said I was crazy for selling manufactured homes. Then they saw my sales numbers.",
    "Hot take: manufactured homes are better built than most new construction",
    "Renting is NOT cheaper than owning. Let me prove it.",
    "The housing market doesn't want you to know this option exists...",
    "I'm tired of the stigma. Come look at this home and tell me it's not beautiful.",
    "Your landlord is praying you never see this video...",
  ],
  emotional: [
    "This family just saw their first home for the very first time...",
    "She cried when she walked in. I almost did too.",
    "From renting to owning — this is what $1,200/month gets you",
    "He surprised his wife with their first home today...",
    "Single mom of 3. First-time homeowner. This is her reaction.",
    "They said they'd never afford a home. Then they called me.",
    "This is the moment that makes my job worth it every single day.",
    "When your client calls you crying happy tears after closing...",
    "20 years of renting ends TODAY. Welcome home.",
    "This veteran just got the keys to his new home...",
  ],
  educational: [
    "3 things to know before buying a manufactured home",
    "The #1 mistake first-time homebuyers make",
    "Here's what $75K actually buys you in 2026",
    "Manufactured home vs modular home — here's the real difference",
    "5 questions to ask before you buy ANY home",
    "How to get approved for a manufactured home loan in 2026",
    "The truth about manufactured home values (they DO appreciate)",
    "What your credit score actually needs to be to buy a home",
    "Land-home packages explained in 60 seconds",
    "FHA, VA, USDA — which loan is right for you?",
  ],
};

const CAPTION_TEMPLATES = [
  {
    name: "The Storyteller",
    icon: "BookOpen",
    template: "Everyone told [PERSON] they'd never own a home. [MONTHLY_PAYMENT]/month later, they're proving everyone wrong. This [SQFT] sq ft [MODEL] has [FEATURE_1], [FEATURE_2], and [FEATURE_3]. The best part? It was move-in ready in [TIMEFRAME]. Your dream home might be closer than you think.\n\nDM me 'HOME' and I'll send you what's available in your area.",
    fields: ["PERSON", "MONTHLY_PAYMENT", "SQFT", "MODEL", "FEATURE_1", "FEATURE_2", "FEATURE_3", "TIMEFRAME"],
  },
  {
    name: "The List",
    icon: "Hash",
    template: "3 reasons this [MODEL] is flying off the lot:\n\n1. [REASON_1]\n2. [REASON_2]\n3. [REASON_3]\n\nStarting at $[PRICE]. DM me before it's gone.",
    fields: ["MODEL", "REASON_1", "REASON_2", "REASON_3", "PRICE"],
  },
  {
    name: "The CTA Driver",
    icon: "Target",
    template: "If you're paying more than $[RENT_AMOUNT] in rent, you NEED to see this.\n\nThis [BEDS] bed / [BATHS] bath home is $[MONTHLY] /month — and it's YOURS.\n\n[FEATURE_1]. [FEATURE_2]. [FEATURE_3].\n\nComment 'INFO' or DM me and I'll send you everything you need to know.",
    fields: ["RENT_AMOUNT", "BEDS", "BATHS", "MONTHLY", "FEATURE_1", "FEATURE_2", "FEATURE_3"],
  },
  {
    name: "The Myth Buster",
    icon: "Zap",
    template: "\"Manufactured homes are [MYTH].\" Wrong.\n\nThis [SQFT] sq ft home has [FEATURE_1], [FEATURE_2], and [FEATURE_3]. Built to HUD federal code. [ENERGY_FACT].\n\nStop believing the myths. Start believing your budget.\n\nLink in bio or DM me 'TOUR' for a virtual walkthrough.",
    fields: ["MYTH", "SQFT", "FEATURE_1", "FEATURE_2", "FEATURE_3", "ENERGY_FACT"],
  },
  {
    name: "The Educator",
    icon: "Lightbulb",
    template: "PSA for anyone house hunting in [YEAR]:\n\nYou do NOT need 20% down. You do NOT need perfect credit. And you definitely don't need to settle for a rental.\n\n[FACT_1]. [FACT_2]. [FACT_3].\n\nI help people become homeowners every single week. DM me 'READY' and let's talk about your options.",
    fields: ["YEAR", "FACT_1", "FACT_2", "FACT_3"],
  },
];

const HASHTAG_SETS = {
  core: ["#ManufacturedHomes", "#ClaytonHomes", "#AffordableHousing", "#FirstTimeHomeBuyer", "#MobileHomeLiving"],
  tour: ["#HomeTour", "#HouseHunting", "#DreamHome", "#NewHome2026", "#HomeForSale"],
  education: ["#HomeBuyingTips", "#RealEstateTips", "#FirstTimeHomeOwner", "#HomeOwnership", "#HousingMarket"],
  lifestyle: ["#HomeGoals", "#AffordableLiving", "#SmartMoney", "#NewHomeowner", "#HomeSweetHome"],
  viral: ["#FYP", "#Viral", "#TikTokRealEstate", "#HouseFlip", "#RealEstateAgent"],
  location: ["#[YourCity]Homes", "#[YourState]RealEstate", "#[YourCity]Living", "#HomesForsaleIn[City]"],
};

const WEEKLY_SCHEDULE = [
  { day: "Monday", type: "Home Tour", icon: "Home", color: "bg-blue-500", desc: "Full walkthrough of a home. Start with the most impressive feature. 60-90 seconds.", bestTime: "11 AM - 1 PM" },
  { day: "Tuesday", type: "Myth Buster", icon: "Zap", color: "bg-orange-500", desc: "Address one misconception about manufactured homes with proof. 30-60 seconds.", bestTime: "12 PM - 3 PM" },
  { day: "Wednesday", type: "Before & After", icon: "Sparkles", color: "bg-purple-500", desc: "Setup process, customization, or lifestyle content. Show the transformation. 45-90 seconds.", bestTime: "7 PM - 9 PM" },
  { day: "Thursday", type: "Behind the Scenes", icon: "Camera", color: "bg-green-500", desc: "Day in your life selling homes. Relatable, authentic, raw. 30-60 seconds.", bestTime: "12 PM - 3 PM" },
  { day: "Friday", type: "Customer Story", icon: "Star", color: "bg-pink-500", desc: "Testimonial, buyer reaction, Q&A from comments. Emotional and engaging. 60-120 seconds.", bestTime: "11 AM - 1 PM" },
  { day: "Sat/Sun", type: "Engage & Go Live", icon: "MessageCircle", color: "bg-gray-500", desc: "Reply to comments, engage with niche creators, go live for Q&A. No new posts needed.", bestTime: "10 AM - 12 PM" },
];

const VIDEO_FORMULAS = [
  { name: "The 'Wait For It' Tour", desc: "Start with the least impressive room. Build anticipation. End with the showstopper (usually the kitchen or master suite). Add text: 'Wait for it...'", tip: "The reveal at the end drives rewatches — the #1 algorithm signal." },
  { name: "The Price Reveal", desc: "Show the entire home first. Let viewers fall in love. Then drop the price at the very end. Their shock = comments = viral.", tip: "Use text overlay: 'How much do you think this costs?' at the start." },
  { name: "The Side-by-Side", desc: "Split screen or back-to-back: what $90K gets in a manufactured home vs $350K in traditional. Let the visuals speak.", tip: "End with: 'The math isn't mathing' or 'Make it make sense.'" },
  { name: "The Myth Buster", desc: "Start with the myth as text on screen. Then walk through the home proving it wrong. Confident, slightly fired-up energy.", tip: "Controversy drives comments. Lean into it. Be bold." },
  { name: "The Customer Reaction", desc: "Film buyers seeing their home for the first time. Pure emotion. Minimal editing. Let the moment breathe.", tip: "Always ask permission to film. These are your most shareable videos." },
  { name: "The Day In My Life", desc: "Show your actual day: morning coffee, drive to the lot, showing homes, paperwork, keys handoff. Relatable and real.", tip: "Authenticity > production value. Use trending audio." },
  { name: "The Q&A Response", desc: "Reply to a comment with a full video answer. Screen shows their question, you answer on camera or with a tour.", tip: "This tells the algorithm your content creates conversation." },
  { name: "The Transformation", desc: "Before: empty lot or bare home. After: fully set up, decorated, landscaped. Time-lapse or quick cuts.", tip: "Before/afters get saved and shared more than any other format." },
  { name: "The Neighborhood Tour", desc: "Show the community: pool, playground, neighbors waving, pets, kids playing. Sell the lifestyle, not just the home.", tip: "People buy feelings, not floor plans. Show the life." },
  { name: "Things I Wish I Knew", desc: "Share genuine advice as if talking to a friend. '5 things I wish I knew before buying my first home.' Educational but personal.", tip: "Position yourself as the expert AND the friend. That's the sweet spot." },
];

const ALGORITHM_TIPS = [
  { metric: "Completion Rate", target: "70%+", desc: "Viewers must watch most of your video. Hook hard in first 3 seconds. No slow intros.", icon: "Target" },
  { metric: "Rewatch Rate", target: "15-20%+", desc: "Videos people replay get massive boosts. Use surprising reveals that make people watch again.", icon: "RefreshCw" },
  { metric: "Keywords in Captions", target: "20-40% boost", desc: "Captions now matter MORE than hashtags for discovery. Front-load keywords.", icon: "Type" },
  { metric: "Posting Frequency", target: "5x/week", desc: "Consistency trains the algorithm. Quality > quantity, but consistency > both.", icon: "Calendar" },
  { metric: "Video Length", target: "60-180 sec", desc: "Longer videos outperform shorts IF retention stays high. A 15-sec video watched fully beats a 60-sec video watched halfway.", icon: "Clock" },
  { metric: "Authenticity", target: "31% more engagement", desc: "Raw, behind-the-scenes, talking-head content crushes over-produced videos.", icon: "Camera" },
  { metric: "Comment Engagement", target: "First 60 min", desc: "Reply to every comment in the first hour. This signals your content is creating conversation.", icon: "MessageCircle" },
  { metric: "Follower Signal", target: "New in 2026", desc: "Videos now show to followers first. If they engage, it goes wider. If not, it dies. Build a loyal base.", icon: "TrendingUp" },
];

const POST_CHECKLIST = [
  "Hook is in the first 3 seconds (no logo intros, no 'hey guys')",
  "Video is 60-180 seconds (or under 30 if it's punchy)",
  "Caption has 2-3 keywords naturally included",
  "3-5 relevant hashtags (not 30 random ones)",
  "Call to action included (DM me, comment, link in bio)",
  "Trending or niche audio added",
  "Text overlay on screen for first 3 seconds",
  "Posted during optimal time window",
  "Pinned a question-provoking first comment",
];

// ─── ICON MAP ───────────────────────────────────────────────────────
const IconMap = { Camera, Copy, Check, ChevronRight, Sparkles, Calendar, Hash, Type, Film, MessageCircle, BarChart3, Zap, RefreshCw, Clock, Target, TrendingUp, CheckCircle2, ArrowRight, Star, Home, BookOpen, Lightbulb, Link, Loader2, Video, ListOrdered, Send, Settings, X, Eye, EyeOff, CheckCircle, Trash2, CalendarPlus, FolderOpen };
const DynIcon = ({ name, ...props }) => { const I = IconMap[name]; return I ? <I {...props} /> : null; };

// ─── COPY BUTTON ────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/90 hover:text-white transition-all">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-300" /> Copied!</> : <><Copy className="w-3.5 h-3.5 text-white/60" /> {label}</>}
    </button>
  );
}

// ─── CUSTOM NAV ICON ────────────────────────────────────────────────
function NavIcon({ src, className, active }) {
  return <img src={src} alt="" className={`${className} invert transition-opacity duration-200`} style={{ opacity: active ? 1 : 0.4 }} />;
}

// ─── NAV ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "generate", label: "Generate", customIcon: "/icons/Reward-Stars-2--Streamline-Ultimate.svg" },
  { id: "library", label: "Library", customIcon: "/icons/Archive-Books--Streamline-Ultimate.svg" },
  { id: "hooks", label: "Hooks", customIcon: "/icons/Factory-Industrial-Robot-Arm-1--Streamline-Ultimate.svg" },
  { id: "captions", label: "Captions", customIcon: "/icons/Subtitles--Streamline-Ultimate.svg" },
  { id: "hashtags", label: "Hashtags", icon: "Hash" },
  { id: "calendar", label: "Calendar", customIcon: "/icons/Calendar-Edit-1--Streamline-Ultimate.svg" },
  { id: "formulas", label: "Video Formulas", customIcon: "/icons/Video-Player-Movie--Streamline-Ultimate.svg" },
  { id: "algorithm", label: "Algorithm", customIcon: "/icons/Analytics-Net--Streamline-Ultimate.svg" },
  { id: "checklist", label: "Checklist", customIcon: "/icons/Notes-Checklist-Flip--Streamline-Ultimate.svg" },
];

// ─── HOOKS PAGE ─────────────────────────────────────────────────────
function HooksPage() {
  const categories = Object.keys(HOOKS);
  const [cat, setCat] = useState("curiosity");
  const [randomHook, setRandomHook] = useState(null);

  const generateRandom = () => {
    const allHooks = Object.values(HOOKS).flat();
    setRandomHook(allHooks[Math.floor(Math.random() * allHooks.length)]);
  };

  const catLabels = { curiosity: "Curiosity", controversy: "Myth-Busting", emotional: "Emotional", educational: "Educational" };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-violet-500/30 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">Hook Generator</h2>
        <p className="text-white/70 mb-4">The first 3 seconds decide everything. Pick a hook or hit randomize.</p>
        <button onClick={generateRandom} className="glass-btn-active inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:bg-white/50 transition-all">
          <Sparkles className="w-4 h-4" /> Randomize a Hook
        </button>
        {randomHook && (
          <div className="mt-4 glass-subtle rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-lg font-medium text-white">"{randomHook}"</p>
            <CopyBtn text={randomHook} />
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${cat === c ? "glass-btn-active text-white" : "glass-btn text-white/70"}`}>
            {catLabels[c]}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {HOOKS[cat].map((hook, i) => (
          <div key={i} className="glass-subtle rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-white/20 transition-all">
            <p className="text-white/90 font-medium">"{hook}"</p>
            <CopyBtn text={hook} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CAPTIONS PAGE ──────────────────────────────────────────────────
function CaptionsPage() {
  const [active, setActive] = useState(0);
  const [fields, setFields] = useState({});
  const tmpl = CAPTION_TEMPLATES[active];

  const filled = tmpl.template.replace(/\[([A-Z_]+)\]/g, (_, key) => fields[key] || `[${key}]`);

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-cyan-500/30 bg-gradient-to-r from-cyan-500/30 to-blue-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">Caption Builder</h2>
        <p className="text-white/70">Fill in the blanks to generate ready-to-paste captions. Keywords in captions boost visibility 20-40%.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto py-2 px-1 -my-2 -mx-1">
        {CAPTION_TEMPLATES.map((t, i) => (
          <button key={i} onClick={() => { setActive(i); setFields({}); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${active === i ? "glass-btn-active text-white" : "glass-btn text-white/70"}`}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <DynIcon name={tmpl.icon} className="w-5 h-5 text-blue-300" /> {tmpl.name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tmpl.fields.map(f => (
            <div key={f}>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">{f.replace(/_/g, " ")}</label>
              <input type="text" value={fields[f] || ""} onChange={e => setFields({ ...fields, [f]: e.target.value })}
                placeholder={f.replace(/_/g, " ").toLowerCase()}
                className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 outline-none" />
            </div>
          ))}
        </div>
        <div className="glass-subtle rounded-xl p-4 mt-4">
          <p className="text-sm text-white/50 font-semibold mb-2 uppercase tracking-wide">Preview</p>
          <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{filled}</p>
        </div>
        <CopyBtn text={filled} label="Copy Caption" />
      </div>
    </div>
  );
}

// ─── HASHTAGS PAGE ──────────────────────────────────────────────────
function HashtagsPage() {
  const setLabels = { core: "Core (Every Post)", tour: "Home Tours", education: "Educational", lifestyle: "Lifestyle", viral: "Viral / Discovery", location: "Location-Based" };

  const [selected, setSelected] = useState(["core", "tour"]);

  const toggle = (key) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const combined = selected.flatMap(k => HASHTAG_SETS[k]);
  const combinedText = combined.join(" ");

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-purple-500/30 bg-gradient-to-r from-purple-500/30 to-pink-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">Hashtag Strategy</h2>
        <p className="text-white/70 mb-1">Use 3-5 highly relevant hashtags per post. Select your sets below to build a custom group.</p>
        <p className="text-white/50 text-sm">Remember: keywords IN your caption now matter more than hashtags for discovery.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(HASHTAG_SETS).map(([key, tags]) => (
          <div key={key} onClick={() => toggle(key)}
            className={`cursor-pointer rounded-2xl p-4 transition-all ${selected.includes(key) ? "glass-btn-active" : "glass-subtle hover:bg-white/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white">{setLabels[key]}</span>
              {selected.includes(key) && <CheckCircle2 className="w-5 h-5 text-purple-300" />}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <span key={i} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {combined.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">Your Hashtag Set ({combined.length} tags)</h3>
            <CopyBtn text={combinedText} label="Copy All" />
          </div>
          <div className="flex flex-wrap gap-2">
            {combined.map((t, i) => (
              <span key={i} className="bg-purple-400/20 text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-400/30">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR PAGE ──────────────────────────────────────────────────
function CalendarPage() {
  const library = getLibrary();
  const scheduled = library.filter(e => e.scheduled);

  // Group scheduled content by day
  const byDay = {};
  scheduled.forEach(e => {
    const d = e.scheduled.day;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(e);
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-emerald-500/30 bg-gradient-to-r from-emerald-500/30 to-teal-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">Weekly Content Calendar</h2>
        <p className="text-white/70">5 posts per week. Consistency trains the algorithm. Each day has a theme so you never wonder what to post.</p>
        {scheduled.length > 0 && (
          <p className="text-emerald-300/70 text-sm mt-2">{scheduled.length} post{scheduled.length !== 1 ? "s" : ""} scheduled this week</p>
        )}
      </div>

      <div className="grid gap-4">
        {WEEKLY_SCHEDULE.map((day, i) => {
          const dayPosts = byDay[day.day] || [];
          return (
            <div key={i} className="glass-subtle rounded-2xl p-5 hover:bg-white/20 transition-all">
              <div className="flex items-start gap-4">
                <div className={`${day.color} bg-opacity-80 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <DynIcon name={day.icon} className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-white text-lg">{day.day}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${day.color} bg-opacity-80 text-white`}>{day.type}</span>
                  </div>
                  <p className="text-white/60 mb-2">{day.desc}</p>
                  <div className="flex items-center gap-1.5 text-sm text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Best time: <span className="font-semibold text-white/70">{day.bestTime} EST</span></span>
                  </div>
                </div>
              </div>

              {dayPosts.length > 0 && (
                <div className="mt-4 ml-16 space-y-2">
                  {dayPosts.map(post => (
                    <div key={post.id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-emerald-200 text-sm font-medium truncate">{post.content.homeSummary}</p>
                          <p className="text-emerald-300/50 text-xs mt-0.5">{post.scheduled.time}</p>
                        </div>
                        <CopyBtn text={post.content.caption} label="Copy" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VIDEO FORMULAS PAGE ────────────────────────────────────────────
function FormulasPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-orange-500/30 bg-gradient-to-r from-orange-500/30 to-red-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">10 Viral Video Formulas</h2>
        <p className="text-white/70">Proven frameworks for manufactured home content. Pick one, film it, post it. Repeat.</p>
      </div>

      <div className="grid gap-3">
        {VIDEO_FORMULAS.map((f, i) => (
          <div key={i} className="glass-subtle rounded-2xl overflow-hidden hover:bg-white/20 transition-all">
            <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full p-5 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange-400/20 text-orange-300 font-bold text-sm flex items-center justify-center border border-orange-400/30">{i + 1}</span>
                <span className="font-bold text-white">{f.name}</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expanded === i ? "rotate-90" : ""}`} />
            </button>
            {expanded === i && (
              <div className="px-5 pb-5 pt-0 border-t border-white/10">
                <p className="text-white/60 mb-3 leading-relaxed">{f.desc}</p>
                <div className="bg-orange-400/10 rounded-xl p-3 flex items-start gap-2 border border-orange-400/20">
                  <Lightbulb className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-200 font-medium">{f.tip}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALGORITHM PAGE ─────────────────────────────────────────────────
function AlgorithmPage() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 min-h-[180px] border-indigo-500/30 bg-gradient-to-r from-indigo-500/30 to-blue-600/30">
        <h2 className="text-2xl font-bold mb-2 text-white">2026 TikTok Algorithm</h2>
        <p className="text-white/70">What actually matters for getting your content pushed to the For You page.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ALGORITHM_TIPS.map((tip, i) => (
          <div key={i} className="glass-subtle rounded-2xl p-5 hover:bg-white/20 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-400/20 flex items-center justify-center flex-shrink-0 border border-indigo-400/30">
                <DynIcon name={tip.icon} className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">{tip.metric}</h3>
                  <span className="text-xs font-bold bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/30">{tip.target}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-bold text-indigo-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Weekly Analytics to Track
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="font-semibold text-indigo-300">Completion Rate:</span> <span className="text-white/60">70%+ is the goal</span></div>
          <div><span className="font-semibold text-indigo-300">Engagement Rate:</span> <span className="text-white/60">8%+ is strong</span></div>
          <div><span className="font-semibold text-indigo-300">Comments/Post:</span> <span className="text-white/60">50+ means it's working</span></div>
          <div><span className="font-semibold text-indigo-300">Share Rate:</span> <span className="text-white/60">3%+ is excellent</span></div>
          <div><span className="font-semibold text-indigo-300">Follower Growth:</span> <span className="text-white/60">100-300 per 5 posts</span></div>
          <div><span className="font-semibold text-indigo-300">Rewatch Rate:</span> <span className="text-white/60">15-20%+ goes viral</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKLIST PAGE ─────────────────────────────────────────────────
function ChecklistPage() {
  const [checked, setChecked] = useState(new Set());
  const toggle = (i) => setChecked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const allDone = checked.size === POST_CHECKLIST.length;

  return (
    <div className="space-y-6">
      <div className={`glass rounded-2xl p-6 min-h-[180px] transition-all ${allDone ? "border-green-500/30 bg-gradient-to-r from-green-500/30 to-emerald-500/30" : "border-gray-400/30 bg-gradient-to-r from-gray-500/10 to-gray-700/10"}`}>
        <h2 className="text-2xl font-bold mb-2 text-white">{allDone ? "Ready to Post!" : "Pre-Post Checklist"}</h2>
        <p className={allDone ? "text-green-200" : "text-white/60"}>
          {allDone ? "All checks passed. Hit publish and watch it fly." : `${checked.size}/${POST_CHECKLIST.length} complete. Check every item before you post.`}
        </p>
        {checked.size > 0 && !allDone && (
          <div className="mt-3 w-full bg-white/10 rounded-full h-2">
            <div className="bg-white/60 rounded-full h-2 transition-all" style={{ width: `${(checked.size / POST_CHECKLIST.length) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {POST_CHECKLIST.map((item, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`w-full text-left rounded-xl p-4 flex items-center gap-3 transition-all ${checked.has(i) ? "glass-btn-active" : "glass-subtle hover:bg-white/20"}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked.has(i) ? "bg-green-400/80 border-green-400/80" : "border-white/30"}`}>
              {checked.has(i) && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={`font-medium ${checked.has(i) ? "text-green-200 line-through" : "text-white/90"}`}>{item}</span>
          </button>
        ))}
      </div>

      <button onClick={() => setChecked(new Set())} className="text-sm text-white/30 hover:text-white/60 transition-colors">
        Reset Checklist
      </button>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold text-amber-200 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> After You Post (First 60 Minutes)
        </h3>
        <ul className="space-y-2 text-sm text-amber-100/70">
          <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300/60" /> Reply to EVERY comment — even emojis get a reply</li>
          <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300/60" /> Pin a comment that asks a question to spark discussion</li>
          <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300/60" /> Post a follow-up comment on your own video with extra info</li>
          <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300/60" /> Go live within 30 minutes (boosts the algorithm on your latest post)</li>
          <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300/60" /> Cross-post to Instagram Reels with slight caption changes</li>
        </ul>
      </div>
    </div>
  );
}

// ─── CONTENT LIBRARY (localStorage) ─────────────────────────────────
function getLibrary() {
  try { return JSON.parse(localStorage.getItem("content-library") || "[]"); } catch { return []; }
}
function saveToLibrary(content, url) {
  const lib = getLibrary();
  const entry = { id: Date.now().toString(), url, content, savedAt: new Date().toISOString(), scheduled: null };
  lib.unshift(entry);
  localStorage.setItem("content-library", JSON.stringify(lib));
  return entry;
}
function deleteFromLibrary(id) {
  const lib = getLibrary().filter(e => e.id !== id);
  localStorage.setItem("content-library", JSON.stringify(lib));
}
function scheduleContent(id, day, time) {
  const lib = getLibrary().map(e => e.id === id ? { ...e, scheduled: { day, time } } : e);
  localStorage.setItem("content-library", JSON.stringify(lib));
}
function unscheduleContent(id) {
  const lib = getLibrary().map(e => e.id === id ? { ...e, scheduled: null } : e);
  localStorage.setItem("content-library", JSON.stringify(lib));
}

// ─── LLM SETTINGS ───────────────────────────────────────────────────
const PROVIDERS = [
  { id: "openai", name: "ChatGPT (OpenAI)", placeholder: "sk-...", keyUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Claude (Anthropic)", placeholder: "sk-ant-...", keyUrl: "https://console.anthropic.com/settings/keys" },
];

function getSettings() {
  try {
    const stored = localStorage.getItem("llm-settings");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { provider: "openai", apiKey: "" };
}

function saveSettings(settings) {
  localStorage.setItem("llm-settings", JSON.stringify(settings));
}

function SettingsModal({ open, onClose }) {
  const settings = getSettings();
  const [provider, setProvider] = useState(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    saveSettings({ provider, apiKey });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass rounded-2xl p-6 w-full max-w-md relative z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">AI Settings</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-2">AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setProvider(p.id)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all text-center ${provider === p.id ? "glass-btn-active text-white" : "glass-subtle text-white/60 hover:text-white"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-2">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={PROVIDERS.find(p => p.id === provider)?.placeholder}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-fuchsia-400/50 focus:border-fuchsia-400/50 outline-none"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/30 text-xs">Stored locally on this device only.</p>
              <a href={PROVIDERS.find(p => p.id === provider)?.keyUrl} target="_blank" rel="noopener noreferrer" className="text-fuchsia-300/70 hover:text-fuchsia-200 text-xs font-medium underline underline-offset-2">
                Get your API key &rarr;
              </a>
            </div>
          </div>

          <button onClick={handleSave}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${saved ? "bg-green-500/30 text-green-300 border border-green-500/30" : "glass-btn-active text-white hover:bg-white/30"}`}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE MODAL ─────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

function ScheduleModal({ open, onClose, onSchedule }) {
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("11:00 AM");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass rounded-2xl p-6 w-full max-w-sm relative z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Schedule Post</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-2">Day</label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map(d => (
                <button key={d} onClick={() => setDay(d)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${day === d ? "glass-btn-active text-white" : "glass-subtle text-white/50"}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-2">Time</label>
            <select value={time} onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-fuchsia-400/50">
              {TIMES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
            </select>
          </div>
          <button onClick={() => { onSchedule(day, time); onClose(); }}
            className="w-full py-3 rounded-xl glass-btn-active text-white font-semibold hover:bg-white/30 transition-all flex items-center justify-center gap-2">
            <CalendarPlus className="w-4 h-4" /> Schedule for {day} at {time}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LIBRARY PAGE ───────────────────────────────────────────────────
function LibraryPage() {
  const [library, setLibrary] = useState(getLibrary());
  const [expanded, setExpanded] = useState(null);
  const [scheduleId, setScheduleId] = useState(null);

  const refresh = () => setLibrary(getLibrary());

  const handleDelete = (id) => {
    deleteFromLibrary(id);
    refresh();
  };

  const handleSchedule = (id, day, time) => {
    scheduleContent(id, day, time);
    refresh();
  };

  const handleUnschedule = (id) => {
    unscheduleContent(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <ScheduleModal
        open={!!scheduleId}
        onClose={() => setScheduleId(null)}
        onSchedule={(day, time) => handleSchedule(scheduleId, day, time)}
      />

      <div className="glass rounded-2xl p-6 min-h-[180px] border-blue-500/30 bg-gradient-to-r from-blue-500/30 to-indigo-500/30">
        <h2 className="text-2xl font-bold mb-2 text-white">Content Library</h2>
        <p className="text-white/70">All your generated content in one place. Schedule posts, copy content, or generate more.</p>
        <p className="text-white/40 text-sm mt-2">{library.length} {library.length === 1 ? "listing" : "listings"} saved</p>
      </div>

      {library.length === 0 ? (
        <div className="glass-subtle rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-medium">No saved content yet</p>
          <p className="text-white/30 text-sm mt-1">Generate content from a listing and save it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {library.map((entry) => (
            <div key={entry.id} className="glass-subtle rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full p-5 text-left flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{entry.content.homeSummary}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/30 text-xs">{new Date(entry.savedAt).toLocaleDateString()}</span>
                    {entry.scheduled && (
                      <span className="text-xs font-medium text-emerald-300/80 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {entry.scheduled.day} {entry.scheduled.time}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-white/30 transition-transform flex-shrink-0 ml-3 ${expanded === entry.id ? "rotate-90" : ""}`} />
              </button>

              {expanded === entry.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                  {/* Hooks */}
                  <div>
                    <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">Hooks</h4>
                    {entry.content.hooks.map((h, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <p className="text-white/80 text-sm">"{h.text}"</p>
                        <CopyBtn text={h.text} />
                      </div>
                    ))}
                  </div>

                  {/* Caption */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wide">Caption</h4>
                      <CopyBtn text={entry.content.caption} label="Copy" />
                    </div>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{entry.content.caption}</p>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wide">Hashtags</h4>
                      <CopyBtn text={entry.content.hashtags.join(" ")} label="Copy" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.content.hashtags.map((t, i) => (
                        <span key={i} className="bg-purple-400/15 text-purple-200/70 px-2 py-1 rounded-xl text-xs border border-purple-400/20">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Shot List */}
                  <div>
                    <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">Shot List</h4>
                    {entry.content.shotList.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <span className="text-orange-300/60 text-xs font-bold mt-0.5">{s.shot}.</span>
                        <div>
                          <p className="text-white/70 text-sm">{s.description}</p>
                          <p className="text-white/30 text-xs">{s.duration} — {s.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {entry.scheduled ? (
                      <button onClick={() => handleUnschedule(entry.id)}
                        className="flex-1 py-2.5 rounded-xl glass-btn text-amber-300/80 text-sm font-medium flex items-center justify-center gap-2 hover:text-amber-200">
                        <X className="w-3.5 h-3.5" /> Unschedule
                      </button>
                    ) : (
                      <button onClick={() => setScheduleId(entry.id)}
                        className="flex-1 py-2.5 rounded-xl glass-btn-active text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/30">
                        <CalendarPlus className="w-3.5 h-3.5" /> Schedule
                      </button>
                    )}
                    <button onClick={() => handleDelete(entry.id)}
                      className="py-2.5 px-4 rounded-xl glass-btn text-red-300/60 text-sm font-medium flex items-center justify-center gap-2 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GENERATE PAGE ──────────────────────────────────────────────────
function GeneratePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);

  const settings = getSettings();
  const hasKey = settings.apiKey && settings.apiKey.length > 5;

  const generate = async () => {
    if (!url.trim()) return;
    if (!hasKey) { setShowSettings(true); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), provider: settings.provider, apiKey: settings.apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <div className="glass rounded-2xl p-6 min-h-[180px] border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/30 to-violet-600/30">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">AI Content Generator</h2>
          <button onClick={() => setShowSettings(true)} className="text-white/40 hover:text-white transition-colors p-1">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <p className="text-white/70 mb-1">Paste a Clayton Homes listing URL and get all your TikTok content generated instantly.</p>
        {hasKey ? (
          <p className="text-green-300/70 text-xs mb-4 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected to {PROVIDERS.find(p => p.id === settings.provider)?.name}</p>
        ) : (
          <p className="text-amber-300/70 text-xs mb-4 cursor-pointer hover:text-amber-200" onClick={() => setShowSettings(true)}>Tap here to connect your AI provider to get started</p>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generate()}
              placeholder="Paste Clayton Homes listing URL..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-fuchsia-400/50 focus:border-fuchsia-400/50 outline-none"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading || !url.trim()}
            className="glass-btn-active px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 hover:bg-white/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-subtle rounded-2xl p-4 border-red-500/30 bg-red-500/10">
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
          <div className="text-center">
            <p className="text-white font-semibold">Analyzing listing & generating content...</p>
            <p className="text-white/50 text-sm mt-1">This takes about 10-15 seconds</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Home Summary */}
          <div className="glass-subtle rounded-2xl p-5">
            <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">Home Summary</h3>
            <p className="text-white font-medium">{result.homeSummary}</p>
          </div>

          {/* Hooks */}
          <div className="glass rounded-2xl p-6 border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-300" /> Generated Hooks
            </h3>
            <div className="space-y-3">
              {result.hooks.map((hook, i) => (
                <div key={i} className="glass-subtle rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-300/70">{hook.style}</span>
                    <p className="text-white font-medium mt-0.5">"{hook.text}"</p>
                  </div>
                  <CopyBtn text={hook.text} />
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="glass rounded-2xl p-6 border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Type className="w-5 h-5 text-cyan-300" /> Ready-to-Post Caption
              </h3>
              <CopyBtn text={result.caption} label="Copy Caption" />
            </div>
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{result.caption}</p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="glass rounded-2xl p-6 border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-300" /> Hashtags
              </h3>
              <CopyBtn text={result.hashtags.join(" ")} label="Copy All" />
            </div>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag, i) => (
                <span key={i} className="bg-purple-400/20 text-purple-200 px-3 py-1.5 rounded-2xl text-sm font-medium border border-purple-400/30">{tag}</span>
              ))}
            </div>
          </div>

          {/* Shot List */}
          <div className="glass rounded-2xl p-6 border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-300" /> Video Shot List
            </h3>
            <div className="space-y-3">
              {result.shotList.map((shot, i) => (
                <div key={i} className="glass-subtle rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-400/20 text-orange-300 font-bold text-xs flex items-center justify-center border border-orange-400/30">{shot.shot}</span>
                    <span className="text-white font-semibold flex-1">{shot.description}</span>
                    <span className="text-white/40 text-xs">{shot.duration}</span>
                  </div>
                  <p className="text-orange-200/60 text-sm ml-10">{shot.tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Posting Strategy */}
          <div className="glass rounded-2xl p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-300" /> Posting Strategy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-subtle rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">Best Day</p>
                <p className="text-white font-bold text-lg">{result.postingStrategy.bestDay}</p>
              </div>
              <div className="glass-subtle rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">Best Time</p>
                <p className="text-white font-bold text-lg">{result.postingStrategy.bestTime}</p>
              </div>
              <div className="glass-subtle rounded-xl p-4 text-center">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">Content Type</p>
                <p className="text-white font-bold text-lg">{result.postingStrategy.contentType}</p>
              </div>
              <div className="glass-subtle rounded-xl p-4 col-span-2">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">Why</p>
                <p className="text-white/80 text-sm">{result.postingStrategy.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                saveToLibrary(result, url);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className={`flex-1 py-3 rounded-2xl font-medium transition-all text-center flex items-center justify-center gap-2 ${saved ? "bg-green-500/20 text-green-300 border border-green-500/30" : "glass-btn-active text-white hover:bg-white/30"}`}
            >
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved to Library!</> : <><BookOpen className="w-4 h-4" /> Save to Library</>}
            </button>
            <button
              onClick={() => { setResult(null); setUrl(""); }}
              className="flex-1 glass-btn py-3 rounded-2xl text-white/70 font-medium hover:text-white transition-all text-center"
            >
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATION HOOK ──────────────────────────────────────────────
function usePostReminders() {
  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = dayNames[now.getDay()];

      const library = getLibrary();
      library.forEach(entry => {
        if (!entry.scheduled || entry.scheduled.day !== currentDay) return;

        // Parse scheduled time
        const [timePart, ampm] = entry.scheduled.time.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);
        if (ampm === "PM" && hours !== 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;

        const scheduledMinute = hours * 60 + minutes;
        const currentMinute = now.getHours() * 60 + now.getMinutes();

        // Notify if within 1 minute of scheduled time
        if (Math.abs(currentMinute - scheduledMinute) <= 1) {
          const notifKey = `notified-${entry.id}-${currentDay}`;
          if (!sessionStorage.getItem(notifKey)) {
            sessionStorage.setItem(notifKey, "true");
            new Notification("Time to Post!", {
              body: entry.content.homeSummary,
              icon: "/favicon.svg",
            });
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);
}

// ─── MAIN APP ───────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("generate");
  usePostReminders();

  const pages = { generate: GeneratePage, library: LibraryPage, hooks: HooksPage, captions: CaptionsPage, hashtags: HashtagsPage, calendar: CalendarPage, formulas: FormulasPage, algorithm: AlgorithmPage, checklist: ChecklistPage };
  const Page = pages[tab];

  const tabsRef = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabsRef.current[tab];
    if (el) {
      const parent = el.parentElement;
      setIndicator({
        left: el.offsetLeft - parent.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [tab]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 z-50 pt-[env(safe-area-inset-top)]" style={{ borderRadius: '0 0 24px 24px', backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.03), inset 0 0 6px 3px rgba(255,255,255,0.04)' }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4" style={{ paddingLeft: `calc(${100 / (TABS.length * 2)}% - 16px)` }}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/80 to-violet-600/80 flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">TikTok Content Hub</h1>
              <p className="text-[10px] sm:text-xs text-white/50">Clayton Homes | 2026 Strategy</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex">
              {TABS.map(t => (
                <button key={t.id} ref={el => tabsRef.current[t.id] = el} onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 pb-3 text-xs font-medium transition-colors duration-200 ${tab === t.id ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                  {t.customIcon ? <NavIcon src={t.customIcon} className="w-6 h-6 sm:w-7 sm:h-7" active={tab === t.id} /> : <DynIcon name={t.icon} className="w-6 h-6 sm:w-7 sm:h-7" />}
                  <span className="hidden sm:inline text-[10px] leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
            <div
              className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300 ease-in-out"
              style={{
                left: indicator.left + indicator.width * 0.2,
                width: indicator.width * 0.6,
                background: '#7c3aed',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Page />
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-center text-xs text-white/30">
          Sources: Buffer, Sprout Social, Influence4You, Socialync, OpusClip — 2026 TikTok Algorithm Research
        </div>
      </div>
    </div>
  );
}
