// Re-export event dashboard utils so components in this folder can use "./utils"
// Source of truth: src/components/events/utils.ts
export {
  formatDate,
  getEventTypeLabel,
  getEventCategoryLabel,
  getKosherLabel,
  getMealTypeLabel,
  getVegetarianLabel,
  getGuestStatusConfig,
} from "@/src/components/events/utils";
