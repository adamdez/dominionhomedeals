export type LevelId =
  | "grounds"
  | "main"
  | "bedrooms"
  | "primary"
  | "lower"
  | "basement";
export type TourPhoto = { src: string; alt: string };
export type TourRoom = {
  id: string;
  level: LevelId;
  name: string;
  short: string;
  story: string;
  direction: string;
  photos: TourPhoto[];
  box: [number, number, number, number];
};
const photo = (n: number, alt: string): TourPhoto => ({
  src: `/images/black-road/${n}.webp`,
  alt,
});
export const levels: { id: LevelId; name: string; subtitle: string }[] = [
  {
    id: "grounds",
    name: "The setting",
    subtitle: "The house and its outdoor spaces",
  },
  {
    id: "main",
    name: "Main living",
    subtitle: "Front entry and everyday gathering spaces",
  },
  {
    id: "bedrooms",
    name: "Bedroom landing",
    subtitle: "First flight up from the main hall",
  },
  {
    id: "primary",
    name: "Primary suite",
    subtitle: "Next flight up with a separate storage nook",
  },
  {
    id: "lower",
    name: "Family room",
    subtitle: "A short flight down from the main hall",
  },
  {
    id: "basement",
    name: "Basement",
    subtitle: "Unfinished storage and mechanical space",
  },
];
export const rooms: TourRoom[] = [
  {
    id: "arrival",
    level: "grounds",
    name: "A home with presence",
    short: "The house",
    story:
      "Tudor-inspired lines. Stone accents. A setting framed by tall pines. Black Road has the kind of character that begins before you reach the front door.",
    direction: "Start outside. Then follow the tour through the front entry.",
    photos: [
      photo(
        8021,
        "Exterior of Black Road with timber detailing and broad steps",
      ),
      photo(2055, "Wide view of the house from the approach"),
      photo(8023, "Exterior showing the balcony and projecting bedroom window"),
      photo(2054, "Paved approach beside the house"),
    ],
    box: [160, 100, 200, 145],
  },
  {
    id: "entry",
    level: "main",
    name: "An entrance with a choice",
    short: "Entry & hall",
    story:
      "The entry opens toward a dividing wall. The living room unfolds to your left. Turn right and the hall carries you toward the kitchen and the split-level stairs.",
    direction:
      "At the far end of the hall turn left for kitchen and dining. Go up to the bedrooms or down on the right to the family room.",
    photos: [
      photo(1979, "Wall facing the front entrance"),
      photo(1980, "Main hallway viewed from the entry"),
      photo(
        1995,
        "Main stair junction with kitchen left and lower stairs right",
      ),
      photo(1985, "Entry door and dividing wall seen from the living room"),
    ],
    box: [205, 155, 100, 160],
  },
  {
    id: "living",
    level: "main",
    name: "The living room",
    short: "Living room",
    story:
      "A tall stone fireplace wall and an overhead loft give this room its identity. Broad windows bring the wooded setting into the main gathering space.",
    direction:
      "Turn left as you enter the front door. The loft above is reached through the primary bedroom.",
    photos: [
      photo(7708, "Living room and broad bank of windows"),
      photo(1983, "Tall stone fireplace wall and loft railing"),
      photo(1984, "Living room looking back toward the entry"),
    ],
    box: [20, 155, 185, 160],
  },
  {
    id: "kitchen",
    level: "main",
    name: "The kitchen",
    short: "Kitchen",
    story:
      "Wood cabinetry and a central island anchor the kitchen. It is an existing space to refresh around your own finishes and routines.",
    direction:
      "At the end of the main hallway turn left into the kitchen and dining area.",
    photos: [
      photo(7728, "Kitchen with wood cabinets and central island"),
      photo(7727, "Reverse angle of kitchen and island"),
      photo(1996, "Kitchen and dining openings from the main hall"),
    ],
    box: [20, 20, 185, 120],
  },
  {
    id: "dining",
    level: "main",
    name: "Dining beside the deck",
    short: "Dining",
    story:
      "The turquoise dining area sits alongside the kitchen. Glass doors and nearby outdoor seating make the deck part of the experience.",
    direction:
      "Explore the dining area beside the kitchen. The photos also show the glass doors facing the deck.",
    photos: [
      photo(7739, "Turquoise dining room with window and glass doors"),
      photo(7738, "Dining room view from the kitchen"),
      photo(1999, "Glass doors opening toward the covered deck"),
    ],
    box: [205, 20, 140, 120],
  },
  {
    id: "service",
    level: "main",
    name: "The practical spaces",
    short: "Laundry & garage",
    story:
      "A laundry room and a main-floor half bath support the living spaces. The attached garage is accessed through a separate passage.",
    direction:
      "These rooms are grouped here for the tour. Their exact position along the service passage is still being mapped.",
    photos: [
      photo(1987, "Laundry and half-bath doorways"),
      photo(7714, "Main-floor half bathroom"),
      photo(1990, "Laundry room with washer and dryer"),
      photo(1992, "Doorway from house into attached garage"),
      photo(1993, "Interior of attached garage"),
    ],
    box: [365, 20, 120, 120],
  },
  {
    id: "landing",
    level: "bedrooms",
    name: "The bedroom landing",
    short: "Landing",
    story:
      "Three doors make this landing easy to understand. The bathroom is on the left. The room with the window seat is straight ahead. The balcony bedroom is on the right.",
    direction:
      "The stairs beside this landing continue up to the primary suite and the separate corner nook.",
    photos: [
      photo(
        2017,
        "Bedroom landing with bathroom left bedroom ahead and bedroom right",
      ),
      photo(2018, "Bathroom and sitting-window bedroom doors from the landing"),
      photo(2027, "Next flight of stairs leading to the primary level"),
    ],
    box: [175, 125, 135, 230],
  },
  {
    id: "window-bedroom",
    level: "bedrooms",
    name: "The window-seat bedroom",
    short: "Window-seat room",
    story:
      "A projecting window with bench seating creates a distinctive corner for reading or looking out over the property. This bedroom was furnished as an office during the walkthrough.",
    direction: "Walk straight ahead from the first upstairs landing.",
    photos: [
      photo(2021, "Bedroom doorway with bench-seated projecting window ahead"),
      photo(2022, "Bedroom furnished as an office with built-in shelves"),
      photo(2023, "Window-seat bedroom storage and shelving"),
    ],
    box: [175, 15, 135, 110],
  },
  {
    id: "balcony-bedroom",
    level: "bedrooms",
    name: "The balcony bedroom",
    short: "Balcony bedroom",
    story:
      "The second bedroom on this landing has its own small outdoor balcony. The photographs connect the room to that private outdoor space.",
    direction: "Take the door on the right of the first upstairs landing.",
    photos: [
      photo(7826, "Bedroom with door toward the small balcony"),
      photo(2025, "Balcony doorway looking back into the bedroom"),
      photo(2024, "Small bedroom balcony overlooking the trees"),
    ],
    box: [310, 125, 175, 140],
  },
  {
    id: "hall-bath",
    level: "bedrooms",
    name: "The shared bathroom",
    short: "Hall bath",
    story:
      "The bathroom beside the two bedrooms has a long vanity and a blue tub and shower area. Its existing finishes are visible in the photos.",
    direction: "Take the door on the left of the first upstairs landing.",
    photos: [
      photo(2019, "View into the shared bathroom from the landing"),
      photo(2020, "Shared bathroom with blue tub long vanity and toilet"),
    ],
    box: [20, 125, 155, 140],
  },
  {
    id: "primary-bedroom",
    level: "primary",
    name: "The primary retreat",
    short: "Primary bedroom",
    story:
      "The primary bedroom occupies the next upper level. A large closet and a separate unfinished bathroom open off its right side. Straight ahead is the loft above the living room.",
    direction:
      "Enter from the upper landing. First door right is the closet. Second door right is the bathroom. The loft door is straight ahead.",
    photos: [
      photo(2034, "Wide view across the primary bedroom"),
      photo(2032, "Primary bedroom with blue walls and upper windows"),
      photo(2031, "Primary bedroom entrance from the upper landing"),
      photo(
        2028,
        "Upper landing with primary bedroom left and nook to the right",
      ),
    ],
    box: [65, 110, 230, 205],
  },
  {
    id: "closet",
    level: "primary",
    name: "The large closet",
    short: "Closet",
    story:
      "A dedicated closet gives the primary bedroom a separate space for clothing and storage.",
    direction:
      "The first door on your right when entering the primary bedroom. The bathroom has its own separate bedroom doorway.",
    photos: [
      photo(2033, "Clothing rails and storage in the primary closet area"),
    ],
    box: [295, 215, 185, 100],
  },
  {
    id: "primary-bath",
    level: "primary",
    name: "A bathroom to finish your way",
    short: "Unfinished bath",
    story:
      "This bathroom is unfinished. The toilet and exposed plumbing connections are visible. Finishing this room is part of the work to evaluate before purchase.",
    direction:
      "The second door on your right when entering the primary bedroom.",
    photos: [
      photo(
        2035,
        "Unfinished primary bathroom with exposed plumbing and toilet",
      ),
      photo(2036, "Reverse view of unfinished primary bathroom"),
    ],
    box: [295, 110, 185, 105],
  },
  {
    id: "loft",
    level: "primary",
    name: "Above the living room",
    short: "Loft",
    story:
      "A narrow loft looks down into the living room along the stone fireplace wall. It gives the primary level a visual connection to the heart of the house.",
    direction:
      "Walk straight through the primary bedroom to the door ahead. This is separate from the storage nook off the upper landing.",
    photos: [
      photo(2037, "Door from primary bedroom toward loft"),
      photo(2038, "Loft railing overlooking living room and stone fireplace"),
    ],
    box: [65, 20, 230, 90],
  },
  {
    id: "nook",
    level: "primary",
    name: "The corner nook",
    short: "Corner nook",
    story:
      "A separate nook under the sloped ceiling provides an additional storage space at the top of the stairs.",
    direction:
      "On the RIGHT side of the upper landing. It is on the same side of the house as the primary closet and bathroom.",
    photos: [
      photo(2029, "Entrance to corner nook from upper landing"),
      photo(2030, "Sloped ceiling and storage in the corner nook"),
      photo(2028, "Upper landing showing nook doorway"),
    ],
    box: [295, 315, 185, 80],
  },
  {
    id: "family",
    level: "lower",
    name: "A second place to gather",
    short: "Family room",
    story:
      "A separate family room sits a short flight below the main hallway. Windows and a stove give it its own feel. Consider a second lounge or media room after reviewing the space in person.",
    direction:
      "From the main hall take the stairs down on the right. The lower landing also has an exterior door and stairs down to the unfinished basement.",
    photos: [
      photo(2004, "Entry into finished lower family room"),
      photo(2005, "Lower family room windows and stove"),
      photo(2006, "Reverse angle of family room"),
      photo(2003, "Lower landing and exterior door"),
      photo(
        2010,
        "Lower landing showing stairs up and separate basement stair door",
      ),
    ],
    box: [55, 45, 290, 230],
  },
  {
    id: "basement-storage",
    level: "basement",
    name: "Storage below",
    short: "Unfinished basement",
    story:
      "Below the family-room level is unfinished storage and mechanical space. Exposed framing and equipment are shown as they were during the walkthrough.",
    direction:
      "Enter through the separate basement stair door off the lower landing. This area is not presented as finished living space or additional bedrooms.",
    photos: [
      photo(2011, "Stairway down to unfinished basement"),
      photo(2012, "Unfinished basement storage and exposed framing"),
      photo(2013, "Basement mechanical and storage area"),
      photo(2015, "Basement staircase and pressure tank"),
    ],
    box: [55, 50, 365, 240],
  },
  {
    id: "deck",
    level: "grounds",
    name: "Room to step outside",
    short: "Deck",
    story:
      "Decks and outdoor seating extend the experience beyond the rooms. Tall trees frame the views from the covered portion and open seating areas.",
    direction:
      "Explore the deck and the adjoining yard. Deck condition and any needed repairs should be reviewed in person.",
    photos: [
      photo(2041, "Covered deck beneath wood roof framing"),
      photo(2043, "Deck steps looking into wooded yard"),
      photo(2045, "Deck seating alongside the house"),
      photo(2047, "Exterior showing glass doors and deck steps"),
    ],
    box: [160, 245, 200, 95],
  },
  {
    id: "grounds",
    level: "grounds",
    name: "12.8 acres in Chattaroy",
    short: "Grounds",
    story:
      "Open lawn gives way to a wooded setting around the house. The county records a 12.8-acre parcel. The acreage is a central part of what makes this property worth exploring.",
    direction:
      "These photos show the immediate setting. They do not mark property boundaries.",
    photos: [
      photo(7950, "Open lawn and tall pine trees around the property"),
      photo(2046, "Trees and yard seen from the deck"),
      photo(8044, "View across lawn and the property approach"),
      photo(2049, "Yard and outbuildings"),
    ],
    box: [20, 20, 125, 320],
  },
  {
    id: "outbuildings",
    level: "grounds",
    name: "Space for the practical side of life",
    short: "Outbuildings",
    story:
      "The attached garage and additional outbuildings offer places to evaluate for storage or hobbies. The photos show their current condition.",
    direction:
      "Explore the exterior structures. Dimensions and permitted uses have not been established by this photo tour.",
    photos: [
      photo(2051, "Detached outbuilding with roll-up door"),
      photo(2052, "Side of detached outbuilding"),
      photo(2053, "Attached garage exterior"),
      photo(1993, "Attached garage interior"),
    ],
    box: [375, 55, 110, 230],
  },
];
export const tourPhotoCount = new Set(
  rooms.flatMap((room) => room.photos.map((p) => p.src)),
).size;
