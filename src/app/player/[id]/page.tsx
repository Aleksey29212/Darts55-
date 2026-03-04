

'use server';

import { getPlayerProfileById } from '@/lib/players';
import { getTournaments } from '@/lib/tournaments';
import { notFound } from 'next/navigation';
import { PlayerPageClient } from './player-page-client';
import type { Player, PlayerTournamentHistory, ScoringSettings, LeagueId } from '@/lib/types';
import { getRankings } from '@/lib/leagues';
import { Timestamp } from 'firebase/firestore';
import { getAllScoringSettings, getLeagueSettings, getScoringSettings } from '@/lib/settings';
import { calculatePlayerPoints } from '@/lib/scoring';
import { formatDate } from '@/lib/utils';

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tournamentId?: string; league?: LeagueId };
}) {
  const playerId = decodeURIComponent(params.id);
  const tournamentId = searchParams?.tournamentId;
  const selectedLeague = searchParams?.league;

  const basePlayerProfile = await getPlayerProfileById(playerId);
  if (!basePlayerProfile) {
    notFound();
  }

  let playerForCard: Player;
  let tournamentsForHistory: PlayerTournamentHistory[] = [];
  const viewMode: 'aggregate' | 'single' = tournamentId ? 'single' : 'aggregate';
  let pageSubtitle: string | null = null;
  let scoringSettingsForHelp: ScoringSettings;
  let leagueNameForHelp: string;
  
  const allTournaments = await getTournaments();
  const leagueSettings = await getLeagueSettings();
  const allScoringSettings = await getAllScoringSettings();

  if (viewMode === 'single') {
    const tournament = allTournaments.find(t => t.id === tournamentId);

    if (!tournament) {
      notFound();
    }
    
    scoringSettingsForHelp = await getScoringSettings(tournament.league);
    leagueNameForHelp = leagueSettings[tournament.league]?.name || tournament.league;

    const playerResultInTournament = tournament.players.find((p) => p.id === playerId);

    if (!playerResultInTournament) {
      const generalRankings = await getRankings('general');
      const foundPlayer = generalRankings.find(p => p.id === playerId);
      if (!foundPlayer) notFound();
      playerForCard = foundPlayer;
      pageSubtitle = 'Общая карьерная статистика (игрок не найден в этом турнире)';
    } else {
      const playerResult = { ...playerResultInTournament }; // Create a mutable copy

      // Recalculate points on the fly for this single tournament view
      const scoringSettings = await getScoringSettings(tournament.league);
      calculatePlayerPoints(playerResult, scoringSettings, tournament.league);
      
      playerForCard = {
        ...basePlayerProfile,
        ...playerResult,
        matchesPlayed: 1,
        wins: playerResult.rank <= 8 ? 1 : 0,
        losses: playerResult.rank > 8 ? 1 : 0,
        totalPointsFor180s: playerResult.pointsFor180s,
        totalPointsForHiOut: playerResult.pointsForHiOut,
        totalPointsForAvg: playerResult.pointsForAvg,
        totalPointsForBestLeg: playerResult.pointsForBestLeg,
        totalPointsFor9Darter: playerResult.pointsFor9Darter,
        rank: playerResult.rank,
      };
      pageSubtitle = `Статистика в турнире: ${tournament.name} (${formatDate(tournament.date)})`;
    }
  } else {
    // For aggregate view, show selected or general ranking
    const activeLeague: LeagueId = selectedLeague || 'general';
    scoringSettingsForHelp = await getScoringSettings(activeLeague);
    leagueNameForHelp = leagueSettings[activeLeague]?.name || activeLeague;
    
    const leagueRankings = await getRankings(activeLeague);
    const foundPlayer = leagueRankings.find(p => p.id === playerId);
    
    if (!foundPlayer) {
      playerForCard = {
        ...basePlayerProfile,
        rank: 0,
        points: 0,
        basePoints: 0,
        bonusPoints: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        avg: 0,
        n180s: 0,
        hiOut: 0,
        bestLeg: 0,
        totalPointsFor180s: 0,
        totalPointsForHiOut: 0,
        totalPointsForAvg: 0,
        totalPointsForBestLeg: 0,
        totalPointsFor9Darter: 0,
      }
    } else {
        playerForCard = foundPlayer;
    }

    // Filter tournaments based on the active league context
    const filteredTournaments = allTournaments.filter(tournament => {
        const isPlayerInTournament = tournament.players.some(p => p.id === playerId);
        if (!isPlayerInTournament) return false;

        if (activeLeague === 'general') {
            return allScoringSettings[tournament.league]?.includeInGeneral;
        } else {
            return tournament.league === activeLeague;
        }
    });

    const historyPromises = filteredTournaments.map(async (tournament) => {
          const playerResult = tournament.players.find((p) => p.id === playerId)!;
          const scoringSettings = await getScoringSettings(tournament.league);
          
          const playerResultCopy = { ...playerResult };
          calculatePlayerPoints(playerResultCopy, scoringSettings, tournament.league);
          
          return {
              playerId: playerId,
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              tournamentDate: tournament.date,
              playerRank: playerResultCopy.rank,
              playerPoints: playerResultCopy.points,
              leagueName: leagueSettings[tournament.league]?.name || tournament.league,
              // Include stats for badges
              hiOut: playerResultCopy.hiOut,
              n180s: playerResultCopy.n180s,
              bestLeg: playerResultCopy.bestLeg,
          };
      });

    tournamentsForHistory = (await Promise.all(historyPromises))
      .sort((a, b) => new Date(b.tournamentDate as string).getTime() - new Date(a.tournamentDate as string).getTime());

    pageSubtitle = activeLeague === 'general' 
        ? `Карьерная статистика (Общий зачет)` 
        : `Карьерная статистика (${leagueNameForHelp})`;
  }

  return (
    <PlayerPageClient
      player={playerForCard}
      tournaments={tournamentsForHistory}
      viewMode={viewMode}
      pageSubtitle={pageSubtitle}
      contextId={tournamentId}
      scoringSettings={scoringSettingsForHelp}
      leagueName={leagueNameForHelp}
      leagueId={tournamentId ? (allTournaments.find(t => t.id === tournamentId)?.league) : selectedLeague}
    />
  );
}
