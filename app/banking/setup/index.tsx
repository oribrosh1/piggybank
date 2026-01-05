import { routes } from "../../../types/routes";
import { Redirect } from "expo-router";

export default function SetupIndex() {
  return <Redirect href={routes.banking.setup.personalInfo} />;
}
