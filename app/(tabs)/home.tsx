import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Calendar, CreditCard, Users, MapPin, ChevronRight, MessageSquare, BarChart3, Sparkles, Gift, Wallet, Smartphone, Zap, Check } from 'lucide-react-native';
import { routes } from '../../types/routes';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useCallback } from 'react';
import { getUserEventsStats } from '../../src/lib/eventService';
import { getUserProfile } from '../../src/lib/userService';
import { EventSummary } from '../../types/events';
import { UserProfile } from '../../types/user';
import firebase from '../../src/firebase';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeEvents, setActiveEvents] = useState<EventSummary[]>([]);
    const [eventsCount, setEventsCount] = useState(0);

    const loadData = useCallback(async () => {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            // Load user profile and event stats in parallel (no full guest data)
            const [profile, events] = await Promise.all([
                getUserProfile(user.uid),
                getUserEventsStats(),
            ]);

            setUserProfile(profile || null);
            setEventsCount(events.length);

            // Filter active events and sort by date
            const active = events.filter(e => e.status === 'active');
            active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setActiveEvents(active);
        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getEventEmoji = (eventType: string) => {
        switch (eventType) {
            case 'birthday': return '🎂';
            case 'barMitzvah': return '📖';
            case 'batMitzvah': return '📖';
            default: return '🎉';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const getUserGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getFirstName = () => {
        if (userProfile?.fullName) {
            return userProfile.fullName.split(' ')[0];
        }
        return 'there';
    };

    // Step card configuration with gradient colors
    const stepsConfig = [
        {
            step: 1,
            emoji: '🎂',
            title: 'Create Your Event',
            subtitle: 'Birthday Party Setup',
            description: "Plan your child's birthday with AI-designed invitations. Invite guests & track RSVPs",
            gradientColors: ['#FBBF24', '#F59E0B'] as const,
            lightColor: '#FEF3C7',
            iconBg: '#FDE68A',
            features: ['📋 AI Designed Invitation', '👥 Invite From Your Contacts', '📱 SMS Invites & Updates', '✅ Manage & Track RSVPs'],
        },
        {
            step: 2,
            emoji: '💳',
            title: 'Get Virtual Card',
            subtitle: 'Digital Wallet',
            description: 'No more gift cards! All gifts go to one virtual card your child can actually use anywhere',
            gradientColors: ['#8B5CF6', '#7C3AED'] as const,
            lightColor: '#EDE9FE',
            iconBg: '#DDD6FE',
            features: ['🎁 All Gifts in One Place', '💳 Replace Gift Cards Forever', '🔒 Verified & Secure', '⚡ Instant Balance'],
        },
        {
            step: 3,
            emoji: '👨‍👩‍👧',
            title: 'Link Your Child',
            subtitle: 'Secure Connection',
            description: 'Your child downloads the app and securely links to their virtual card with parental approval',
            gradientColors: ['#3B82F6', '#2563EB'] as const,
            lightColor: '#DBEAFE',
            iconBg: '#BFDBFE',
            features: ['👁️ Parent View', '🛡️ Secure', '🔗 Easy Link'],
        },
        {
            step: 4,
            emoji: '🛍️',
            title: 'Pay Anywhere!',
            subtitle: 'Apple Pay Ready',
            description: 'Your child spends gift money anywhere with Apple Pay. Track every purchase in real-time',
            gradientColors: ['#10B981', '#059669'] as const,
            lightColor: '#D1FAE5',
            iconBg: '#A7F3D0',
            features: [' Apple Pay', '📊 Live Tracking', '🌍 Worldwide'],
        },
    ];

    const renderStepCard = (config: typeof stepsConfig[0], currentStep?: number, isLast?: boolean) => {
        const isCompleted = currentStep ? config.step <= currentStep : false;
        const isCurrent = currentStep ? config.step === currentStep + 1 : config.step === 1;

        return (
            <View key={config.step}>
                {/* Connector from previous */}
                {config.step > 1 && (
                    <View style={{ alignItems: 'center', height: 32 }}>
                        {/* Vertical line */}
                        <View
                            style={{
                                width: 4,
                                flex: 1,
                                backgroundColor: isCompleted || isCurrent ? config.gradientColors[0] : '#E5E7EB',
                                borderRadius: 2,
                            }}
                        />
                    </View>
                )}

                {/* Step Card */}
                <View
                    style={{
                        borderRadius: 24,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: config.gradientColors[0],
                        shadowColor: config.gradientColors[0],
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 8,
                    }}
                >
                    {/* Card with gradient header */}
                    <View style={{ backgroundColor: '#FFFFFF' }}>
                        {/* Gradient Header */}
                        <LinearGradient
                            colors={isCompleted ? ['#6B7280', '#6B7280'] : config.gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {/* Step Circle */}
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 14,
                                }}
                            >
                                {isCompleted ? (
                                    <Check size={24} color="#FFFFFF" strokeWidth={3} />
                                ) : (
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>
                                        {config.step}
                                    </Text>
                                )}
                            </View>

                            {/* Title & Subtitle */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 2 }}>
                                    {config.subtitle.toUpperCase()}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '800',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    {config.title}
                                </Text>
                            </View>

                            {/* Emoji */}
                            <Text style={{ fontSize: 32 }}>{config.emoji}</Text>
                        </LinearGradient>

                        {/* Card Body */}
                        <View style={{ padding: 20 }}>
                            {/* Description */}
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: isCompleted ? '#9CA3AF' : '#4B5563',
                                    fontWeight: '500',
                                    lineHeight: 22,
                                    marginBottom: 14,
                                }}
                            >
                                {config.description}
                            </Text>

                            {/* Feature Tags - Vertical List */}
                            <View style={{ gap: 8, marginBottom: 16 }}>
                                {config.features.map((feature, index) => {
                                    const emoji = feature.split(' ')[0];
                                    const text = feature.split(' ').slice(1).join(' ');
                                    return (
                                        <View
                                            key={index}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: isCompleted ? '#F9FAFB' : config.lightColor,
                                                borderRadius: 12,
                                                paddingVertical: 10,
                                                paddingHorizontal: 14,
                                                borderLeftWidth: 3,
                                                borderLeftColor: isCompleted ? '#D1D5DB' : config.gradientColors[0],
                                            }}
                                        >
                                            <Text style={{ fontSize: 18, marginRight: 10 }}>{emoji}</Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: '600',
                                                    color: isCompleted ? '#9CA3AF' : '#374151',
                                                    flex: 1,
                                                }}
                                            >
                                                {text}
                                            </Text>
                                            <View
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    backgroundColor: isCompleted ? '#D1D5DB' : config.gradientColors[0],
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ fontSize: 10, color: '#FFFFFF' }}>✓</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Status Row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                {/* Status Badge */}
                                {isCurrent ? (
                                    <LinearGradient
                                        colors={config.gradientColors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            borderRadius: 20,
                                            paddingVertical: 8,
                                            paddingHorizontal: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: '#FFFFFF',
                                                marginRight: 8,
                                            }}
                                        />
                                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                                            YOUR NEXT STEP
                                        </Text>
                                    </LinearGradient>
                                ) : isCompleted ? (
                                    <View
                                        style={{
                                            backgroundColor: '#D1FAE5',
                                            borderRadius: 20,
                                            paddingVertical: 8,
                                            paddingHorizontal: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Check size={14} color="#059669" strokeWidth={3} style={{ marginRight: 6 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>
                                            COMPLETED
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            backgroundColor: '#F3F4F6',
                                            borderRadius: 20,
                                            paddingVertical: 8,
                                            paddingHorizontal: 16,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF' }}>
                                            UPCOMING
                                        </Text>
                                    </View>
                                )}

                                {/* Step indicator dots */}
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    {[1, 2, 3, 4].map((dot) => (
                                        <View
                                            key={dot}
                                            style={{
                                                width: dot === config.step ? 20 : 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor:
                                                    dot < config.step ? '#10B981' :
                                                        dot === config.step ? config.gradientColors[0] :
                                                            '#E5E7EB',
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderEventCard = (event: EventSummary) => {
        // Use pre-calculated guestStats - no need to fetch full guest data
        const { added, invited, confirmed, paid } = event.guestStats;

        return (
            <TouchableOpacity
                key={event.id}
                onPress={() => router.push(routes.eventDashboard(event.id))}
                activeOpacity={0.8}
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                    borderLeftWidth: 5,
                    borderLeftColor: '#06D6A0',
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 28, marginRight: 10 }}>
                                {getEventEmoji(event.eventType)}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: '#D1FAE5',
                                    borderRadius: 8,
                                    paddingVertical: 4,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                                    {event.status}
                                </Text>
                            </View>
                        </View>
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: '900',
                                color: '#1F2937',
                                marginBottom: 12,
                            }}
                        >
                            {event.eventName}
                        </Text>

                        {/* Event Details */}
                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Calendar size={16} color="#6B7280" strokeWidth={2} />
                                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8, fontWeight: '600' }}>
                                    {formatDate(event.date)} at {event.time}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Users size={16} color="#6B7280" strokeWidth={2} />
                                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8, fontWeight: '600' }}>
                                    {event.totalGuests} guest{event.totalGuests !== 1 ? 's' : ''} added
                                </Text>
                            </View>
                            {event.address1 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MapPin size={16} color="#6B7280" strokeWidth={2} />
                                    <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                                        {event.address1}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <ChevronRight size={24} color="#D1D5DB" />
                </View>

                {/* Guest Status Stats */}
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 16,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: '#F3F4F6',
                        justifyContent: 'space-around',
                    }}
                >
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#6B7280' }}>
                            {added}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                            Added
                        </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#3B82F6' }}>
                            {invited}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                            Invited
                        </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#10B981' }}>
                            {confirmed}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                            Confirmed
                        </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#F59E0B' }}>
                            {paid}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                            Paid
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: 30,
                    paddingHorizontal: 20,
                }}
            >
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text
                        style={{
                            fontSize: 16,
                            color: '#6B7280',
                            fontWeight: '600',
                            marginBottom: 4,
                        }}
                    >
                        {getUserGreeting()} 👋
                    </Text>
                    <Text
                        style={{
                            fontSize: 28,
                            fontWeight: '900',
                            color: '#1F2937',
                        }}
                    >
                        {loading ? '...' : getFirstName()}
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => router.push(routes.tabs.myEvents)}
                        style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderRadius: 20,
                            padding: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 4,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: '#F3F4F6',
                                borderRadius: 12,
                                padding: 10,
                                alignSelf: 'flex-start',
                                marginBottom: 12,
                            }}
                        >
                            <Calendar color="#FBBF24" size={24} strokeWidth={2.5} />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '800',
                                color: '#1F2937',
                                marginBottom: 4,
                            }}
                        >
                            My Events
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: '#6B7280',
                                fontWeight: '500',
                            }}
                        >
                            {loading ? '...' : `${eventsCount} event${eventsCount !== 1 ? 's' : ''}`}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push(routes.tabs.banking)}
                        style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderRadius: 20,
                            padding: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 4,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: '#F3F4F6',
                                borderRadius: 12,
                                padding: 10,
                                alignSelf: 'flex-start',
                                marginBottom: 12,
                            }}
                        >
                            <CreditCard color="#FBBF24" size={24} strokeWidth={2.5} />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '800',
                                color: '#1F2937',
                                marginBottom: 4,
                            }}
                        >
                            Banking
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: '#6B7280',
                                fontWeight: '500',
                            }}
                        >
                            {userProfile?.stripeAccountCreated ? 'Connected' : 'Set up'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Active Events Section */}
                {activeEvents.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '800',
                                    color: '#1F2937',
                                }}
                            >
                                Active Events
                            </Text>
                            {activeEvents.length > 0 && (
                                <View
                                    style={{
                                        backgroundColor: '#D1FAE5',
                                        borderRadius: 12,
                                        paddingVertical: 4,
                                        paddingHorizontal: 10,
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                                        {activeEvents.length}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Event Cards */}
                        {activeEvents.length > 0 ? (
                            <View style={{ gap: 16 }}>
                                {activeEvents.map(event => renderEventCard(event))}
                            </View>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: 16,
                                    padding: 24,
                                    alignItems: 'center',
                                    borderWidth: 2,
                                    borderStyle: 'dashed',
                                    borderColor: '#E5E7EB',
                                }}
                            >
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#6B7280', marginBottom: 4 }}>
                                    No Active Events
                                </Text>
                                <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                                    Create your first event to get started!
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* App Features Section */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <Sparkles size={20} color="#8B5CF6" strokeWidth={2.5} />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '800',
                                color: '#1F2937',
                                marginLeft: 8,
                            }}
                        >
                            What You Can Do
                        </Text>
                    </View>

                    {/* Feature Cards */}
                    <View style={{ gap: 12 }}>
                        {/* HERO FEATURE - Virtual Card */}
                        <LinearGradient
                            colors={['#1F2937', '#111827']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 24,
                                padding: 24,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Decorative Background Elements */}
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -30,
                                    right: -30,
                                    width: 150,
                                    height: 150,
                                    borderRadius: 75,
                                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: -20,
                                    left: -20,
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                }}
                            />

                            {/* Badge */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <LinearGradient
                                    colors={['#8B5CF6', '#6D28D9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        borderRadius: 20,
                                        paddingVertical: 6,
                                        paddingHorizontal: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Zap size={12} color="#FFFFFF" strokeWidth={3} />
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', marginLeft: 4 }}>
                                        MAIN FEATURE
                                    </Text>
                                </LinearGradient>
                            </View>

                            {/* Virtual Card Preview */}
                            <View
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: 16,
                                    padding: 20,
                                    marginBottom: 20,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                    <View>
                                        <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', letterSpacing: 1 }}>
                                            VIRTUAL CARD
                                        </Text>
                                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 4 }}>
                                            PiggyBank
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            width: 44,
                                            height: 28,
                                            backgroundColor: '#FBBF24',
                                            borderRadius: 6,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <CreditCard size={18} color="#1F2937" strokeWidth={2.5} />
                                    </View>
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: 3, marginBottom: 16 }}>
                                    •••• •••• •••• 4289
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600' }}>BALANCE</Text>
                                        <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '800' }}>$150.00</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600' }}>VALID THRU</Text>
                                        <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '700' }}>12/28</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Feature Title & Description */}
                            <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 }}>
                                Your Virtual Debit Card
                            </Text>
                            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500', lineHeight: 20, marginBottom: 20 }}>
                                Spend your gifts anywhere! Get a virtual card instantly and add it to Apple Pay for contactless payments.
                            </Text>

                            {/* Feature Highlights */}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 12,
                                        padding: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Smartphone size={20} color="#FBBF24" strokeWidth={2.5} />
                                    <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700', marginTop: 6, textAlign: 'center' }}>
                                        Apple Pay
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 12,
                                        padding: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Wallet size={20} color="#10B981" strokeWidth={2.5} />
                                    <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700', marginTop: 6, textAlign: 'center' }}>
                                        Instant Access
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 12,
                                        padding: 12,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Zap size={20} color="#8B5CF6" strokeWidth={2.5} />
                                    <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700', marginTop: 6, textAlign: 'center' }}>
                                        Pay Anywhere
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Getting Started Journey */}
                <View style={{ marginBottom: 0 }}>

                    {/* Step Cards */}
                    <View style={{ gap: 0 }}>
                        {stepsConfig.map((config, index) =>
                            renderStepCard(config, userProfile?.onboardingStep, index === stepsConfig.length - 1)
                        )}
                    </View>

                    {/* CTA Button */}
                    {eventsCount === 0 && (
                        <TouchableOpacity
                            onPress={() => router.push(routes.tabs.createEvent)}
                            style={{
                                backgroundColor: '#FBBF24',
                                borderRadius: 16,
                                padding: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 20,
                                shadowColor: '#FBBF24',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                                🎉 Start Your First Event
                            </Text>
                            <ChevronRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* The End of Gift Cards Section */}
                <View style={{ marginTop: 28 }}>
                    {/* Hero Header */}
                    <LinearGradient
                        colors={['#0F172A', '#1E293B', '#334155']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            borderRadius: 28,
                            padding: 24,
                            marginBottom: 16,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative elements */}
                        <View
                            style={{
                                position: 'absolute',
                                top: -20,
                                right: -20,
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            }}
                        />
                        <View
                            style={{
                                position: 'absolute',
                                bottom: -30,
                                left: 20,
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            }}
                        />

                        <View style={{ alignItems: 'center' }}>
                            <View
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: 30,
                                    paddingVertical: 6,
                                    paddingHorizontal: 14,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: 'rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                <Text style={{ fontSize: 11, color: '#FCA5A5', fontWeight: '700', letterSpacing: 1.5 }}>
                                    💀 R.I.P. GIFT CARDS
                                </Text>
                            </View>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }}>
                                The End of an Era
                            </Text>
                            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontWeight: '500' }}>
                                Gift cards had their time.
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Stats Cards - Horizontal Scroll Look */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12, letterSpacing: 0.5 }}>
                            📊 THE SHOCKING TRUTH
                        </Text>

                        {/* Big Stat Card */}
                        <View
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 24,
                                padding: 24,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: '#F3F4F6',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 12,
                                elevation: 3,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 48, fontWeight: '900', color: '#DC2626', marginBottom: 4 }}>
                                        $27B
                                    </Text>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                                        in gift cards sit unused
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                                        in American drawers right now
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: '#FEF2F2',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 40 }}>🗑️</Text>
                                </View>
                            </View>
                        </View>

                        {/* Mini Stats Row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* Stat 1 */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FEF3C7',
                                    borderRadius: 20,
                                    padding: 16,
                                }}
                            >
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#B45309' }}>43%</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E', marginTop: 4 }}>
                                    have unused cards
                                </Text>
                            </View>

                            {/* Stat 2 */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#DBEAFE',
                                    borderRadius: 20,
                                    padding: 16,
                                }}
                            >
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#1D4ED8' }}>$244</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF', marginTop: 4 }}>
                                    avg. wasted balance
                                </Text>
                            </View>

                            {/* Stat 3 */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FCE7F3',
                                    borderRadius: 20,
                                    padding: 16,
                                }}
                            >
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#BE185D' }}>56%</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#9D174D', marginTop: 4 }}>
                                    used in 6 months
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quote Banner */}
                    <View
                        style={{
                            backgroundColor: '#1F2937',
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 28, marginRight: 12 }}>💬</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', fontStyle: 'italic' }}>
                                "I have $50 in Target cards I'll never use..."
                            </Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                — Everyone, at some point
                            </Text>
                        </View>
                    </View>

                    {/* Side by Side Comparison */}
                    <View style={{ gap: 12 }}>

                        {/* Two column comparison */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* OLD Card */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#FEF2F2',
                                    borderRadius: 20,
                                    padding: 16,
                                    borderWidth: 2,
                                    borderColor: '#FECACA',
                                }}
                            >
                                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 32 }}>🎁</Text>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: -8,
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: '#DC2626',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, color: '#FFFFFF' }}>✕</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#991B1B', textAlign: 'center', marginBottom: 8 }}>
                                    Gift Cards
                                </Text>
                                <View style={{ gap: 6 }}>
                                    {['1 store only', '~5% fee', 'Often forgotten', 'Can expire'].map((text, i) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FECACA', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                                                <Text style={{ fontSize: 9, color: '#DC2626' }}>✕</Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '500' }}>{text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* NEW Card */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: '#ECFDF5',
                                    borderRadius: 20,
                                    padding: 16,
                                    borderWidth: 2,
                                    borderColor: '#A7F3D0',
                                }}
                            >
                                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 32 }}>💳</Text>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: -8,
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: '#10B981',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, color: '#FFFFFF' }}>✓</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#065F46', textAlign: 'center', marginBottom: 8 }}>
                                    PiggyBank
                                </Text>
                                <View style={{ gap: 6 }}>
                                    {['Use anywhere', 'Only 3% fee', 'Apple Pay ready', 'Never expires'].map((text, i) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                                                <Text style={{ fontSize: 10, color: '#065F46' }}>✓</Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '500' }}>{text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Bottom CTA */}
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                borderRadius: 16,
                                padding: 16,
                                marginTop: 4,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>💡</Text>
                                <View>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>
                                        Give $25 of real freedom
                                    </Text>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                                        Not $25 locked to one store
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Spread the Word - Modern Design */}
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 24,
                                padding: 24,
                                marginTop: 16,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Decorative elements */}
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -30,
                                    right: -30,
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: -20,
                                    left: 30,
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                }}
                            />

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Left side - Text content */}
                                <View style={{ flex: 1, marginRight: 16 }}>
                                    <View
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            borderRadius: 8,
                                            paddingVertical: 4,
                                            paddingHorizontal: 10,
                                            alignSelf: 'flex-start',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 }}>
                                            NOW THAT YOU KNOW 💡
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 }}>
                                        Save Your Loved Ones !
                                    </Text>
                                    <Text style={{ marginTop: 6, fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 18 }}>
                                        Every gift deserves to be used !
                                    </Text>
                                    <Text style={{ marginTop: 4, fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 18 }}>
                                        Not forgotten in a drawer...
                                    </Text>

                                </View>

                                {/* Right side - Emoji stack */}
                                <View style={{ alignItems: 'center' }}>
                                    <View
                                        style={{
                                            width: 70,
                                            height: 70,
                                            borderRadius: 35,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 36 }}>💜</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Action buttons */}
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 14,
                                        paddingVertical: 14,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, marginRight: 8 }}>📱</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#5B21B6' }}>
                                        Share App
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        borderRadius: 14,
                                        paddingVertical: 14,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, marginRight: 8 }}>💬</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                                        Tell a Friend
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
