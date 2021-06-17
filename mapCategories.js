
module.exports = {
    mapCategories : (category) => {
        switch (category) {
            case "Beds":
                return "beds";
            case "Sofas":
                return "sofas";
            case "Dining Tables":
                return "dining tables";
            case "Other Furniture":
                return "similar items";
            case "Coffee Tables":
                return "coffee tables";
            case "Cabinets":
                return "cabinets";
            case "Desks":
                return "desks";
            case "Entertainment & TV Units":
                return "TV Units";
            case "Dining Chairs":
                return "dining chairs";
            case "Bookcases & Shelves":
                return "bookcases & shelves";
            case "Armchairs":
                return "armchairs";
            case "Dressers & Drawers":
                return "dressers & drawers";
            case "Buffets & Side Tables":
                return "buffets & side tables";
            case "Stools & Bar stools":
                return "stools & bar stools";
            case "Mirrors":
                return "mirrors";
            case "Bedside Tables":
                return "bedside tables";
            case "Office Chairs":
                return "office chairs";
            case "Wardrobes":
                return "wardrobes";
        }
    }
}
