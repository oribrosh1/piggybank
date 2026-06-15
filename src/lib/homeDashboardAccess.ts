import firebase from "@/src/firebase";
import firestore from "@react-native-firebase/firestore";
import { getAccountStatus, getChildCard } from "@/src/lib/api";

/** Full home dashboard unlocks after Stripe verification and a CreditKid card exist. */
export async function isFullHomeDashboardUnlocked(): Promise<boolean> {
  try {
    const accountStatus = await getAccountStatus();
    const stripeVerified = Boolean(
      accountStatus.exists &&
        accountStatus.charges_enabled &&
        accountStatus.payouts_enabled,
    );
    if (!stripeVerified) return false;

    const user = firebase.auth().currentUser;
    if (!user) return false;

    const childSnap = await firestore()
      .collection("childAccounts")
      .where("creatorId", "==", user.uid)
      .limit(1)
      .get();
    if (childSnap.empty) return false;

    const cardRes = await getChildCard(childSnap.docs[0].id);
    return Boolean(cardRes.success && cardRes.card?.id);
  } catch {
    return false;
  }
}
