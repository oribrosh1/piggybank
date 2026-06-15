import firebase from "@/src/firebase";
import firestore from "@react-native-firebase/firestore";
import { getAccountStatus, getChildCard } from "@/src/lib/api";

/**
 * True when the parent has finished Stripe Connect verification and the child has an issued card.
 * Until then, Home should mirror the My Event tab (event dashboard / party planner empty).
 */
export async function isParentSetupComplete(): Promise<boolean> {
  try {
    const accountStatus = await getAccountStatus();
    const bankingReady = Boolean(
      accountStatus.exists &&
        accountStatus.charges_enabled &&
        accountStatus.payouts_enabled,
    );
    if (!bankingReady) return false;

    const user = firebase.auth().currentUser;
    if (!user) return false;

    const childSnap = await firestore()
      .collection("childAccounts")
      .where("creatorId", "==", user.uid)
      .limit(1)
      .get();
    if (childSnap.empty) return false;

    const cardRes = await getChildCard(childSnap.docs[0].id);
    return Boolean(cardRes?.card?.id);
  } catch {
    return false;
  }
}
