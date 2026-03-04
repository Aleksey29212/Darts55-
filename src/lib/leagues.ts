import { getPlayerProfiles } from '@/lib/players';
import { getTournaments } from '@/lib/tournaments';
import { getAllScoringSettings } from '@/lib/settings';
import type { Player, Tournament, LeagueId, PlayerProfile, TournamentPlayerResult, ScoringSettings } from '@/lib/types';
import { calculatePlayerPoints } from './scoring';
import { safeNumber } from './utils';

/**
 * Internal helper to calculate rankings from pre-fetched data.
 * This avoids redundant database calls when calculating rankings for multiple leagues.
 */
export function calculateRankingsInternal(
    leagueId: LeagueId,
    playerProfiles: PlayerProfile[],
    allTournaments: Tournament[],
    allScoringSettings: Record<LeagueId, ScoringSettings>
): Player[] {
    // Если это общий рейтинг, берем турниры всех лиг, у которых разрешено включение в общий зачет
    const tournamentsToProcess = leagueId === 'general'
        ? allTournaments.filter(t => allScoringSettings[t.league]?.includeInGeneral)
        : allTournaments.filter(t => t.league === leagueId);
    
    const allPlayerResults: (TournamentPlayerResult & { league: LeagueId })[] = [];

    tournamentsToProcess.forEach(tournament => {
        const settings = allScoringSettings[tournament.league];
        if (settings) {
            tournament.players.forEach(p => {
                // Клонируем объект игрока, чтобы не мутировать кэш
                const pCopy = JSON.parse(JSON.stringify(p));
                calculatePlayerPoints(pCopy, settings, tournament.league);
                allPlayerResults.push({ ...pCopy, league: tournament.league });
            });
        }
    });

    const resultsByPlayer = new Map<string, (TournamentPlayerResult & { league: LeagueId })[]>();
    allPlayerResults.forEach(result => {
        if (!resultsByPlayer.has(result.id)) resultsByPlayer.set(result.id, []);
        resultsByPlayer.get(result.id)!.push(result);
    });

    const allPlayers: Omit<Player, 'rank'>[] = playerProfiles.map(profile => {
        const results = resultsByPlayer.get(profile.id) || [];
        
        const stats = results.reduce((acc, r) => {
            acc.points += safeNumber(r.points);
            acc.basePoints += safeNumber(r.basePoints);
            acc.bonusPoints += safeNumber(r.bonusPoints);
            acc.matchesPlayed += 1;
            // В лиге Вечерний Омск победой (ТОП-8) считаются места с 1 по 8
            acc.wins += (safeNumber(r.rank) <= 8 ? 1 : 0);
            acc.n180s += safeNumber(r.n180s);
            acc.hiOut = Math.max(acc.hiOut, safeNumber(r.hiOut));
            
            const bl = safeNumber(r.bestLeg);
            if (bl > 0 && bl < acc.bestLeg) acc.bestLeg = bl;
            
            // Суммируем AVG для последующего деления на количество турниров
            acc.avgSum += safeNumber(r.avg);
            return acc;
        }, {
            points: 0, basePoints: 0, bonusPoints: 0, matchesPlayed: 0,
            wins: 0, n180s: 0, hiOut: 0, bestLeg: 999, avgSum: 0
        });

        if (stats.bestLeg === 999) stats.bestLeg = 0;
        
        // ВАЖНО: Средний AVG по всем турам для этой лиги (а не сумма)
        const avg = results.length > 0 ? stats.avgSum / results.length : 0;

        return {
            ...profile,
            points: Math.round(stats.points * 100) / 100,
            basePoints: Math.round(stats.basePoints * 100) / 100,
            bonusPoints: Math.round(stats.bonusPoints * 100) / 100,
            matchesPlayed: stats.matchesPlayed,
            wins: stats.wins,
            losses: stats.matchesPlayed - stats.wins,
            avg: Math.round(avg * 100) / 100,
            n180s: stats.n180s,
            hiOut: stats.hiOut,
            bestLeg: stats.bestLeg,
            totalPointsFor180s: 0, totalPointsForHiOut: 0, totalPointsForAvg: 0,
            totalPointsForBestLeg: 0, totalPointsFor9Darter: 0,
        };
    });

    const playersWithMatches = allPlayers.filter(p => p.matchesPlayed > 0);
    
    // Сортировка: Сначала по баллам, затем по AVG, затем по количеству ТОП-8 (побед)
    playersWithMatches.sort((a, b) => {
        if (Math.abs(b.points - a.points) > 0.001) return b.points - a.points;
        if (Math.abs(b.avg - a.avg) > 0.001) return b.avg - a.avg;
        return b.wins - a.wins;
    });

    const ranked: Player[] = [];
    let curRank = 0;
    for (let i = 0; i < playersWithMatches.length; i++) {
        const p = playersWithMatches[i];
        const prev = playersWithMatches[i-1];
        // Если показатели идентичны, ранг может быть одинаковым (делим места)
        if (i === 0 || Math.abs(p.points - prev.points) > 0.001 || Math.abs(p.avg - prev.avg) > 0.001) {
            curRank = i + 1;
        }
        ranked.push({ ...p, rank: curRank });
    }

    return [...ranked, ...allPlayers.filter(p => p.matchesPlayed === 0).map(p => ({...p, rank: 0}))];
}

export async function getRankings(leagueId: LeagueId): Promise<Player[]> {
    const [playerProfiles, allTournaments, allScoringSettings] = await Promise.all([
        getPlayerProfiles(),
        getTournaments(),
        getAllScoringSettings(),
    ]);
    return calculateRankingsInternal(leagueId, playerProfiles, allTournaments, allScoringSettings);
}
