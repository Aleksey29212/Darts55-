
import { describe, it, expect } from 'vitest';
import { getPointsForRank } from '@/lib/scoring';
import type { ScoringSettings } from '@/lib/types';

describe('Scoring Logic', () => {
  const mockSettings: ScoringSettings = {
    pointsFor1st: 100,
    pointsFor2nd: 80,
    pointsFor3rd_4th: 60,
    pointsFor5th_8th: 40,
    pointsFor9th_16th: 20,
    participationPoints: 10,
    enable180Bonus: true,
    bonusPer180: 5,
    enableHiOutBonus: false,
    hiOutThreshold: 0,
    hiOutBonus: 0,
    enableAvgBonus: false,
    avgThreshold: 0,
    avgBonus: 0,
    enableShortLegBonus: false,
    shortLegThreshold: 0,
    shortLegBonus: 0,
    enable9DarterBonus: false,
    bonusFor9Darter: 0,
    includeInGeneral: true,
    pointValue: 5,
  };

  it('should calculate standard points for top ranks', () => {
    expect(getPointsForRank(1, mockSettings)).toBe(100);
    expect(getPointsForRank(2, mockSettings)).toBe(80);
    expect(getPointsForRank(3, mockSettings)).toBe(60);
    expect(getPointsForRank(5, mockSettings)).toBe(40);
  });

  it('should apply multipliers for evening_omsk league', () => {
    const omskSettings = { ...mockSettings, pointsFor1st: 1.0, pointsFor2nd: 0.7 };
    const avg = 60.5;
    expect(getPointsForRank(1, omskSettings, 'evening_omsk', avg)).toBe(60.5);
    expect(getPointsForRank(2, omskSettings, 'evening_omsk', avg)).toBe(42.35);
  });
});
