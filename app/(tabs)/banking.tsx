import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  Wallet
} from "lucide-react-native";
import { useState, useEffect, useRef } from "react";
import Svg, { Path } from "react-native-svg";
import { routes } from "../../types/routes";
import { AccountStatusResponse, getAccountStatus, getBalance, GetBalanceResponse } from "../../src/lib/api";
import { getUserProfile } from "../../src/lib/userService";
import { UserProfile } from "../../types/user";
import firebase from "../../src/firebase";

export default function BankingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Real Stripe account data
  const [accountData, setAccountData] = useState<AccountStatusResponse | null>(null);
  const [balanceData, setBalanceData] = useState<GetBalanceResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // KYC Status: 'no_account' | 'pending' | 'approved' | 'rejected'
  const [kycStatus, setKycStatus] = useState('no_account');
  const [refreshing, setRefreshing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  // Countdown timer (5 minutes = 300 seconds)
  const [timeRemaining, setTimeRemaining] = useState(300);

  // Card animation
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Countdown timer effect
  useEffect(() => {
    if (kycStatus === 'pending' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setKycStatus('approved');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [kycStatus, timeRemaining]);

  useEffect(() => {
    if (kycStatus === 'approved') {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [kycStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch account data from Stripe and Firestore
  const fetchAccountData = async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        console.log('No user logged in');
        setKycStatus('no_account');
        return;
      }

      // Get user profile from Firestore
      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.stripeAccountCreated) {
        setKycStatus('no_account');
        return;
      }

      setUserProfile(profile);

      // Get account status from Stripe
      const accountStatus = await getAccountStatus();
      setAccountData(accountStatus);

      // Determine KYC status based on Stripe account
      if (!accountStatus.exists) {
        setKycStatus('no_account');
      } else if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
        setKycStatus('approved');

        // Get balance if approved
        try {
          const balance = await getBalance();
          setBalanceData(balance);
        } catch (balanceError) {
          console.warn('Could not fetch balance:', balanceError);
        }
      } else if (accountStatus.details_submitted) {
        setKycStatus('pending');
      } else {
        setKycStatus('rejected');
      }

      console.log('✅ Account data loaded:', {
        kycStatus,
        accountStatus,
        balance: balanceData
      });
    } catch (error) {
      console.error('Error fetching account data:', error);
      setKycStatus('no_account');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAccountData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccountData();
    setRefreshing(false);
  };

  const handleSetupBanking = () => {
    router.push(routes.banking.setup.personalInfo);
  };

  const toggleCardVisibility = () => {
    setCardVisible(!cardVisible);
  };

  const handleCopyCardNumber = () => {
    // TODO: Copy to clipboard
    alert("Card number copied!");
  };

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
                ${(() => {
                  if (kycStatus === 'approved' && balanceData && balanceData?.available?.length > 0) {
                    // Sum all available balances (Stripe returns array of currency balances)
                    const total = balanceData.available.reduce((sum, bal) => sum + bal.amount, 0);
                    return (total / 100).toFixed(2); // Convert cents to dollars
                  }
                  return '0.00';
                })()}
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
                  'Set up banking to start! 🐷'}
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
            YOUR PIGGY BANKS 🐷
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
                    No Piggy Banks Yet!
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
                onPress={handleSetupBanking}
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
                  CREATE PIGGY BANK
                </Text>
              </TouchableOpacity>
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
                  {/* Large Countdown Circle */}
                  <View
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      backgroundColor: "#F0FDF4",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      borderWidth: 8,
                      borderColor: "#10B981",
                      shadowColor: "#10B981",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 48,
                        fontWeight: "900",
                        color: "#10B981",
                        letterSpacing: 2,
                      }}
                    >
                      {formatTime(timeRemaining)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#059669",
                        marginTop: 4,
                        letterSpacing: 1,
                      }}
                    >
                      REMAINING
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View
                    style={{
                      width: "80%",
                      height: 8,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 24,
                    }}
                  >
                    <View
                      style={{
                        width: `${((300 - timeRemaining) / 300) * 100}%`,
                        height: "100%",
                        backgroundColor: "#10B981",
                        borderRadius: 4,
                      }}
                    />
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
                    Verification In Progress ⏳
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      fontWeight: "600",
                      textAlign: "center",
                      lineHeight: 20,
                    }}
                  >
                    Stripe is verifying your identity.{'\n'}Your card will be ready soon!
                  </Text>
                </View>

                {/* Progress Timeline */}
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
                      { label: "Personal info received", done: true, emoji: "📝", threshold: 300 },
                      { label: "ID document uploaded", done: true, emoji: "🆔", threshold: 300 },
                      { label: "Identity verification", done: timeRemaining <= 180, emoji: "🔍", threshold: 180 },
                      { label: "Account approval", done: timeRemaining <= 60, emoji: "✅", threshold: 60 },
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
                      Piggy Bank Card 🐷
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
                        $0.00
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
                  onPress={handleSetupBanking}
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
