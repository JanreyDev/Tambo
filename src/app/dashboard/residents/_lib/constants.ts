/**
 * Static lookup arrays for the Residents page.
 *
 * NOTE: the SmartEntry seed arrays (purok/street/citizenship/religion/ethnicity)
 * are temporary defaults until Phase 2 ships the `barangay_address_entries` API.
 * Once that endpoint is live, the page should hydrate these from the API and
 * fall back to these arrays only when the fetch fails.
 */

export interface SmartEntry {
  canonical: string;
  count: number;
  aliases: string[];
}

// ── Filter row dropdowns ────────────────────────────────────────────
export const defaultPurokEntries: SmartEntry[] = [
  { canonical: "Sampaguita", count: 89, aliases: ["sampaguita", "sampagita"] },
  { canonical: "Rosal", count: 67, aliases: ["rosal"] },
  { canonical: "Ilang-Ilang", count: 54, aliases: ["ilang ilang", "ylang ylang"] },
  { canonical: "Dahlia", count: 41, aliases: ["dahlia"] },
  { canonical: "Sunflower", count: 38, aliases: ["sun flower"] },
  { canonical: "Orchid", count: 25, aliases: ["orchid"] },
  { canonical: "Jasmine", count: 19, aliases: ["jasmin", "jazmine"] },
];

export const defaultStreetEntries: SmartEntry[] = [
  { canonical: "Rizal Street", count: 112, aliases: ["rizal st.", "rizal st", "rizal ave"] },
  { canonical: "Mabini Street", count: 85, aliases: ["mabini st.", "mabini st"] },
  { canonical: "Bonifacio Avenue", count: 63, aliases: ["bonifacio ave.", "bonifacio ave", "bonifacio blvd"] },
  { canonical: "Luna Street", count: 47, aliases: ["luna st.", "luna st"] },
  { canonical: "Del Pilar Street", count: 39, aliases: ["del pilar st.", "del pilar st", "delpillar st"] },
  { canonical: "Quezon Boulevard", count: 31, aliases: ["quezon blvd.", "quezon blvd", "quezon ave"] },
  { canonical: "Aguinaldo Street", count: 22, aliases: ["aguinaldo st.", "aguinaldo st"] },
];

export const defaultPuroks = defaultPurokEntries.map((e) => e.canonical);

export const puroks = ["All Puroks", ...defaultPuroks];
export const statuses = ["All Status", "Active", "Inactive", "Deceased", "Transferred"];
export const sexOptions = ["All", "Male", "Female"];
export const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Annulled", "Live-in"];

// ── Resident form: static options ────────────────────────────────────
export const bloodTypes = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const educationLevels = ["", "No Formal Education", "Elementary Graduate", "High School Graduate", "Vocational", "College Graduate", "Post Graduate"];
export const extensions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
export const residentTypes = ["", "Permanent", "Transient", "Transferee"];
export const relationships = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandson", "Granddaughter", "Nephew", "Niece", "Boarder", "Helper", "Others"];
export const sectorOptions = ["Senior Citizen", "PWD", "Solo Parent", "4Ps Beneficiary", "Farmer", "Nano/Micro Entrepreneur", "Student", "OFW", "TODA Driver", "JODA Driver", "Other Driver", "Vendor", "Working Student", "LGBTQIA+", "With Comorbidities", "IP (Indigenous People)"];
export const employmentStatuses = ["", "Employed", "Self-employed", "Unemployed", "Retired", "Student", "OFW"];
export const complexionOptions = ["", "Fair", "Light Brown", "Brown", "Dark Brown", "Dark"];
export const employmentTypeOptions = ["", "Full-Time", "Part-Time", "Casual", "Seasonal", "Contractual", "Self-Employed", "Freelance", "OFW"];
export const incomeRanges = ["", "Below 5,000", "5,001 - 10,000", "10,001 - 15,000", "15,001 - 20,000", "20,001 - 30,000", "30,001 - 50,000", "50,001 - 75,000", "75,001 - 100,000", "100,001 - 150,000", "150,001 - 250,000", "250,001 - 500,000", "500,001 - 1,000,000", "Above 1,000,000"];

