/**
 * Banana facts — v2.0 content.
 *
 * A curated set of TRUE banana facts, each with a deadpan one-line quip and
 * a real source. Built 2026-06-12 by a research → comedy → fact-check →
 * curator agent pipeline: 122 candidates researched, 62 cut, 7 popular
 * banana myths caught and either corrected or dropped (see MYTHS_REJECTED).
 *
 * The rule the curator enforced: the FACT always outweighs the funny. Every
 * `fact` is standalone-true and sourced; the `quip` is garnish that never
 * bends it. If a fact only worked because of the joke, it was cut.
 *
 * Intended uses:
 *   - Drop item: a scanned banana can drop a fact (use randomFact / DROPPABLE_FACTS).
 *   - A future "Banana Facts" section (use FACTS_BY_CATEGORY for a browsable grid).
 *
 * Nothing here is wired into openCrate or a screen yet — that's a separate
 * decision (how a fact drops, and what the section looks like).
 */

export type FactCategory =
  | 'Botany'
  | 'Genetics'
  | 'History'
  | 'Science'
  | 'Nutrition'
  | 'Culture'
  | 'Records'
  | 'Language'
  | 'Oddities';

/** How startling the fact is. Doubles as a drop-rarity tier if facts drop. */
export type FactRarity = 'common' | 'surprising' | 'wild';

export interface BananaFact {
  id: string;
  category: FactCategory;
  rarity: FactRarity;
  /** The fact. Standalone-true; the quip never bends it. */
  fact: string;
  /** Deadpan one-liner. Garnish only. */
  quip: string;
  sourceName: string;
  sourceUrl: string;
  /**
   * Heavier or edgier content (graphic history, adult subject matter) held
   * out of the default random-drop pool so it can't surface unprompted in a
   * light, family-rated app. Still browsable if a Facts section opts in.
   */
  sensitive?: boolean;
}

/* ------------------------------------------------------------------ */
/* The catalog                                                         */
/* ------------------------------------------------------------------ */

