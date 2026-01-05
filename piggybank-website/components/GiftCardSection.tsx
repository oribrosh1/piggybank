'use client';

import { useState } from 'react';
import { Gift, Sparkles, PenLine, Loader2, CreditCard, Send } from 'lucide-react';

interface GiftCardSectionProps {
    firstName: string;
    eventType: string;
    typeLabel: string;
    age?: string | number;
}

const CARD_TEMPLATES = [
    { emoji: "🎈", name: "Balloons", fromColor: "#F472B6", toColor: "#A855F7" },
    { emoji: "🎊", name: "Confetti", fromColor: "#FBBF24", toColor: "#F97316" },
    { emoji: "⭐", name: "Stars", fromColor: "#60A5FA", toColor: "#6366F1" },
    { emoji: "💖", name: "Hearts", fromColor: "#F87171", toColor: "#EC4899" },
    { emoji: "🎂", name: "Cake", fromColor: "#FBBF24", toColor: "#EAB308" },
    { emoji: "🎉", name: "Party", fromColor: "#4ADE80", toColor: "#14B8A6" },
];

const AMOUNTS = [25, 50, 100, 150, 200];

export default function GiftCardSection({ firstName, eventType, typeLabel, age }: GiftCardSectionProps) {
    const [selectedAmount, setSelectedAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [blessing, setBlessing] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCustomAmount, setShowCustomAmount] = useState(false);

    const template = CARD_TEMPLATES[selectedTemplate];
    const displayAmount = showCustomAmount && customAmount ? parseInt(customAmount) : selectedAmount;
    const maxLength = 150;

    const generateBlessing = async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        const blessings = [
            `Happy ${eventType === 'birthday' ? 'Birthday' : 'celebration'}, ${firstName}! 🎉 Wishing you an incredible day filled with joy!`,
            `${firstName}, may this special day bring you everything you've wished for! Here's to ${age ? `an amazing year ${age}` : 'many more amazing moments'}! ✨`,
            `Sending you all my love and best wishes, ${firstName}! Have the most wonderful ${eventType === 'birthday' ? 'birthday' : 'celebration'} ever! 💝`,
            `To ${firstName} – may your day be as awesome as you are! Enjoy every moment! 🌟`,
        ];

        setBlessing(blessings[Math.floor(Math.random() * blessings.length)]);
        setIsGenerating(false);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] p-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Gift size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-white">Send a Gift 🎁</h3>
                        <p className="text-sm text-white/80">Create a personalized gift card for {firstName}</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Amount Selection */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                        Choose Amount
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {AMOUNTS.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => {
                                    setSelectedAmount(amount);
                                    setShowCustomAmount(false);
                                }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${!showCustomAmount && selectedAmount === amount
                                    ? 'bg-[#8B5CF6] text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ${amount}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowCustomAmount(!showCustomAmount)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${showCustomAmount
                                ? 'bg-[#8B5CF6] text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Other
                        </button>
                    </div>

                    {showCustomAmount && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-400">$</span>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="5"
                                max="500"
                                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-[#8B5CF6] focus:outline-none font-bold text-xl text-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Card Design Selection */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                        Card Design
                    </label>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
                        {CARD_TEMPLATES.map((tmpl, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedTemplate(i)}
                                className={`relative w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 ${selectedTemplate === i
                                    ? 'ring-[3px] ring-[#8B5CF6] ring-offset-2 scale-105'
                                    : 'opacity-80 hover:opacity-100'
                                    }`}
                                style={{
                                    background: `linear-gradient(135deg, ${tmpl.fromColor} 0%, ${tmpl.toColor} 100%)`
                                }}
                            >
                                <span className="text-2xl">{tmpl.emoji}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blessing Note */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <PenLine size={14} />
                            Personal Message
                        </label>
                        <button
                            onClick={generateBlessing}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full text-white text-xs font-bold hover:shadow-md transition-all disabled:opacity-60"
                        >
                            {isGenerating ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Sparkles size={12} />
                            )}
                            {isGenerating ? 'Writing...' : 'AI Write'}
                        </button>
                    </div>
                    <textarea
                        value={blessing}
                        onChange={(e) => setBlessing(e.target.value.slice(0, maxLength))}
                        placeholder={`Write something special for ${firstName}...`}
                        className="w-full h-24 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-[#8B5CF6] focus:outline-none resize-none text-gray-800 placeholder-gray-400 text-sm transition-colors"
                    />
                    <div className="flex justify-end mt-1">
                        <span className={`text-xs font-medium ${blessing.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
                            {blessing.length}/{maxLength}
                        </span>
                    </div>
                </div>

                {/* Gift Card Preview */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                        Preview
                    </label>
                    <div
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${template.fromColor} 0%, ${template.toColor} 100%)`
                        }}
                    >
                        {/* Decorative emoji */}
                        <div className="absolute top-4 right-4 text-6xl opacity-20">{template.emoji}</div>
                        <div className="absolute bottom-4 left-4 text-4xl opacity-10">{template.emoji}</div>

                        <div className="relative">
                            {/* PiggyBank Badge */}
                            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg mb-4">
                                <span className="text-xs font-bold text-white">🐷 PiggyBank Gift</span>
                            </div>

                            {/* Amount */}
                            <p className="text-5xl font-black text-white mb-1 tracking-tight">
                                ${displayAmount || 0}
                            </p>
                            <p className="text-sm text-white/90 font-medium">
                                For {firstName}&apos;s {typeLabel}
                            </p>

                            {/* Message */}
                            {blessing && (
                                <div className="mt-5 bg-white/15 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-sm text-white leading-relaxed">
                                        &quot;{blessing}&quot;
                                    </p>
                                </div>
                            )}

                            {/* Card chip design */}
                            <div className="absolute top-0 right-0 flex items-center gap-1 opacity-40">
                                <CreditCard size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Button */}
                <button className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Send size={20} />
                    Send ${displayAmount || 0} Gift to {firstName}
                </button>

                {/* Fee Notice */}
                <p className="text-center text-xs text-gray-400">
                    Only 3% processing fee • {firstName} gets ${((displayAmount || 0) * 0.97).toFixed(2)}
                </p>
            </div>
        </div>
    );
}

