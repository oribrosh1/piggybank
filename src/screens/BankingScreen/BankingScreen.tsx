import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  DollarSign,
  Banknote,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { routes } from "@/types/routes";
import { useBankingScreen } from "./useBankingScreen";

export default function BankingScreen() {
  const insets = useSafeAreaInsets();
  const {
    router,
    accountData,
    accountDetails,
    balanceData,
    issuingBalance,
    transactions,
    payouts,
    loading,
    loadingTransactions,
    requestingPayout,
    toppingUp,
    creatingCard,
    kycStatus,
    refreshing,
    cardVisible,
    cardScale,
    cardOpacity,
    balanceTotalFormatted,
    onRefresh,
    handleSetupCredit,
    toggleCardVisibility,
    handleCopyCardNumber,
    handleTopUp,
    handleCreateCard,
    handleRequestPayout,
    handleTestVerify,
    handleTestAddBalance,
    handleTestCreateTransaction,
  } = useBankingScreen();

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F0FFFE" }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, backgroundColor: "#6B3AA0" }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6B3AA0"
            colors={["#6B3AA0"]}
          // backgroundColor="#F0FFFE"
          />
        }
      >
        {/* Big Balance Card */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 24, marginBottom: 0, backgroundColor: "#F0FFFE" }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#06D6A0",
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              💎 YOUR TOTAL BALANCE
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#06D6A0" style={{ marginVertical: 20 }} />
            ) : (
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "800",
                  color: "#06D6A0",
                  marginBottom: 12,
                }}
              >
                ${balanceTotalFormatted}
              </Text>
            )}
            <View
              style={{
                height: 6,
                backgroundColor: "#E0F7F4",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "0%",
                  backgroundColor: "#06D6A0",
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginTop: 8,
                fontWeight: "500",
              }}
            >
              {kycStatus === 'approved' ? 'Ready to earn! 🚀' :
                kycStatus === 'pending' ? 'Verification in progress ⏳' :
                  'Set up credit to start! '}
            </Text>
          </View>
        </View>

        {/* Wavy Divider */}
        <View style={{ height: 40, marginBottom: -1, backgroundColor: "#F0FFFE" }}>
          <Svg
            width="100%"
            height="40"
            viewBox="0 0 390 40"
            preserveAspectRatio="none"
          >
            <Path
              d="M0,20 Q98,0 196,20 T392,20 L392,40 L0,40 Z"
              fill="#6B3AA0"
            />
          </Svg>
        </View>

        {/* Purple Section */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Section Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#FFFFFF",
              marginBottom: 20,
            }}
          >
            YOUR CREDIT 
          </Text>

          {/* No Account State */}
          {kycStatus === 'no_account' && (
            <View>
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#06D6A0",
                    borderStyle: "dashed",
                  }}
                >
                  <CreditCard size={48} color="#06D6A0" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginTop: 16,
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    No credit yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.9)",
                      textAlign: "center",
                    }}
                  >
                    Create your first virtual credit card to start earning! 💰
                  </Text>
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleSetupCredit}
                style={{
                  backgroundColor: "#06D6A0",
                  borderRadius: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <Plus size={24} color="#6B3AA0" strokeWidth={3} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B3AA0" }}>
                  SET UP CREDIT
                </Text>
              </TouchableOpacity>

              {/* 🧪 TEST MODE - Available even before setup */}
              {__DEV__ && (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    padding: 20,
                    marginTop: 10,
                    borderWidth: 2,
                    borderColor: "#E879F9",
                    borderStyle: "dashed",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      marginBottom: 12,
                    }}
                  >
                    🧪 TEST MODE (Dev Only)
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: 16,
                      fontWeight: "500",
                    }}
                  >
                    1. Tap "SET UP CREDIT" to set up your Stripe account{"\n"}
                    2. Tap "Verify for Testing" to enable transfers{"\n"}
                    3. Then add test money!
                  </Text>

                  <View style={{ gap: 10 }}>
                    {/* Step 2: Verify Account */}
                    <TouchableOpacity
                      onPress={handleTestVerify}
                      style={{
                        backgroundColor: "#059669",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        ✅ Step 2: Verify for Testing
                      </Text>
                    </TouchableOpacity>

                    {/* Step 3: Add Balance */}
                    <TouchableOpacity
                      onPress={() => handleTestAddBalance(5000)}
                      style={{
                        backgroundColor: "#A21CAF",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        💰 Step 3: Add $50 Test Balance
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* KYC Pending State */}
          {kycStatus === 'pending' && (
            <View>
              {/* Hero Status Card */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                {/* Countdown Timer */}
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#F0FDF4",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      borderWidth: 6,
                      borderColor: "#10B981",
                    }}
                  >
                    <Clock size={48} color="#10B981" strokeWidth={2} />
                  </View>

                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: "#111827",
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    Verification in progress
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      fontWeight: "600",
                      textAlign: "center",
                      lineHeight: 20,
                      marginBottom: 16,
                    }}
                  >
                    Stripe is verifying your account. Pull to refresh to check status.
                  </Text>
                  <TouchableOpacity
                    onPress={onRefresh}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      backgroundColor: "#10B981",
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Check status</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Timeline – based on Stripe account (details_submitted = in progress) */}
                <View
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    padding: 18,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#111827",
                      marginBottom: 14,
                      letterSpacing: 0.5,
                    }}
                  >
                    VERIFICATION PROGRESS
                  </Text>

                  <View style={{ gap: 14 }}>
                    {[
                      { label: "Personal info received", done: true, emoji: "📝" },
                      { label: "ID document uploaded", done: true, emoji: "🆔" },
                      { label: "Identity verification", done: false, emoji: "🔍" },
                      { label: "Account approval", done: false, emoji: "✅" },
                    ].map((step, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        {/* Step Indicator */}
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: step.done ? "#10B981" : "#E5E7EB",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          {step.done ? (
                            <CheckCircle size={18} color="#FFFFFF" strokeWidth={3} />
                          ) : (
                            <Text style={{ fontSize: 16 }}>{step.emoji}</Text>
                          )}
                        </View>

                        {/* Step Content */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: step.done ? "700" : "600",
                              color: step.done ? "#059669" : "#6B7280",
                            }}
                          >
                            {step.label}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        {step.done && (
                          <View
                            style={{
                              backgroundColor: "#D1FAE5",
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: "#059669",
                              }}
                            >
                              DONE
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Quick Approval Message */}
                <View
                  style={{
                    backgroundColor: "#ECFDF5",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#A7F3D0",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#10B981",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: "#065F46",
                        marginBottom: 4,
                      }}
                    >
                      Fast Verification! ⚡
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#047857",
                        fontWeight: "600",
                      }}
                    >
                      Your account will be ready in just ~5 minutes!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info Card */}
              <View
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 30,
                  borderWidth: 2,
                  borderColor: "rgba(139, 92, 246, 0.2)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#8B5CF6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Shield size={20} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#FFFFFF",
                        marginBottom: 8,
                      }}
                    >
                      Why KYC is Required? 🔐
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.95)",
                        lineHeight: 20,
                        fontWeight: "500",
                        marginBottom: 14,
                      }}
                    >
                      Federal law requires identity verification for anyone receiving a payment card. This protects you and ensures compliance.
                    </Text>

                    {/* Features */}
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                          Secure Stripe verification
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>🔒</Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                          Your data is encrypted
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>⚡</Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                          One-time verification only
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* KYC Approved State - Show Virtual Card */}
          {kycStatus === 'approved' && (
            <View>
              {/* Virtual Card */}
              <Animated.View
                style={{
                  transform: [{ scale: cardScale }],
                  opacity: cardOpacity,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#06D6A0",
                    borderRadius: 20,
                    padding: 22,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 18,
                    elevation: 10,
                  }}
                >
                  {/* Card Header */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 32 }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#6B3AA0" }}>
                      CreditKid Card 
                    </Text>
                    <CreditCard size={22} color="#6B3AA0" strokeWidth={2.5} />
                  </View>

                  {/* Card Number */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 8, fontWeight: "700" }}>
                      CARD NUMBER
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: "#6B3AA0", letterSpacing: 2 }}>
                        {cardVisible ? "4242 4242 4242 4242" : "**** **** **** 4242"}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <TouchableOpacity onPress={toggleCardVisibility}>
                          {cardVisible ? (
                            <EyeOff size={18} color="#6B3AA0" />
                          ) : (
                            <Eye size={18} color="#6B3AA0" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCopyCardNumber}>
                          <Copy size={18} color="#6B3AA0" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Card Details */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>
                        VALID THRU
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>
                        {cardVisible ? "12/28" : "**/**"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>
                        CVV
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>
                        {cardVisible ? "123" : "***"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>
                        BALANCE
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>
                        ${balanceData?.available?.[0]
                          ? (balanceData.available[0].amount / 100).toFixed(2)
                          : '0.00'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Add to Apple Pay Wallet */}
              <TouchableOpacity
                onPress={() => {
                  // TODO: Implement Apple Pay Wallet integration
                  alert("Add to Apple Pay Wallet");
                }}
                style={{
                  backgroundColor: "#000000",
                  borderRadius: 14,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginRight: 8 }}>
                  Add to
                  Apple Pay
                </Text>
                <Text style={{ fontSize: 24, marginLeft: 6 }}>📱</Text>
              </TouchableOpacity>

              {/* Success Message */}
              <View
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginLeft: 10,
                    }}
                  >
                    Account Verified! 🎉
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.95)",
                    lineHeight: 18,
                    fontWeight: "500",
                  }}
                >
                  Your identity is verified by Stripe. You can now receive payments and use your card anywhere!
                </Text>
              </View>

              {/* Get your virtual card – links to issuing onboarding */}
              {!accountDetails?.virtualCardId && (
                <TouchableOpacity
                  onPress={() => router.push(routes.banking.setup.issuingCard)}
                  style={{
                    backgroundColor: "#8B5CF6",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    shadowColor: "#8B5CF6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <CreditCard size={24} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 }}>
                        Get your virtual card
                      </Text>
                      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
                        Create a virtual credit card to spend from your balance
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              {/* Stage 2.5 + 3: Issuing balance, Add funds, Create Card */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#6B3AA0",
                    marginBottom: 12,
                  }}
                >
                  💳 CARD BALANCE (Issuing)
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: "#111827",
                    marginBottom: 16,
                  }}
                >
                  {issuingBalance != null
                    ? issuingBalance.issuingAvailableFormatted
                    : "—"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  {[1000, 2500, 5000].map((cents) => (
                    <TouchableOpacity
                      key={cents}
                      onPress={() => handleTopUp(cents)}
                      disabled={toppingUp}
                      style={{
                        backgroundColor: toppingUp ? "#D1D5DB" : "#8B5CF6",
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                        +${(cents / 100).toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleCreateCard}
                  disabled={!issuingBalance?.canCreateCard || creatingCard}
                  style={{
                    backgroundColor:
                      issuingBalance?.canCreateCard && !creatingCard ? "#06D6A0" : "#D1D5DB",
                    borderRadius: 12,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {creatingCard ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <CreditCard size={18} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    {issuingBalance?.canCreateCard
                      ? "Create virtual card"
                      : "Add funds above to create card"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Stripe Connected Account – Balance & Transactions */}
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Wallet size={22} color="#FFFFFF" strokeWidth={2.5} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      marginLeft: 10,
                    }}
                  >
                    Stripe Connected Account
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    marginBottom: 16,
                    marginLeft: 32,
                  }}
                >
                  Balance and activity for your connected account
                </Text>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#6B3AA0",
                      marginBottom: 12,
                    }}
                  >
                    Balance
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600" }}>Available</Text>
                      <Text style={{ fontSize: 22, fontWeight: "800", color: "#10B981" }}>
                        ${balanceData?.available?.[0] ? (balanceData.available[0].amount / 100).toFixed(2) : "0.00"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600" }}>Pending</Text>
                      <Text style={{ fontSize: 22, fontWeight: "800", color: "#F59E0B" }}>
                        ${balanceData?.pending?.[0] ? (balanceData.pending[0].amount / 100).toFixed(2) : "0.00"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#6B3AA0" }}>
                      All transactions
                    </Text>
                    <TouchableOpacity onPress={onRefresh}>
                      <RefreshCw size={16} color="#6B3AA0" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  {loadingTransactions ? (
                    <ActivityIndicator size="small" color="#6B3AA0" style={{ marginVertical: 20 }} />
                  ) : transactions.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 20 }}>
                      <Banknote size={36} color="#D1D5DB" strokeWidth={1.5} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#9CA3AF", marginTop: 10 }}>
                        No transactions yet
                      </Text>
                      <Text style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>
                        Payments and transfers will appear here
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 0 }}>
                      {transactions.slice(0, 10).map((txn, index) => (
                        <View
                          key={txn.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 12,
                            borderBottomWidth: index < Math.min(transactions.length, 10) - 1 ? 1 : 0,
                            borderBottomColor: "#F3F4F6",
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: txn.amount >= 0 ? "#D1FAE5" : "#FEE2E2",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            {txn.amount >= 0 ? (
                              <ArrowDownLeft size={18} color="#10B981" strokeWidth={2.5} />
                            ) : (
                              <ArrowUpRight size={18} color="#EF4444" strokeWidth={2.5} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>
                              {txn.type === "charge" ? "Payment" : txn.type === "payout" ? "Withdrawal" : txn.type === "transfer" ? "Transfer" : txn.type?.charAt(0).toUpperCase() + (txn.type?.slice(1) || "")}
                            </Text>
                            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                              {new Date(txn.created * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "800",
                              color: txn.amount >= 0 ? "#10B981" : "#EF4444",
                            }}
                          >
                            {txn.amount >= 0 ? "+" : ""}${(Math.abs(txn.amount) / 100).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Balance Breakdown (detailed) */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#6B3AA0",
                    marginBottom: 16,
                  }}
                >
                  💰 BALANCE BREAKDOWN
                </Text>

                {/* Available Balance */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#E5E7EB",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#D1FAE5",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <DollarSign size={18} color="#10B981" strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
                        Available
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                        Ready to spend or withdraw
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#10B981" }}>
                    ${balanceData?.available?.[0]
                      ? (balanceData.available[0].amount / 100).toFixed(2)
                      : '0.00'}
                  </Text>
                </View>

                {/* Pending Balance */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#FEF3C7",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Clock size={18} color="#F59E0B" strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
                        Pending
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                        Processing (1-2 business days)
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#F59E0B" }}>
                    ${balanceData?.pending?.[0]
                      ? (balanceData.pending[0].amount / 100).toFixed(2)
                      : '0.00'}
                  </Text>
                </View>

                {/* Request Payout Button */}
                {((balanceData?.available?.[0]?.amount) ?? 0) > 0 && (
                  <TouchableOpacity
                    onPress={handleRequestPayout}
                    disabled={requestingPayout}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: requestingPayout ? "#9CA3AF" : "#10B981",
                      borderRadius: 12,
                      paddingVertical: 14,
                      marginTop: 16,
                    }}
                  >
                    {requestingPayout ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                          Withdraw to Bank
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Bank Account Section */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#6B3AA0",
                    marginBottom: 16,
                  }}
                >
                  🏦 LINKED BANK ACCOUNT
                </Text>

                {accountDetails?.external_accounts && accountDetails.external_accounts.length > 0 ? (
                  accountDetails.external_accounts.map((bank) => (
                    <View
                      key={bank.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#F9FAFB",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#E0E7FF",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <CreditCard size={24} color="#6366F1" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                          {bank.bank_name || 'Bank Account'}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 2 }}>
                          ••••{bank.last4} • {bank.currency.toUpperCase()}
                        </Text>
                      </View>
                      {bank.default_for_currency && (
                        <View
                          style={{
                            backgroundColor: "#D1FAE5",
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>
                            DEFAULT
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <CreditCard size={36} color="#D1D5DB" strokeWidth={1.5} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#9CA3AF", marginTop: 10 }}>
                      No bank account linked
                    </Text>
                    <Text style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4, textAlign: "center" }}>
                      Add a bank account to withdraw funds
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(routes.banking.setup.personalInfo)}
                      style={{
                        backgroundColor: "#6B3AA0",
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        marginTop: 14,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        Add Bank Account
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Account Requirements (if any) */}
              {accountDetails?.requirements?.currently_due && accountDetails.requirements.currently_due.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#FEF3C7",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 2,
                    borderColor: "#FCD34D",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <AlertCircle size={20} color="#F59E0B" strokeWidth={2.5} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: "#92400E",
                        marginLeft: 10,
                      }}
                    >
                      Action Required
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#92400E",
                      lineHeight: 18,
                      fontWeight: "500",
                      marginBottom: 12,
                    }}
                  >
                    Complete the following to enable full account features:
                  </Text>
                  {accountDetails.requirements.currently_due.map((req, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#F59E0B",
                          marginRight: 8,
                        }}
                      />
                      <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "500" }}>
                        {req.replace(/_/g, ' ').replace(/\./g, ' > ')}
                      </Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => router.push(routes.banking.setup.personalInfo)}
                    style={{
                      backgroundColor: "#F59E0B",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                      Complete Verification
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Payout History */}
              {payouts.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#6B3AA0",
                      marginBottom: 16,
                    }}
                  >
                    💸 PAYOUT HISTORY
                  </Text>

                  <View style={{ gap: 10 }}>
                    {payouts.map((payout, index) => (
                      <View
                        key={payout.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          borderBottomWidth: index < payouts.length - 1 ? 1 : 0,
                          borderBottomColor: "#F3F4F6",
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: payout.status === 'paid' ? "#D1FAE5" :
                              payout.status === 'pending' ? "#FEF3C7" :
                                payout.status === 'failed' ? "#FEE2E2" : "#F3F4F6",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <ArrowUpRight
                            size={16}
                            color={payout.status === 'paid' ? "#10B981" :
                              payout.status === 'pending' ? "#F59E0B" :
                                payout.status === 'failed' ? "#EF4444" : "#6B7280"}
                            strokeWidth={2.5}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>
                            Withdrawal to Bank
                          </Text>
                          <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                            {payout.status === 'paid' ? 'Completed' :
                              payout.status === 'pending' ? 'Processing' :
                                payout.status === 'in_transit' ? 'In Transit' :
                                  payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            {' • '}
                            {new Date(payout.created * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: payout.status === 'paid' ? "#10B981" :
                              payout.status === 'pending' ? "#F59E0B" : "#111827",
                          }}
                        >
                          ${(payout.amount / 100).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 🧪 TEST MODE - Development Only */}
              {__DEV__ && (
                <View
                  style={{
                    backgroundColor: "#FDF4FF",
                    borderRadius: 16,
                    padding: 20,
                    marginTop: 20,
                    borderWidth: 2,
                    borderColor: "#E879F9",
                    borderStyle: "dashed",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#A21CAF",
                      marginBottom: 12,
                    }}
                  >
                    🧪 TEST MODE (Dev Only)
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#86198F",
                      marginBottom: 16,
                      fontWeight: "500",
                    }}
                  >
                    If you see "transfers capability" errors, tap "Verify Account" first!
                  </Text>

                  <View style={{ gap: 10 }}>
                    {/* Verify Account for Testing */}
                    <TouchableOpacity
                      onPress={handleTestVerify}
                      style={{
                        backgroundColor: "#059669",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        ✅ Verify Account for Testing
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleTestCreateTransaction}
                      style={{
                        backgroundColor: "#A21CAF",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        + Add $25 Test Payment
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTestAddBalance(5000)}
                      style={{
                        backgroundColor: "#7C3AED",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        + Add $50 Test Balance
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTestAddBalance(10000)}
                      style={{
                        backgroundColor: "#6366F1",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                        + Add $100 Test Balance
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* KYC Rejected State */}
          {kycStatus === 'rejected' && (
            <View>
              <View
                style={{
                  backgroundColor: "#FEE2E2",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: "#FCA5A5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#EF4444",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertCircle size={22} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#7F1D1D",
                        marginBottom: 4,
                      }}
                    >
                      Verification Failed
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#991B1B",
                        fontWeight: "600",
                      }}
                    >
                      We couldn't verify your info
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#991B1B",
                    lineHeight: 20,
                    marginBottom: 16,
                    fontWeight: "500",
                  }}
                >
                  Verification unsuccessful. This could be due to unclear documents or mismatched information. Try again with updated documents.
                </Text>

                <TouchableOpacity
                  onPress={handleSetupCredit}
                  style={{
                    backgroundColor: "#EF4444",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <RefreshCw size={17} color="#FFFFFF" strokeWidth={2.5} />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#FFFFFF",
                        marginLeft: 8,
                      }}
                    >
                      Try Again
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B3AA0",
                    marginBottom: 10,
                  }}
                >
                  Common Issues:
                </Text>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>
                    • Blurry or unclear ID photos
                  </Text>
                  <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>
                    • Name doesn't match ID exactly
                  </Text>
                  <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>
                    • Incorrect date of birth
                  </Text>
                  <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>
                    • Invalid or expired ID
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Features Grid - Show only when no account */}
          {kycStatus === 'no_account' && (
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 12,
                }}
              >
                WHAT YOU CAN DO ✨
              </Text>
              <View style={{ gap: 12 }}>
                {/* Feature 1 */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#06D6A0",
                    borderRadius: 12,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>💵</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: "#6B3AA0" }}
                    >
                      GET YOUR GIFTS
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#4D2875",
                        marginTop: 2,
                        fontWeight: "500",
                      }}
                    >
                      Friends pay you instantly!
                    </Text>
                  </View>
                </View>

                {/* Feature 2 */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#06D6A0",
                    borderRadius: 12,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🎮</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: "#6B3AA0" }}
                    >
                      SPEND ANYWHERE
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#4D2875",
                        marginTop: 2,
                        fontWeight: "500",
                      }}
                    >
                      Use your money worldwide!
                    </Text>
                  </View>
                </View>

                {/* Feature 3 */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#06D6A0",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 0,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: "#6B3AA0" }}
                    >
                      SUPER SAFE
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#4D2875",
                        marginTop: 2,
                        fontWeight: "500",
                      }}
                    >
                      Your money protected!
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