// ── Smart combobox seed entries (until Phase 2 ships the API) ────────
export const defaultCitizenshipEntries: SmartEntry[] = [
  { canonical: "Filipino", count: 950, aliases: ["pinoy", "filipina", "pilipino"] },
  { canonical: "American", count: 12, aliases: ["us", "usa", "united states"] },
  { canonical: "Chinese", count: 8, aliases: ["chinese national"] },
  { canonical: "Japanese", count: 5, aliases: [] },
  { canonical: "Korean", count: 5, aliases: ["south korean"] },
  { canonical: "Australian", count: 3, aliases: ["aussie"] },
  { canonical: "British", count: 3, aliases: ["uk", "english"] },
  { canonical: "Canadian", count: 2, aliases: [] },
  { canonical: "Indian", count: 2, aliases: [] },
  { canonical: "Indonesian", count: 1, aliases: [] },
  { canonical: "Malaysian", count: 1, aliases: [] },
  { canonical: "Singaporean", count: 1, aliases: [] },
  { canonical: "Spanish", count: 1, aliases: [] },
  { canonical: "Taiwanese", count: 1, aliases: [] },
];

export const defaultReligionEntries: SmartEntry[] = [
  { canonical: "Catholic", count: 620, aliases: ["roman catholic", "rc"] },
  { canonical: "INC (Iglesia ni Cristo)", count: 85, aliases: ["iglesia ni cristo", "inc", "iglesia"] },
  { canonical: "Born Again", count: 72, aliases: ["born again christian", "evangelical"] },
  { canonical: "Muslim", count: 45, aliases: ["islam", "islamic"] },
  { canonical: "Protestant", count: 28, aliases: [] },
  { canonical: "Seventh Day Adventist", count: 22, aliases: ["sda", "adventist"] },
  { canonical: "Baptist", count: 18, aliases: [] },
  { canonical: "Methodist", count: 12, aliases: ["united methodist"] },
  { canonical: "Jehovah's Witness", count: 10, aliases: ["jw", "jehovahs witness"] },
  { canonical: "Mormon", count: 5, aliases: ["lds", "latter day saints"] },
  { canonical: "Buddhist", count: 3, aliases: [] },
  { canonical: "Aglipayan", count: 8, aliases: ["philippine independent church", "pic"] },
];

export const defaultEthnicityEntries: SmartEntry[] = [
  { canonical: "Tagalog", count: 340, aliases: [] },
  { canonical: "Cebuano", count: 85, aliases: ["bisaya", "cebuano bisaya"] },
  { canonical: "Ilocano", count: 78, aliases: ["ilokano"] },
  { canonical: "Bisaya/Binisaya", count: 65, aliases: ["bisaya", "binisaya"] },
  { canonical: "Hiligaynon/Ilonggo", count: 42, aliases: ["hiligaynon", "ilonggo"] },
  { canonical: "Bikol", count: 38, aliases: ["bicolano", "bikolano"] },
  { canonical: "Waray", count: 32, aliases: ["waray-waray"] },
  { canonical: "Kapampangan", count: 55, aliases: ["pampango", "pampanga"] },
  { canonical: "Pangasinan", count: 28, aliases: ["pangasinense"] },
  { canonical: "Maranao", count: 12, aliases: [] },
  { canonical: "Maguindanao", count: 10, aliases: ["maguindanaon"] },
  { canonical: "Tausug", count: 8, aliases: [] },
  { canonical: "Zamboangueño", count: 15, aliases: ["zamboangueno", "chavacano"] },
  { canonical: "Ibanag", count: 6, aliases: [] },
  { canonical: "Ivatan", count: 4, aliases: [] },
  { canonical: "Kankanaey", count: 3, aliases: [] },
  { canonical: "Ibaloi", count: 2, aliases: [] },
  { canonical: "Ifugao", count: 2, aliases: [] },
  { canonical: "Kalinga", count: 2, aliases: [] },
  { canonical: "Aeta", count: 20, aliases: ["ayta", "agta"] },
];

// ── Calendar ─────────────────────────────────────────────────────────
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Per-level field rules for Educational Attainment ─────────────────
export function eduFieldRules(level: string) {
  const noFormal = level === "No Formal Education";
  const noCourse = noFormal || level === "Elementary Graduate" || level === "High School Graduate";
  return {
    allDisabled: noFormal,
    courseDisabled: noCourse,
  };
}

// ── Resident Form: section-specific lookups ──────────────────────────
export const businessStatuses = ["", "Active", "Temporarily Closed", "Closed", "Seasonal"];
export const livelihoodTypes = ["", "Employed", "Self-Employed / Business Owner", "Unemployed", "Retired", "Student", "OFW"];