export const BANANA_FACTS: BananaFact[] = [
  // ---- Botany ----
  {
    id: 'banana-is-a-berry',
    category: 'Botany',
    rarity: 'common',
    fact: `A banana is botanically a berry. It develops from a single flower with one ovary and a soft fruit wall enclosing the seeds, the textbook definition of a berry.`,
    quip: `The produce aisle does not want to hear it.`,
    sourceName: 'Berry (botany), Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Berry_(botany)',
  },
  {
    id: 'strawberries-not-berries',
    category: 'Botany',
    rarity: 'surprising',
    fact: `Strawberries and raspberries are not true berries. Each forms from a flower with many separate ovaries, making it an aggregate fruit, while the single-ovary banana qualifies as a real berry.`,
    quip: `The berries with berry in the name. Frauds.`,
    sourceName: 'Stanford Magazine, Bananas Are Berries',
    sourceUrl: 'https://stanfordmag.org/contents/bananas-are-berries',
  },
  {
    id: 'largest-herb',
    category: 'Botany',
    rarity: 'surprising',
    fact: `The banana plant is the largest herbaceous flowering plant in the world, not a tree. It has no woody trunk; what looks like a trunk is a pseudostem of tightly packed leaf bases.`,
    quip: `Filed under herb, next to the basil.`,
    sourceName: 'Banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana',
  },
  {
    id: 'musa-ingens',
    category: 'Botany',
    rarity: 'wild',
    fact: `The largest herb on Earth is the giant banana Musa ingens of montane New Guinea, with a non-woody pseudostem reaching about 15 meters tall and leaves up to 5 meters long.`,
    quip: `A five-story herb. The basil is intimidated.`,
    sourceName: 'Musa ingens, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Musa_ingens',
  },
  {
    id: 'hands-and-fingers',
    category: 'Botany',
    rarity: 'common',
    fact: `A banana bunch is made of clusters called hands, and each individual banana is a finger. A bunch holds around nine hands with up to about 20 fingers each.`,
    quip: `You eat the fingers off the hand. Anyway.`,
    sourceName: 'Banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana',
  },
  {
    id: 'wild-banana-seeds',
    category: 'Botany',
    rarity: 'surprising',
    fact: `Wild bananas are full of hard seeds. Each fruit of Musa acuminata, the ancestor of most dessert bananas, can hold roughly 15 to 62 seeds about 5 to 6 mm across, leaving little edible pulp.`,
    quip: `The original recipe. Mostly gravel.`,
    sourceName: 'Musa acuminata, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Musa_acuminata',
  },

  // ---- Genetics ----
  {
    id: 'parthenocarpy-seedless',
    category: 'Genetics',
    rarity: 'surprising',
    fact: `Edible bananas set fruit without pollination or fertilization, a process called parthenocarpy, which is why they have no real seeds.`,
    quip: `Fruit with no plan to reproduce.`,
    sourceName: 'Banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana',
  },
  {
    id: 'triploid-33-vs-22',
    category: 'Genetics',
    rarity: 'surprising',
    fact: `Most cultivated bananas are triploid with 33 chromosomes, three sets of 11, while their wild ancestors are diploid with 22. The extra set disrupts meiosis, leaving them sterile and propagated from suckers.`,
    quip: `Three sets. Cannot count to a baby.`,
    sourceName: 'Annals of Botany, Oxford',
    sourceUrl: 'https://academic.oup.com/aob/article/127/1/7/5760888',
  },
  {
    id: 'cavendish-clones',
    category: 'Genetics',
    rarity: 'surprising',
    fact: `Every Cavendish banana is a near-identical clone, propagated from suckers or tissue culture. That genetic uniformity is exactly why a single fungal strain can threaten the entire crop.`,
    quip: `Every banana the same banana. Convenient for the fungus.`,
    sourceName: 'Cavendish banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Cavendish_banana',
  },
  {
    id: 'genome-2012',
    category: 'Genetics',
    rarity: 'wild',
    fact: `The banana reference genome was sequenced in 2012 and holds more than 36,000 protein-coding genes, slightly more than the human genome's roughly 20,000.`,
    quip: `More genes than you. Fewer opinions.`,
    sourceName: 'Nature, D\'Hont et al. 2012',
    sourceUrl: 'https://www.nature.com/articles/nature11241',
  },
  {
    id: 'human-dna-myth',
    category: 'Genetics',
    rarity: 'surprising',
    fact: `The line that we share 50 percent of our DNA with bananas is wrong. About 60 percent of human genes have a banana counterpart, but the matching proteins are only about 40 percent identical, and coding genes are a tiny slice of total DNA.`,
    quip: `The 50 percent line is a lie people repeat at parties.`,
    sourceName: 'IFLScience, citing NHGRI',
    sourceUrl: 'https://www.iflscience.com/do-we-really-share-60-percent-of-our-dna-with-a-banana-79391',
  },

  // ---- History ----
  {
    id: 'kuk-swamp',
    category: 'History',
    rarity: 'wild',
    fact: `Banana cultivation at Kuk Swamp in the New Guinea highlands dates back at least 7,000 years, the earliest evidence of banana farming anywhere, and the site is a UNESCO World Heritage listing for it.`,
    quip: `Older than the wheel. Holds a grudge about it.`,
    sourceName: 'UNESCO World Heritage Centre, Kuk',
    sourceUrl: 'https://whc.unesco.org/en/list/887/',
  },
  {
    id: 'cavendish-duke',
    category: 'History',
    rarity: 'surprising',
    fact: `The Cavendish banana is named for William Cavendish, 6th Duke of Devonshire, who received plants around 1834 that were grown by gardener Joseph Paxton at Chatsworth House.`,
    quip: `A duke. The fruit has a better pedigree than you.`,
    sourceName: 'Cavendish banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Cavendish_banana',
  },
  {
    id: 'cavendish-replaced-gros-michel',
    category: 'History',
    rarity: 'common',
    fact: `The Cavendish became the export banana only after Panama disease rendered the previously dominant Gros Michel commercially extinct in the 1950s and 1960s.`,
    quip: `The understudy who never gave the role back.`,
    sourceName: 'Panama disease, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Panama_disease',
  },
  {
    id: 'ulua-valley',
    category: 'History',
    rarity: 'wild',
    fact: `Panama disease eradicated roughly 30,000 hectares of Gros Michel plantation in the Ulua Valley of Honduras between 1940 and 1960.`,
    quip: `Thirty thousand hectares. The fungus was not in a hurry.`,
    sourceName: 'Panama disease, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Panama_disease',
  },
  {
    id: 'fungus-30-years',
    category: 'History',
    rarity: 'surprising',
    fact: `The fungus behind Panama disease survives in soil as resting spores for up to about 30 years and resists fungicides, so infested land is effectively lost for susceptible bananas.`,
    quip: `Squats in the dirt for three decades. Patient.`,
    sourceName: 'Panama disease, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Panama_disease',
  },
  {
    id: 'tr4-spread',
    category: 'History',
    rarity: 'surprising',
    fact: `The Tropical Race 4 strain that attacks Cavendish bananas spread from 16 affected countries in 2018 to 23 by the mid-2020s, crossing into Latin America in Colombia in 2019.`,
    quip: `Sixteen to twenty-three. It travels well.`,
    sourceName: 'Frontiers in Plant Science, 2024',
    sourceUrl: 'https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2024.1397617/full',
  },
  {
    id: 'el-pulpo',
    category: 'History',
    rarity: 'surprising',
    fact: `By the 1930s the United Fruit Company owned about 3.5 million acres across Central America and the Caribbean and was nicknamed el pulpo, the octopus, for its reach into every part of a host economy.`,
    quip: `An octopus is a generous number of arms.`,
    sourceName: 'United Fruit Company, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/United_Fruit_Company',
  },
  {
    id: 'guatemala-coup',
    category: 'History',
    rarity: 'wild',
    fact: `The 1954 overthrow of Guatemalan president Jacobo Arbenz was a CIA operation, PBSUCCESS, set off after his land reform expropriated unused United Fruit land. The Dulles brothers, who ran State and the CIA, had been partners at United Fruit's law firm.`,
    quip: `The fruit had two brothers in government.`,
    sourceName: '1954 Guatemalan coup, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/1954_Guatemalan_coup_d%27%C3%A9tat',
  },
  {
    id: 'banana-massacre',
    category: 'History',
    rarity: 'wild',
    fact: `In the 1928 Banana Massacre the Colombian army fired on striking United Fruit workers near Cienaga; death-toll estimates range from 47 to roughly 2,000. Garcia Marquez later fictionalized it as 3,000 dead.`,
    quip: `A range that wide is its own indictment.`,
    sourceName: 'Banana Massacre, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana_Massacre',
    sensitive: true,
  },
  {
    id: 'zemurray-lee-christmas',
    category: 'History',
    rarity: 'wild',
    fact: `Banana magnate Sam Zemurray financed a 1911 coup in Honduras using mercenaries led by a gunman named Lee Christmas, installing Manuel Bonilla, who rewarded him with tax-free land.`,
    quip: `His hired gun was named Lee Christmas. Yes.`,
    sourceName: 'Sam Zemurray, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Sam_Zemurray',
  },
  {
    id: 'united-fruit-chiquita',
    category: 'History',
    rarity: 'surprising',
    fact: `The United Fruit Company still exists under a new name. It became United Brands in 1970 and was renamed Chiquita Brands International in 1984.`,
    quip: `The little sticker has a long memory.`,
    sourceName: 'United Fruit Company, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/United_Fruit_Company',
  },

  // ---- Science ----
  {
    id: 'cavendish-99-exports',
    category: 'Science',
    rarity: 'surprising',
    fact: `The Cavendish makes up roughly 99 percent of banana exports to developed-country markets, but only about 47 percent of total global banana production, since most bananas are eaten where they grow.`,
    quip: `Ninety-nine percent one clone, for the part that ships.`,
    sourceName: 'Cavendish banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Cavendish_banana',
  },
  {
    id: 'banana-15-bq',
    category: 'Science',
    rarity: 'wild',
    fact: `A single banana is mildly radioactive at roughly 15 becquerels, meaning about 15 atoms inside it decay every second, because of the naturally unstable isotope potassium-40.`,
    quip: `Fifteen tiny events a second. The banana is unbothered.`,
    sourceName: 'Banana equivalent dose, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana_equivalent_dose',
  },
  {
    id: 'body-280x-radioactive',
    category: 'Science',
    rarity: 'wild',
    fact: `Your own body is far more radioactive than a banana. A typical adult holds about 16 milligrams of potassium-40, making the body roughly 280 times more radioactive than one banana.`,
    quip: `You are the scariest thing in your own fruit bowl.`,
    sourceName: 'BBC Science Focus',
    sourceUrl: 'https://www.sciencefocus.com/science/how-many-bananas-would-i-need-to-eat-to-become-radioactive',
  },
  {
    id: 'dose-not-cumulative',
    category: 'Science',
    rarity: 'surprising',
    fact: `Eating bananas does not build up radiation in you. One banana raises your total potassium-40 by only about 0.4 percent, and the body holds potassium at a fixed level and flushes the excess within hours.`,
    quip: `The body files it under temporary. It does not keep receipts.`,
    sourceName: 'BBC Science Focus',
    sourceUrl: 'https://www.sciencefocus.com/science/how-many-bananas-would-i-need-to-eat-to-become-radioactive',
  },
  {
    id: 'portal-monitors',
    category: 'Science',
    rarity: 'wild',
    fact: `Truckloads of bananas have set off radiation portal monitors built to catch smuggled nuclear material, because their combined potassium-40 is enough to trip the detectors.`,
    quip: `Border security, foiled again by produce.`,
    sourceName: 'Banana equivalent dose, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana_equivalent_dose',
  },
  {
    id: 'banana-floats',
    category: 'Science',
    rarity: 'surprising',
    fact: `A whole banana floats because its mix of fibrous tissue, water, and gas-filled pockets makes it slightly less dense than water. As it ripens it forms more air pockets and floats even more readily.`,
    quip: `Technically buoyant. Spiritually still a banana.`,
    sourceName: 'pH of Banana, Do Bananas Float in Water',
    sourceUrl: 'https://phofbanana.com/do-bananas-float-in-water/',
  },
  {
    id: 'ethylene-paper-bag',
    category: 'Science',
    rarity: 'common',
    fact: `The brown-paper-bag ripening trick works because the bag traps the ethylene gas the banana itself gives off, which drives the conversion of starch to sugar while still letting moisture escape.`,
    quip: `The banana ripens itself; the bag just keeps the secret.`,
    sourceName: 'Tasting Table',
    sourceUrl: 'https://www.tastingtable.com/1940755/science-of-ripen-fruit-brown-paper-bag/',
  },
  {
    id: 'ig-nobel-friction',
    category: 'Science',
    rarity: 'surprising',
    fact: `The 2014 Ig Nobel Prize in Physics went to a team at Kitasato University that measured the friction of a banana peel underfoot, on the shoe and on the floor.`,
    quip: `Peer review confirmed what every cartoon already knew.`,
    sourceName: 'Improbable Research, Ig Nobel winners',
    sourceUrl: 'https://improbable.com/ig/winners/',
  },
  {
    id: 'peel-near-teflon',
    category: 'Science',
    rarity: 'wild',
    fact: `A banana peel stepped on inner-side-down has a coefficient of friction of about 0.07 on linoleum, close to the slipperiness of Teflon at around 0.04 and ice at around 0.05.`,
    quip: `Nearly Teflon. The fruit was just showing off.`,
    sourceName: 'Tribology Online, primary paper',
    sourceUrl: 'https://www.jstage.jst.go.jp/article/trol/7/3/7_147/_pdf',
  },

  // ---- Nutrition ----
  {
    id: 'b6-not-potassium',
    category: 'Nutrition',
    rarity: 'surprising',
    fact: `Vitamin B6 is where a banana actually shines. One medium fruit supplies about 0.44 mg, roughly a quarter of the daily value, a larger share of a day's need than its potassium provides.`,
    quip: `B6. The vitamin nobody put on the poster.`,
    sourceName: 'USDA FoodData Central (FDC 173944)',
    sourceUrl: 'https://fdc.nal.usda.gov/food-details/173944/nutrients',
  },
  {
    id: 'out-potassiumed-by-potato',
    category: 'Nutrition',
    rarity: 'surprising',
    fact: `A banana is not a standout potassium food. A medium potato at 610 mg, watermelon, cooked spinach, beets, and half an avocado all beat a banana's roughly 422 mg per serving.`,
    quip: `Out-potassiumed by a potato. The mascot lost to the crowd.`,
    sourceName: 'Patricia Bannan, MS, RDN',
    sourceUrl: 'https://www.patriciabannan.com/blog/nutrition/5-foods-that-are-higher-in-potassium-than-a-banana/',
  },
  {
    id: 'green-banana-starch',
    category: 'Nutrition',
    rarity: 'surprising',
    fact: `A green banana is mostly starch, 12 to 35 percent of the pulp's fresh weight, which falls to under 1 percent when fully ripe as it converts to sugar.`,
    quip: `A green banana is a potato in witness protection.`,
    sourceName: 'Frontiers in Plant Science, 2019',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6454214/',
  },
  {
    id: 'resistant-starch-undercount',
    category: 'Nutrition',
    rarity: 'wild',
    fact: `A green banana holds so much resistant starch that standard fiber lab methods miss it. A method that captures it reads about 18 g per 100 g of fiber when unripe, versus about 2 g once ripe, while the traditional method reads about 2 g at every stage.`,
    quip: `The old method just shrugged and wrote down two.`,
    sourceName: 'PLOS One, Phillips et al. 2021',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8266066/',
  },
  {
    id: 'gi-doubles',
    category: 'Nutrition',
    rarity: 'surprising',
    fact: `Ripening roughly doubles a banana's glycemic index, from about 30 when green to around 51 when spotted, because resistant starch converts to simple sugars.`,
    quip: `Same fruit, double the trouble, zero remorse.`,
    sourceName: 'Foodstruct, banana glycemic index',
    sourceUrl: 'https://foodstruct.com/food/bananas/glycemic-index',
  },

  // ---- Culture ----
  {
    id: 'comedian-2024-sale',
    category: 'Culture',
    rarity: 'wild',
    fact: `Maurizio Cattelan's duct-taped banana artwork Comedian sold for about 6.2 million dollars at Sotheby's in November 2024, though the actual banana was bought from a Manhattan street vendor for 25 cents.`,
    quip: `The vendor should renegotiate.`,
    sourceName: 'The Art Newspaper',
    sourceUrl: 'https://www.theartnewspaper.com/2024/11/21/maurizio-cattelan-banana-sothebys-6-million-auction-comedian',
  },
  {
    id: 'comedian-datuna-ate-it',
    category: 'Culture',
    rarity: 'wild',
    fact: `When Comedian debuted at Art Basel Miami Beach in 2019, performance artist David Datuna pulled it off the wall and ate it, titling the act Hungry Artist. The gallery simply taped up a new banana.`,
    quip: `The gallery restocked. It was a produce problem, not a crime.`,
    sourceName: 'Designboom',
    sourceUrl: 'https://www.designboom.com/art/maurizio-cattelan-banana-art-basel-miami-12-06-2019/',
  },
  {
    id: 'warhol-peel-sticker',
    category: 'Culture',
    rarity: 'surprising',
    fact: `Andy Warhol's banana on the 1967 Velvet Underground and Nico album cover was a peel-off sticker. Removing it revealed a pink banana underneath the instruction Peel slowly and see.`,
    quip: `Album cover with a tutorial. Most do not require one.`,
    sourceName: 'The Velvet Underground and Nico, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/The_Velvet_Underground_%26_Nico',
  },
  {
    id: 'bananaman-1980',
    category: 'Culture',
    rarity: 'surprising',
    fact: `Bananaman first appeared on 16 February 1980 as Eric Wimp, a schoolboy at 29 Acacia Road who turns into a muscled superhero by eating a banana, a parody of Superman and Batman.`,
    quip: `His mother was right about the potassium.`,
    sourceName: 'Bananaman, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Bananaman',
  },
  {
    id: 'bananas-in-pyjamas',
    category: 'Culture',
    rarity: 'surprising',
    fact: `The Bananas in Pyjamas characters B1 and B2 grew out of a 1967 nursery song written by Carey Blyton, nephew of author Enid Blyton; the TV show debuted on Australia's ABC in 1992.`,
    quip: `Twenty-five years from nursery song to fully dressed produce.`,
    sourceName: 'Bananas in Pyjamas, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Bananas_in_Pyjamas',
  },
  {
    id: 'banana-ketchup-orosa',
    category: 'Culture',
    rarity: 'wild',
    fact: `Banana ketchup was invented by Filipina food chemist Maria Y. Orosa, who used saba bananas as a tomato substitute and created roughly 700 recipes. She died of shrapnel wounds in 1945 during the Battle of Manila.`,
    quip: `Seven hundred recipes. Your fridge has condiments older than that.`,
    sourceName: 'Maria Y. Orosa, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Maria_Orosa',
  },
  {
    id: 'blue-java',
    category: 'Culture',
    rarity: 'wild',
    fact: `The Blue Java or ice cream banana has soft flesh widely described as tasting like vanilla custard, and its unripe fruit looks silvery-blue from a heavy wax coat.`,
    quip: `Dessert that ripens on a tree and skips the freezer.`,
    sourceName: 'Blue Java banana, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Blue_Java_banana',
  },

  // ---- Records ----
  {
    id: 'largest-bunch-473',
    category: 'Records',
    rarity: 'wild',
    fact: `The largest bunch of bananas on record held 473 individual fruits and weighed 130 kg, grown in the Canary Islands in 2001, and it remains unbeaten.`,
    quip: `Retired, undefeated, since 2001.`,
    sourceName: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/largest-bunch-of-bananas',
  },
  {
    id: 'longest-split-8040m',
    category: 'Records',
    rarity: 'wild',
    fact: `The longest banana split ever made stretched 8,040 meters, about 5 miles, in Innisfail, Australia, in 2017, using roughly 40,000 bananas.`,
    quip: `Five miles of dessert. The far end melted, probably.`,
    sourceName: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/68443-longest-banana-split',
  },
  {
    id: 'big-banana-sculpture',
    category: 'Records',
    rarity: 'surprising',
    fact: `The largest banana sculpture is the 13-meter Big Banana in Coffs Harbour, Australia, built from timber and ferroconcrete and unveiled in 1964.`,
    quip: `Made of concrete in 1964. Still not ripe.`,
    sourceName: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/772372-largest-sculpture-of-a-banana',
  },
  {
    id: 'bertoletti-8',
    category: 'Records',
    rarity: 'surprising',
    fact: `The record for most bananas peeled and eaten in one minute is 8, set by competitive eater Patrick Bertoletti in 2012, about one banana every 7.5 seconds.`,
    quip: `Chew accordingly.`,
    sourceName: 'Guinness World Records',
    sourceUrl: 'https://www.guinnessworldrecords.com/world-records/most-bananas-peeled-and-eaten-in-one-minute',
  },
  {
    id: 'india-largest-producer',
    category: 'Records',
    rarity: 'surprising',
    fact: `India is the world's largest banana producer, growing about 36.6 million tonnes in 2023, roughly a quarter of the global total, yet it exports almost none of it.`,
    quip: `They keep all of them. Reasonable.`,
    sourceName: 'FAO 2023 data via FreshPlaza',
    sourceUrl: 'https://www.freshplaza.com/north-america/article/9452797/india-is-largest-banana-producer-ecuador-and-philippines-rule-the-global-market/',
  },
  {
    id: 'ecuador-largest-exporter',
    category: 'Records',
    rarity: 'surprising',
    fact: `Ecuador is the world's largest banana exporter, shipping roughly a quarter of all banana exports, despite ranking only about fifth in production.`,
    quip: `Punching above its weight, then shipping it.`,
    sourceName: 'FAO Banana Market Review via FreshPlaza',
    sourceUrl: 'https://www.freshplaza.com/north-america/article/9452797/india-is-largest-banana-producer-ecuador-and-philippines-rule-the-global-market/',
  },

  // ---- Language ----
  {
    id: 'top-banana-burlesque',
    category: 'Language',
    rarity: 'surprising',
    fact: `Top banana and second banana come from American burlesque, where the lead, supporting, and third comics were ranked as First, Second, and Third Banana. Banana meant the comic.`,
    quip: `Third Banana: the worst possible thing to be called.`,
    sourceName: 'Word Histories, top banana origin',
    sourceUrl: 'https://wordhistories.net/2018/07/04/top-banana-origin/',
  },
  {
    id: 'top-banana-musical-1951',
    category: 'Language',
    rarity: 'wild',
    fact: `The phrase top banana was cemented by the 1951 Broadway musical Top Banana, a star vehicle for Phil Silvers that won him the 1952 Tony for Best Leading Actor in a Musical.`,
    quip: `Won a Tony for produce-based career advice.`,
    sourceName: 'Top Banana (musical), Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Top_Banana_(musical)',
  },
  {
    id: 'bananas-means-crazy-1968',
    category: 'Language',
    rarity: 'surprising',
    fact: `Bananas meaning crazy can be reliably traced in print only to 1968, when a slang survey reported Kentucky college students using it for excited and wild, far later than most people assume.`,
    quip: `Younger than the moon landing, somehow.`,
    sourceName: 'The Straight Dope',
    sourceUrl: 'https://www.straightdope.com/21344487/how-did-em-nuts-em-and-em-bananas-em-come-to-mean-crazy',
  },
  {
    id: 'banana-word-1590s',
    category: 'Language',
    rarity: 'surprising',
    fact: `The English word banana is first attested in the 1590s and was borrowed through Spanish or Portuguese from a West African source, because European sailors met the fruit on the West African coast.`,
    quip: `Older than most countries that now sell it.`,
    sourceName: 'Online Etymology Dictionary',
    sourceUrl: 'https://www.etymonline.com/word/banana',
  },
  {
    id: 'wolof-vs-arabic',
    category: 'Language',
    rarity: 'surprising',
    fact: `The origin of the word banana is contested. The leading theory traces it to the Wolof word banaana, while a rival proposal points to the Arabic banan, meaning finger; neither is proven.`,
    quip: `Two theories, one fruit shaped like a finger anyway.`,
    sourceName: 'Janga Wolof',
    sourceUrl: 'https://jangawolof.org/2025/01/10/the-possible-wolof-origins-of-the-word-banana/',
  },
  {
    id: 'banana-republic-coined',
    category: 'Language',
    rarity: 'surprising',
    fact: `The term banana republic was popularized by writer O. Henry, who used it in a 1901 story and his 1904 book Cabbages and Kings to describe a fictional Central American country modeled on Honduras.`,
    quip: `The clothing store came later, and uninvited.`,
    sourceName: 'Merriam-Webster, History of Banana Republic',
    sourceUrl: 'https://www.merriam-webster.com/wordplay/banana-republic-word-history',
  },

  // ---- Oddities ----
  {
    id: 'abaca-not-cannabis',
    category: 'Oddities',
    rarity: 'surprising',
    fact: `Abaca, the banana species Musa textilis used for Manila hemp, is not related to cannabis hemp at all. It is a true banana endemic to the Philippines, prized for salt-resistant marine rope.`,
    quip: `Named hemp, related to bananas. Nobody checked the paperwork.`,
    sourceName: 'Abaca, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Abac%C3%A1',
  },
  {
    id: 'yen-banknotes-abaca',
    category: 'Oddities',
    rarity: 'wild',
    fact: `Japanese yen banknotes are made partly from abaca, a banana-plant fiber, blended with mitsumata bark.`,
    quip: `Money does grow on trees. Specifically banana ones.`,
    sourceName: 'Edge Davao, Abaca and the Japanese',
    sourceUrl: 'https://edgedavao.net/vantage-points/2016/12/fast-backward-abaca-japanese/',
  },
  {
    id: 'banana-spider-priapism',
    category: 'Oddities',
    rarity: 'wild',
    fact: `A toxin from the Brazilian wandering spider, one of the spiders called the banana spider, causes prolonged painful erections and is studied as a lead for erectile-dysfunction drugs.`,
    quip: `Read the side effects, then read them again, slowly.`,
    sourceName: 'Toxicon, Leite et al. 2012, via PubMed',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22750220/',
    sensitive: true,
  },
  {
    id: 'gros-michel-flavor-myth',
    category: 'Oddities',
    rarity: 'surprising',
    fact: `The story that artificial banana flavor tastes like the extinct Gros Michel is a myth. Isoamyl acetate is a simple compound synthesized in the 1800s, not modeled on any cultivar, and Gros Michel is not even truly extinct.`,
    quip: `Chemists invented it. The banana was not consulted.`,
    sourceName: 'Gros Michel, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Gros_Michel',
  },
  {
    id: 'st-louis-peel-ban-1909',
    category: 'Oddities',
    rarity: 'wild',
    fact: `Discarded banana peels were a real urban hazard once blamed for broken limbs, and St. Louis banned tossing them in public in 1909.`,
    quip: `Outlawed in St. Louis. The fruit had a record.`,
    sourceName: 'Today I Found Out',
    sourceUrl: 'http://www.todayifoundout.com/index.php/2013/11/origin-slipping-banana-peel-comedy-gag/',
  },
  {
    id: 'bed-origin',
    category: 'Oddities',
    rarity: 'surprising',
    fact: `The banana equivalent dose, a way to explain tiny radiation doses, was coined in 1995 by nuclear scientist Gary Mansfield in a post to a radiation-safety mailing list. It is a teaching device, never a formal unit.`,
    quip: `Born on a mailing list, never invited to the SI table.`,
    sourceName: 'Banana equivalent dose, Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Banana_equivalent_dose',
  },
];

