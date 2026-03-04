
import type { TournamentPlayerResult, ScoringSettings } from './types';

/**
 * Calculates base points for a player based on their rank and league settings.
 * Special handling for 'evening_omsk' league which uses dynamic multipliers based on AVG.
 */
export function getPointsForRank(rank: number, settings: ScoringSettings, leagueId?: string, playerAvg: number = 0): number {
    // Special logic for "Evening Omsk" league using dynamic multipliers based on AVG
    if (leagueId === 'evening_omsk') {
        const avg = Number(playerAvg) || 0;
        let multiplier = 0;

        // Stage-based multipliers according to tournament rules
        // Ranks: 1=1st, 2=2nd, 3-4=1/2, 5-8=1/4
        if (rank === 1) multiplier = Number(settings.pointsFor1st);
        else if (rank === 2) multiplier = Number(settings.pointsFor2nd);
        else if (rank >= 3 && rank <= 4) multiplier = Number(settings.pointsFor3rd_4th);
        else if (rank >= 5 && rank <= 8) multiplier = Number(settings.pointsFor5th_8th);
        else return Number(settings.participationPoints) || 0; // Fixed participation points for ranks 9+

        // Calculate points: AVG * Multiplier, rounded to 2 decimals
        return Math.round(avg * multiplier * 100) / 100;
    }

    // Standard logic for other leagues
    if (rank === 1) return settings.pointsFor1st;
    if (rank === 2) return settings.pointsFor2nd;
    if (rank >= 3 && rank <= 4) return settings.pointsFor3rd_4th;
    if (rank >= 5 && rank <= 8) return settings.pointsFor5th_8th;
    if (rank >= 9 && rank <= 16) return settings.pointsFor9th_16th;
    return settings.participationPoints;
}

/**
 * Main function to calculate total player points for a tournament.
 * Sums base points (rank-based) and bonus points (stat-based).
 */
export function calculatePlayerPoints(result: TournamentPlayerResult, settings: ScoringSettings, leagueId?: string): void {
    const effectiveLeagueId = leagueId || (settings as any).id;
    
    // Determine base points (includes dynamic AVG multipliers for Evening Omsk)
    result.basePoints = getPointsForRank(result.rank, settings, effectiveLeagueId, result.avg);
    
    result.bonusPoints = 0;
    result.pointsFor180s = 0;
    result.is180BonusApplied = false;
    result.pointsForHiOut = 0;
    result.isHiOutBonusApplied = false;
    result.pointsForAvg = 0;
    result.isAvgBonusApplied = false;
    result.pointsForBestLeg = 0;
    result.isBestLegBonusApplied = false;
    result.pointsFor9Darter = 0;
    result.is9DarterBonusApplied = false;

    // Bonus for each 180 thrown
    if (settings.enable180Bonus && result.n180s > 0) {
        result.pointsFor180s = result.n180s * settings.bonusPer180;
        result.is180BonusApplied = true;
        result.bonusPoints += result.pointsFor180s;
    }
    // Bonus if Hi-Out meets or exceeds the threshold
    if (settings.enableHiOutBonus && result.hiOut >= settings.hiOutThreshold) {
        result.pointsForHiOut = settings.hiOutBonus;
        result.isHiOutBonusApplied = true;
        result.bonusPoints += result.pointsForHiOut;
    }
    // Bonus if AVG meets or exceeds the threshold
    if (settings.enableAvgBonus && result.avg >= settings.avgThreshold) {
        result.pointsForAvg = settings.avgBonus;
        result.isAvgBonusApplied = true;
        result.bonusPoints += result.pointsForAvg;
    }
    // Bonus if best leg is less than or equal to the threshold (and > 0)
    if (settings.enableShortLegBonus && result.bestLeg > 0 && result.bestLeg <= settings.shortLegThreshold) {
        result.pointsForBestLeg = settings.shortLegBonus;
        result.isBestLegBonusApplied = true;
        result.bonusPoints += result.pointsForBestLeg;
    }
    
    // 9-darter bonus
    if (settings.enable9DarterBonus && result.nineDarters && result.nineDarters > 0) {
        result.pointsFor9Darter = result.nineDarters * settings.bonusFor9Darter;
        result.is9DarterBonusApplied = true;
        result.bonusPoints += result.pointsFor9Darter;
    }

    // Final points calculation, ensure precision (rounded to 2 decimal places)
    result.points = Math.round((result.basePoints + result.bonusPoints) * 100) / 100;
}