// Year options — current year back to 60 years ago, blank-first
export const yearOptions = ["", ...Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i))];

// ── SmartEntry seeds (form autocompletes) ────────────────────────────
// All replaced by /api/v1/address-entries in Phase 2.

export const defaultEmergencyRelEntries: SmartEntry[] = [
  { canonical: "Spouse", count: 180, aliases: ["wife", "husband", "asawa"] },
  { canonical: "Parent", count: 120, aliases: ["father", "mother", "tatay", "nanay", "mama", "papa"] },
  { canonical: "Sibling", count: 85, aliases: ["brother", "sister", "kapatid"] },
  { canonical: "Child", count: 60, aliases: ["son", "daughter", "anak"] },
  { canonical: "Friend", count: 35, aliases: ["kaibigan"] },
  { canonical: "Relative", count: 28, aliases: ["kamag-anak"] },
  { canonical: "Neighbor", count: 22, aliases: ["kapitbahay"] },
  { canonical: "Grandparent", count: 15, aliases: ["lolo", "lola", "grandfather", "grandmother"] },
  { canonical: "Guardian", count: 10, aliases: ["legal guardian"] },
  { canonical: "Employer", count: 5, aliases: ["boss"] },
  { canonical: "Co-worker", count: 3, aliases: ["katrabaho", "officemate"] },
];