/* ------------------------------------------------------------------ */
/* Rarity styling (mirrors the drops.ts pattern)                       */
/* ------------------------------------------------------------------ */

export const FACT_RARITY_COLOR: Record<FactRarity, string> = {
  common: '#5d9a3f', // app green
  surprising: '#d9a800', // accent deep / gold
  wild: '#7a4ab0', // purple, echoing the mythic drop tier
};

export const FACT_RARITY_LABEL: Record<FactRarity, string> = {
  common: 'Common knowledge',
  surprising: 'Surprising',
  wild: 'Wild but true',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Facts safe to surface at random in a family-rated context. Excludes
 * anything flagged `sensitive`. Use this as the default drop pool.
 */
export const DROPPABLE_FACTS: BananaFact[] = BANANA_FACTS.filter(
  (f) => !f.sensitive,
);

/** Pick one fact at random from a pool (default: the family-safe pool). */
export function randomFact(pool: BananaFact[] = DROPPABLE_FACTS): BananaFact {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Look up a fact by id. */
export function findFact(id: string): BananaFact | undefined {
  return BANANA_FACTS.find((f) => f.id === id);
}

/** All facts grouped by category, for a browsable Facts section. */
export function factsByCategory(): Record<FactCategory, BananaFact[]> {
  const out = {} as Record<FactCategory, BananaFact[]>;
  for (const f of BANANA_FACTS) {
    (out[f.category] ??= []).push(f);
  }
  return out;
}
