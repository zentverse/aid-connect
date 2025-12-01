import { AidCategory } from "./types";

export const DISTRICTS = [
  "Gampaha",
  "Colombo",
  "Puttalam",
  "Mannar",
  "Trincomalee",
  "Batticaloa",
  "Kandy",
  "Badulla",
  "Matale",
  "Kurunegala",
  "Ampara",
  "Rathnapura",
  "Mullaitivu",
  "Killinochchi",
  "Vavuniya",
  "Jaffna"
];

export const REGIONS: Record<string, string[]> = {
  "Gampaha": ["Negombo", "Gampaha City", "Kelaniya", "Wattala", "Ja-Ela", "Minuwangoda", "Mirigama", "Attanagalla", "Divulapitiya", "Mahara", "Dompe", "Biyagama"],
  "Colombo": ["Colombo Fort", "Pettah", "Borella", "Cinnamon Gardens", "Maradana", "Havelock Town", "Wellawatte", "Dehiwala", "Mount Lavinia", "Moratuwa", "Kotte", "Battaramulla", "Nugegoda", "Maharagama", "Homagama", "Avissawella", "Kolonnawa", "Kaduwela", "Kesbewa", "Padukka"],
  "Puttalam": ["Puttalam Town", "Chilaw", "Nattandiya", "Wennappuwa", "Mahawewa", "Anamaduwa", "Kalpitiya", "Mundel", "Dankotuwa", "Karuwalagaswewa", "Nawagattegama", "Vanathavilluwa"],
  "Mannar": ["Mannar Town", "Nanattan", "Musali", "Madhu", "Manthai West"],
  "Trincomalee": ["Trincomalee Town", "Kantale", "Kinniya", "Mutur", "Kuchchaveli", "Seruvila", "Thampalakamam", "Gomarankadawala", "Morawewa", "Padavi Sripura", "Verugal"],
  "Batticaloa": ["Batticaloa", "Kattankudy", "Eravur Town", "Eravur Pattu", "Koralai Pattu (Valaichchenai)", "Manmunai North", "Porativu Pattu", "Kaluwanchikudy", "Vavunathivu"],
  "Kandy": ["Kandy City", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya", "Kundasale", "Gangawata Korale", "Pathadumbara", "Udunuwara", "Yatinuwara", "Harispattuwa", "Teldeniya", "Digana"],
  "Badulla": ["Badulla", "Bandarawela", "Haputale", "Mahiyanganaya", "Welimada", "Hali-Ela", "Ella", "Passara", "Uva Paranagama", "Soranathota"],
  "Matale": ["Matale", "Dambulla", "Sigiriya", "Rattota", "Ukuwela", "Yatawatta", "Pallepola", "Naula", "Galewela", "Wilgamuwa", "Laggala-Pallegama"],
  "Kurunegala": ["Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Nikaweratiya", "Mawathagama", "Polgahawela", "Ibbagamuwa", "Pannala", "Giriulla", "Hettipola", "Bingiriya"],
  "Ampara": ["Ampara", "Kalmunai", "Sammanthurai", "Akkaraipattu", "Pottuvil", "Uhana", "Damana", "Dehiattakandiya", "Padiyathalawa", "Mahaoya", "Addalaichenai", "Alayadivembu"],
  "Rathnapura": ["Rathnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Nivitigala", "Imbulpe", "Godakawela", "Kahawatta", "Rakwana", "Weligepola"],
  "Mullaitivu": ["Mullaitivu Town", "Puthukkudiyiruppu", "Oddusuddan", "Tunukkai", "Manthai East", "Welioya"],
  "Killinochchi": ["Killinochchi Town", "Poonakary", "Karachchi", "Pachchilaipalli", "Kandavalai"],
  "Vavuniya": ["Vavuniya Town", "Vavuniya South", "Vavuniya North", "Cheddikulam", "Venkalacheddikulam"],
  "Jaffna": ["Jaffna Town", "Nallur", "Chavakachcheri", "Point Pedro", "Kankesanthurai", "Kopay", "Sandilipay", "Tellippalai", "Uduvil", "Chankanai", "Karainagar", "Velanai", "Kayts", "Delft"]
};

// Flattened list for backward compatibility or simple listings
export const LOCATIONS = Object.entries(REGIONS).flatMap(([district, regions]) => 
  regions.map(region => `${district} - ${region}`)
);

export const CATEGORIES = Object.values(AidCategory);

export const UNITS = [
  "units",
  "packs",
  "kg",
  "liters",
  "boxes",
  "pairs",
  "sets"
];