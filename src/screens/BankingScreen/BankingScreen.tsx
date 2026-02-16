import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BankingBalanceCard,
  BankingWavyDivider,
  BankingNoAccountSection,
  BankingPendingSection,
  BankingVirtualCard,
  BankingApprovedContent,
  BankingRejectedSection,
  BankingFeaturesGrid,
} from "@/src/components/banking-screen";
import { useBankingScreen } from "./useBankingScreen";

export default function BankingScreen() {
  const insets = useSafeAreaInsets();
  const hook = useBankingScreen();

  const availableBalance =
    hook.balanceData?.available?.[0] != null
      ? (hook.balanceData.available[0].amount / 100).toFixed(2)
      : "0.00";

  return (
    <View style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F0FFFE" }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, backgroundColor: "#6B3AA0" }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={hook.refreshing}
            onRefresh={hook.onRefresh}
            tintColor="#6B3AA0"
            colors={["#6B3AA0"]}
          />
        }
      >
        <BankingBalanceCard
          loading={hook.loading}
          balanceTotalFormatted={hook.balanceTotalFormatted}
          kycStatus={hook.kycStatus}
        />
        <BankingWavyDivider />

        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 20 }}>
            YOUR CREDIT
          </Text>

          {hook.kycStatus === "no_account" && (
            <>
              <BankingNoAccountSection
                onSetupCredit={hook.handleSetupCredit}
                onTestVerify={hook.handleTestVerify}
                onTestAddBalance={hook.handleTestAddBalance}
              />
              <BankingFeaturesGrid />
            </>
          )}

          {hook.kycStatus === "pending" && (
            <BankingPendingSection onRefresh={hook.onRefresh} />
          )}

          {hook.kycStatus === "approved" && (
            <>
              <BankingVirtualCard
                cardScale={hook.cardScale}
                cardOpacity={hook.cardOpacity}
                cardVisible={hook.cardVisible}
                availableBalance={availableBalance}
                onToggleVisibility={hook.toggleCardVisibility}
                onCopyNumber={hook.handleCopyCardNumber}
              />
              <BankingApprovedContent
                router={hook.router}
                accountDetails={hook.accountDetails}
                balanceData={hook.balanceData}
                issuingBalance={hook.issuingBalance}
                transactions={hook.transactions}
                payouts={hook.payouts}
                loadingTransactions={hook.loadingTransactions}
                requestingPayout={hook.requestingPayout}
                toppingUp={hook.toppingUp}
                creatingCard={hook.creatingCard}
                onRefresh={hook.onRefresh}
                onTopUp={hook.handleTopUp}
                onCreateCard={hook.handleCreateCard}
                onRequestPayout={hook.handleRequestPayout}
                onTestVerify={hook.handleTestVerify}
                onTestAddBalance={hook.handleTestAddBalance}
                onTestCreateTransaction={hook.handleTestCreateTransaction}
              />
            </>
          )}

          {hook.kycStatus === "rejected" && (
            <BankingRejectedSection onTryAgain={hook.handleSetupCredit} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
