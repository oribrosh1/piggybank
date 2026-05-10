import type { ImageSourcePropType } from "react-native";

/**
 * Shown in “See examples” on the create-event flow. Swap the files in
 * `assets/images/invitation-examples/` (keep the same names) or add
 * `example-04.png` etc. and append a matching `require` below.
 */
export const INVITATION_EXAMPLE_IMAGES: ImageSourcePropType[] = [
  require("@/assets/images/invitation-examples/example-01.png"),
  require("@/assets/images/invitation-examples/example-02.png"),
  require("@/assets/images/invitation-examples/example-03.png"),
];
