export interface DebuggingCard {
    id: string;
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    message: string;
    effect: {
        money?: number;
        move?: number;
        property?: string;
    };
}
export declare const CHANCE_CARDS: DebuggingCard[];
export declare const COMMUNITY_CHEST_CARDS: DebuggingCard[];
export declare function getRandomChanceCard(): DebuggingCard;
export declare function getRandomCommunityChestCard(): DebuggingCard;
//# sourceMappingURL=debuggingCards.d.ts.map