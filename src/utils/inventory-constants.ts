export const CATEGORIES = [
  "Produce", 
  "Dairy", 
  "Bakery", 
  "Meat", 
  "Beverages", 
  "Snacks", 
  "Pantry"
];

export const UNIT_TYPES = [
  "kg", "g", "L", "ml", "pcs", "pack", "oz", "lb"
];

export const PRICE_RANGES = [
  { label: "Under $5", min: 0, max: 5 },
  { label: "$5 - $10", min: 5, max: 10 },
  { label: "$10 - $20", min: 10, max: 20 },
  { label: "Over $20", min: 20, max: Infinity }
];