export const defaultSectorOtherEntries: SmartEntry[] = [
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike", "traysikel", "trisikad"] },
  { canonical: "Fish Vendor", count: 120, aliases: ["tindera ng isda", "fish seller", "magisda"] },
  { canonical: "Sari-Sari Store Owner", count: 110, aliases: ["tindahan", "sari sari", "store owner", "tindero", "tindera"] },
  { canonical: "Construction Worker", count: 95, aliases: ["mason", "karpintero", "carpenter", "tubero", "plumber", "construction"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife", "hilot"] },
  { canonical: "Barangay Nutrition Scholar", count: 70, aliases: ["bns", "nutrition scholar"] },
  { canonical: "Barangay Tanod", count: 65, aliases: ["tanod", "bantay bayan", "peace officer"] },
  { canonical: "Lupon Member", count: 55, aliases: ["lupon", "lupon tagapamayapa", "katarungang pambarangay"] },
  { canonical: "SK Member", count: 50, aliases: ["sangguniang kabataan", "sk council", "kabataan"] },
  { canonical: "Women's Association", count: 45, aliases: ["kababaihan", "women org", "samahan ng kababaihan"] },
  { canonical: "Jeepney Driver", count: 40, aliases: ["tsuper", "driver", "jeep driver"] },
  { canonical: "Teacher", count: 38, aliases: ["guro", "titser", "educator"] },
  { canonical: "Kasambahay", count: 35, aliases: ["katulong", "helper", "domestic worker", "yaya", "maid"] },
  { canonical: "Church Worker", count: 30, aliases: ["sakristan", "choir", "simbahan", "church volunteer"] },
  { canonical: "Cooperative Member", count: 28, aliases: ["coop", "kooperatiba", "credit coop"] },
  { canonical: "Senior Citizen Association", count: 25, aliases: ["osca", "senior org", "samahan ng matatanda"] },
  { canonical: "PWD Organization", count: 22, aliases: ["pwd org", "disabled org", "samahan ng pwd"] },
  { canonical: "Market Vendor", count: 20, aliases: ["magtitinda", "palengke", "market seller", "vendor sa palengke"] },
  { canonical: "Laundry Worker", count: 18, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Security Guard", count: 15, aliases: ["guard", "guwardiya", "security"] },
];

export const defaultBusinessTypeEntries: SmartEntry[] = [
  { canonical: "Sari-Sari Store", count: 280, aliases: ["tindahan", "store", "sari sari", "magtitinda"] },
  { canonical: "Carinderia / Eatery", count: 150, aliases: ["karinderia", "karinderya", "eatery", "kainan", "turo-turo", "turo turo"] },
  { canonical: "Tricycle Operation", count: 130, aliases: ["traysikel", "trike operation", "tricycle", "trike"] },
  { canonical: "Buy and Sell", count: 95, aliases: ["buy & sell", "trading", "negosyo", "reseller"] },
  { canonical: "Water Refilling Station", count: 80, aliases: ["water station", "tubig", "refilling", "purified water"] },
  { canonical: "Laundry Service", count: 70, aliases: ["labahan", "laundry shop", "labandera"] },
  { canonical: "Piggery / Livestock", count: 65, aliases: ["babuyan", "pig farm", "manukan", "poultry", "livestock"] },
  { canonical: "Rice Trading", count: 55, aliases: ["bigas", "rice dealer", "bigasan", "rice mill"] },
  { canonical: "Welding / Fabrication", count: 50, aliases: ["panday", "welding shop", "fabrication", "metal works"] },
  { canonical: "Beauty Salon / Barbershop", count: 48, aliases: ["parlor", "barbershop", "salon", "beauty parlor", "gupit"] },
  { canonical: "Farming / Agriculture", count: 45, aliases: ["magsasaka", "bukid", "farm", "palay", "agriculture"] },
  { canonical: "Fishing", count: 42, aliases: ["mangingisda", "isda", "fishpond", "aquaculture"] },
  { canonical: "Vulcanizing Shop", count: 38, aliases: ["vulcanizing", "gomahan", "tire repair"] },
  { canonical: "Computer Shop / Internet Cafe", count: 35, aliases: ["comp shop", "internet cafe", "pisonet", "pisowifi"] },
  { canonical: "Bakery", count: 32, aliases: ["panaderya", "bakeshop", "bread", "tinapay"] },
  { canonical: "Construction / Contractor", count: 30, aliases: ["kontratista", "construction", "builder", "mason"] },
  { canonical: "Jeepney Operation", count: 28, aliases: ["jeepney", "jeep operation", "jeep"] },
  { canonical: "Food Vending", count: 25, aliases: ["food cart", "street food", "tusok-tusok", "fishball", "vendor"] },
  { canonical: "Auto / Motor Repair", count: 22, aliases: ["talyer", "mechanic", "auto repair", "motor shop"] },
  { canonical: "Online Selling", count: 20, aliases: ["online shop", "shopee seller", "lazada", "facebook selling", "online business"] },
];

export const defaultOccupationEntries: SmartEntry[] = [
  { canonical: "Farmer", count: 280, aliases: ["magsasaka", "mag-uuma", "bukid", "palay farmer"] },
  { canonical: "Fisherman", count: 200, aliases: ["mangingisda", "fisher", "isda"] },
  { canonical: "Tricycle Driver", count: 180, aliases: ["trike driver", "traysikel", "trisikad driver"] },
  { canonical: "Vendor", count: 160, aliases: ["magtitinda", "tindera", "tindero", "market vendor", "ambulant vendor"] },
  { canonical: "Construction Worker", count: 150, aliases: ["mason", "karpintero", "carpenter", "tubero", "laborer"] },
  { canonical: "Teacher", count: 140, aliases: ["guro", "titser", "educator", "instructor"] },
  { canonical: "Housewife / Homemaker", count: 130, aliases: ["housewife", "homemaker", "maybahay", "nag-aalaga ng bahay"] },
  { canonical: "Driver", count: 120, aliases: ["tsuper", "jeepney driver", "truck driver", "delivery driver"] },
  { canonical: "Domestic Worker", count: 110, aliases: ["kasambahay", "katulong", "helper", "yaya", "maid"] },
  { canonical: "Government Employee", count: 100, aliases: ["gov employee", "empleyado ng gobyerno", "public servant"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "watchman"] },
  { canonical: "Barangay Health Worker", count: 85, aliases: ["bhw", "health worker", "midwife"] },
  { canonical: "Sari-Sari Store Owner", count: 80, aliases: ["tindahan owner", "store owner", "magtitinda"] },
  { canonical: "Electrician", count: 70, aliases: ["elektrista", "elektrisyan", "electrical"] },
  { canonical: "Mechanic", count: 65, aliases: ["mekaniko", "auto mechanic", "motor mechanic"] },
  { canonical: "OFW", count: 60, aliases: ["overseas filipino worker", "abroad", "migrant worker"] },
  { canonical: "Nurse", count: 55, aliases: ["nars", "registered nurse", "rn"] },
  { canonical: "Laundry Worker", count: 50, aliases: ["labandera", "labandero", "maglalaba"] },
  { canonical: "Student", count: 45, aliases: ["estudyante", "mag-aaral", "scholar"] },
  { canonical: "Retired", count: 40, aliases: ["retirado", "pensioner", "senior"] },
];

export const defaultSkillEntries: SmartEntry[] = [
  { canonical: "Welding", count: 150, aliases: ["welder", "panday", "arc welding", "metal fabrication"] },
  { canonical: "Carpentry", count: 140, aliases: ["karpintero", "woodwork", "furniture making"] },
  { canonical: "Dressmaking / Tailoring", count: 120, aliases: ["mananahi", "seamstress", "tailor", "sewing"] },
  { canonical: "Cooking / Food Preparation", count: 110, aliases: ["pagluluto", "chef", "cook", "baking"] },
  { canonical: "Driving (Professional)", count: 100, aliases: ["pagmamaneho", "professional driver", "LTO license"] },
  { canonical: "Farming / Agriculture", count: 95, aliases: ["pagsasaka", "crop production", "organic farming"] },
  { canonical: "Electrical Installation", count: 85, aliases: ["elektrista", "wiring", "electrical work"] },
  { canonical: "Plumbing", count: 80, aliases: ["tubero", "pipe fitting", "water system"] },
  { canonical: "Masonry", count: 75, aliases: ["mason", "brick laying", "concrete work", "pagtatayo"] },
  { canonical: "Fishing", count: 70, aliases: ["pangingisda", "net making", "fish processing"] },
  { canonical: "Beauty / Hairdressing", count: 65, aliases: ["parlor", "salon", "hair cutting", "gupit", "rebond"] },
  { canonical: "Auto / Motor Repair", count: 60, aliases: ["mekaniko", "automotive", "motor repair", "talyer"] },
  { canonical: "Computer Literacy", count: 55, aliases: ["computer", "MS Office", "typing", "encoding"] },
  { canonical: "Electronics Repair", count: 50, aliases: ["technician", "cellphone repair", "appliance repair"] },
  { canonical: "Livestock / Animal Husbandry", count: 45, aliases: ["pag-aalaga ng hayop", "piggery", "poultry", "manukan"] },
  { canonical: "Handicraft / Weaving", count: 40, aliases: ["paghahabi", "basket weaving", "handicraft", "banig"] },
  { canonical: "Massage / Hilot", count: 35, aliases: ["hilot", "spa", "therapeutic massage", "wellness"] },
  { canonical: "Painting (House)", count: 30, aliases: ["pintor", "house painting", "wall painting"] },
  { canonical: "Baking / Pastry", count: 28, aliases: ["baker", "panaderya", "cake making", "pastry chef"] },
  { canonical: "Online Selling / E-Commerce", count: 25, aliases: ["online business", "shopee", "lazada", "facebook selling"] },
];

export const defaultPositionEntries: SmartEntry[] = [
  { canonical: "Laborer / Helper", count: 200, aliases: ["labor", "helper", "kargador", "utility worker"] },
  { canonical: "Driver", count: 150, aliases: ["tsuper", "delivery driver", "company driver"] },
  { canonical: "Cashier", count: 120, aliases: ["kahera", "cahier", "cash handler"] },
  { canonical: "Sales Associate", count: 100, aliases: ["saleslady", "salesman", "sales clerk", "tindera"] },
  { canonical: "Teacher / Instructor", count: 95, aliases: ["guro", "titser", "faculty", "substitute teacher"] },
  { canonical: "Security Guard", count: 90, aliases: ["guard", "guwardiya", "security officer"] },
  { canonical: "Machine Operator", count: 80, aliases: ["operator", "factory worker", "production"] },
  { canonical: "Office Staff / Clerk", count: 75, aliases: ["clerk", "admin staff", "office assistant", "encoder"] },
  { canonical: "Foreman / Supervisor", count: 65, aliases: ["forman", "kapatas", "team leader", "supervisor"] },
  { canonical: "Nurse / Midwife", count: 60, aliases: ["nars", "registered nurse", "komadrona", "midwife"] },
  { canonical: "Barangay Health Worker", count: 55, aliases: ["bhw", "health worker"] },
  { canonical: "Maintenance / Janitor", count: 50, aliases: ["janitor", "custodian", "cleaner", "utility"] },
  { canonical: "Cook / Kitchen Staff", count: 48, aliases: ["cook", "kitchen helper", "kusinero", "kusinera"] },
  { canonical: "Delivery Rider", count: 45, aliases: ["rider", "grab rider", "foodpanda", "lalamove"] },
  { canonical: "Technician", count: 42, aliases: ["tech", "electrician", "aircon tech", "IT tech"] },
  { canonical: "Farm Worker", count: 40, aliases: ["farm hand", "magsasaka", "harvester", "plantation worker"] },
  { canonical: "Construction Worker", count: 38, aliases: ["mason", "carpenter", "welder", "steel man"] },
  { canonical: "Domestic Helper", count: 35, aliases: ["kasambahay", "katulong", "yaya", "househelp"] },
  { canonical: "Factory Worker", count: 30, aliases: ["production staff", "packer", "assembly line"] },
  { canonical: "Seaman / Seafarer", count: 25, aliases: ["seaman", "marino", "sailor", "ofw seaman"] },
];

export const defaultEmployerEntries: SmartEntry[] = [
  { canonical: "Self-Employed", count: 300, aliases: ["sarili", "own business", "self employed", "freelance"] },
  { canonical: "Department of Education (DepEd)", count: 120, aliases: ["deped", "dep ed", "public school"] },
  { canonical: "Local Government Unit (LGU)", count: 100, aliases: ["lgu", "municipal", "city hall", "barangay"] },
  { canonical: "SM Group", count: 80, aliases: ["sm supermarket", "sm mall", "savemore", "sm retail"] },
  { canonical: "Jollibee Foods Corp.", count: 75, aliases: ["jollibee", "jfc", "chowking", "greenwich", "mang inasal"] },
  { canonical: "Security Agency", count: 70, aliases: ["agency", "guard agency", "security service"] },
  { canonical: "Construction Company", count: 65, aliases: ["contractor", "construction firm", "building company"] },
  { canonical: "Private Household", count: 60, aliases: ["private", "bahay", "employer household", "family employer"] },
  { canonical: "Department of Health (DOH)", count: 55, aliases: ["doh", "hospital", "rural health unit", "rhu"] },
  { canonical: "Philippine National Police (PNP)", count: 50, aliases: ["pnp", "police", "pulis"] },
  { canonical: "Armed Forces of the Philippines (AFP)", count: 45, aliases: ["afp", "military", "army", "sundalo"] },
  { canonical: "DOLE / PESO", count: 40, aliases: ["dole", "peso", "public employment service"] },
  { canonical: "Universal Robina Corp.", count: 35, aliases: ["urc", "jack n jill", "c2"] },
  { canonical: "Puregold", count: 30, aliases: ["puregold", "s&r"] },
  { canonical: "BPO / Call Center", count: 28, aliases: ["bpo", "call center", "outsourcing", "customer service"] },
  { canonical: "Grab / Delivery Platform", count: 25, aliases: ["grab", "foodpanda", "lalamove", "angkas"] },
  { canonical: "Factory / Manufacturing", count: 22, aliases: ["factory", "pabrika", "manufacturing plant"] },
  { canonical: "Cooperative", count: 20, aliases: ["coop", "kooperatiba", "multi-purpose coop"] },
  { canonical: "Church / Religious Org", count: 18, aliases: ["simbahan", "church", "religious"] },
  { canonical: "NGO / Foundation", count: 15, aliases: ["ngo", "foundation", "charity", "non-profit"] },
];

export const defaultCourseEntries: SmartEntry[] = [
  { canonical: "BS Computer Science", count: 45, aliases: ["bscs", "compsci", "cs"] },
  { canonical: "BS Information Technology", count: 42, aliases: ["bsit", "it", "infotech"] },
  { canonical: "BS Nursing", count: 80, aliases: ["bsn", "nursing"] },
  { canonical: "BS Education", count: 75, aliases: ["bsed", "education", "teaching"] },
  { canonical: "BS Criminology", count: 60, aliases: ["bscrim", "crim", "criminology"] },
  { canonical: "BS Accountancy", count: 35, aliases: ["bsa", "accountancy", "accounting"] },
  { canonical: "BS Business Administration", count: 55, aliases: ["bsba", "business admin", "business"] },
  { canonical: "BS Civil Engineering", count: 30, aliases: ["bsce", "civil eng", "engineering"] },
  { canonical: "BS Agriculture", count: 28, aliases: ["bsa agri", "agriculture", "agri"] },
  { canonical: "BS Social Work", count: 22, aliases: ["bssw", "social work"] },
  { canonical: "Associate in Computer Technology", count: 18, aliases: ["act", "computer tech"] },
  { canonical: "BS Hotel & Restaurant Management", count: 25, aliases: ["bshrm", "hrm", "hotel management"] },
  { canonical: "BS Marine Transportation", count: 15, aliases: ["bsmt", "marine", "seaman course"] },
  { canonical: "Technical Vocational (TESDA)", count: 40, aliases: ["tesda", "tvet", "vocational", "nc2"] },
  { canonical: "General Academic Strand (GAS)", count: 20, aliases: ["gas", "shs gas", "senior high"] },
  { canonical: "STEM", count: 18, aliases: ["shs stem", "science tech"] },
  { canonical: "ABM", count: 15, aliases: ["shs abm", "accountancy business"] },
  { canonical: "HUMSS", count: 12, aliases: ["shs humss", "humanities"] },
  { canonical: "TVL", count: 10, aliases: ["shs tvl", "tech voc livelihood"] },
  { canonical: "BS Pharmacy", count: 20, aliases: ["bspharm", "pharmacy"] },
];

export const defaultSchoolEntries: SmartEntry[] = [
  { canonical: "Gordon College", count: 120, aliases: ["gc", "gordon"] },
  { canonical: "Columban College", count: 85, aliases: ["columban", "cc olongapo"] },
  { canonical: "Olongapo City National High School", count: 95, aliases: ["ocnhs", "city high"] },
  { canonical: "Zambales National High School", count: 60, aliases: ["znhs"] },
  { canonical: "President Ramon Magsaysay State University", count: 55, aliases: ["prmsu", "prms", "magsaysay univ"] },
  { canonical: "Philippine Christian University", count: 25, aliases: ["pcu"] },
  { canonical: "STI College", count: 40, aliases: ["sti", "sti olongapo"] },
  { canonical: "AMA Computer College", count: 35, aliases: ["ama", "amacc"] },
  { canonical: "University of the Philippines", count: 20, aliases: ["up", "up diliman", "up manila"] },
  { canonical: "Polytechnic University of the Philippines", count: 30, aliases: ["pup"] },
  { canonical: "Technological University of the Philippines", count: 25, aliases: ["tup"] },
  { canonical: "Don Bosco Training Center", count: 18, aliases: ["don bosco", "dbti"] },
  { canonical: "Subic Bay Colleges", count: 15, aliases: ["sbc"] },
  { canonical: "Philippine Science High School", count: 10, aliases: ["pisay", "pshs"] },
  { canonical: "DepEd ALS (Alternative Learning System)", count: 22, aliases: ["als", "alternative learning"] },
];

export const defaultPlaceOfBirthEntries: SmartEntry[] = [
  { canonical: "Olongapo City", count: 350, aliases: ["olongapo", "olongapo city, zambales"] },
  { canonical: "Subic, Zambales", count: 120, aliases: ["subic"] },
  { canonical: "San Marcelino, Zambales", count: 85, aliases: ["san marcelino"] },
  { canonical: "Castillejos, Zambales", count: 70, aliases: ["castillejos"] },
  { canonical: "San Antonio, Zambales", count: 55, aliases: ["san antonio zambales"] },
  { canonical: "Iba, Zambales", count: 65, aliases: ["iba"] },
  { canonical: "Tarlac City", count: 45, aliases: ["tarlac", "tarlac city"] },
  { canonical: "Manila", count: 80, aliases: ["manila city", "city of manila"] },
  { canonical: "Quezon City", count: 50, aliases: ["qc", "quezon"] },
  { canonical: "Angeles City, Pampanga", count: 35, aliases: ["angeles city", "angeles"] },
  { canonical: "San Fernando, Pampanga", count: 28, aliases: ["san fernando pampanga"] },
  { canonical: "Dagupan City, Pangasinan", count: 22, aliases: ["dagupan"] },
  { canonical: "Baguio City", count: 25, aliases: ["baguio"] },
  { canonical: "Zambales", count: 40, aliases: ["zambales province"] },
  { canonical: "Caloocan City", count: 20, aliases: ["caloocan"] },
  { canonical: "Makati City", count: 18, aliases: ["makati"] },
  { canonical: "Cebu City", count: 15, aliases: ["cebu"] },
  { canonical: "Davao City", count: 12, aliases: ["davao"] },
  { canonical: "Zamboanga City", count: 10, aliases: ["zamboanga"] },
  { canonical: "Bataan", count: 30, aliases: ["bataan province", "balanga"] },
];
