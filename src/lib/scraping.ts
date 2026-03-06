
'use server';
/**
 * @fileoverview Live Documentation & Scraper for Darts Tournaments.
 *
 * This file serves a dual purpose:
 * 1.  It contains the active scraping logic for parsing tournament data from dartsbase.ru.
 * 2.  It acts as a detailed technical specification for an AI to understand, replicate,
 *     or extend the parsing functionality for other websites.
 *
 * AI SPECIFICATION:
 * To add a new scraper, create a new function (e.g., `scrapeTournamentData_MySite`)
 * and follow the implementation blueprint outlined in the JSDoc comments within
 * the `scrapeDartsbaseTournament` function. The function must adhere to the
 * `ScraperFunction` type and return a `ScrapedTournamentData` object.
 */

import * as cheerio from 'cheerio';
import type { ScoringSettings, TournamentPlayerResult, PlayerProfile, LeagueId, Tournament } from '@/lib/types';
import { calculatePlayerPoints } from './scoring';
import { PRO_NICKNAMES, stageToRankMap } from './constants';
import { safeNumber } from './utils';

/**
 * The contract for the data returned by any scraper function.
 * This ensures that the main import action can process the data uniformly.
 */
export interface ScrapedTournamentData {
  tournament: Omit<Tournament, 'id'>;
  newPlayerProfiles: PlayerProfile[];
}

/**
 * A scraper function must accept these parameters and return a Promise
 * resolving to the structured tournament data.
 */
export type ScraperFunction = (
  input: string,
  league: LeagueId,
  scoringSettings: ScoringSettings,
  existingProfiles: PlayerProfile[]
) => Promise<ScrapedTournamentData>;


/**
 * SPECIFICATION: Fetches and parses tournament data from dartsbase.ru.
 * @param tournamentId - The unique identifier of the tournament on dartsbase.ru.
 * @param league - The league ID to which this tournament belongs.
 * @param scoringSettings - The scoring rules for the specified league.
 * @param existingProfiles - An array of current player profiles to check against.
 * @returns A structured `ScrapedTournamentData` object.
 * @throws An error if the page cannot be fetched or if no player data is found.
 */
export const scrapeDartsbaseTournament: ScraperFunction = async (
  tournamentId,
  league,
  scoringSettings,
  existingProfiles,
) => {
  // ---
  // SPECIFICATION 1: INITIALIZATION & FETCHING
  // 1.1. Construct at least two potential URLs. The target site may use different URL structures.
  // 1.2. Set a 'User-Agent' header to mimic a real browser, as some sites block non-browser requests.
  // 1.3. Implement a timeout (e.g., 10 seconds) to prevent the process from hanging on a slow response.
  // ---
  let html = '';
  const urlsToTry = [
    `https://dartsbase.ru/tournaments/${tournamentId}/stats`,
    `https://dartsbase.ru/tournaments/${tournamentId}`
  ];

  for (const url of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        cache: 'no-store',
        signal: controller.signal
      });

      if (response.ok) {
        const tempHtml = await response.text();
        const $temp = cheerio.load(tempHtml);
        // 1.4. Validate the fetched content. A simple check for a `<table>` is sufficient.
        if ($temp('table').length > 0) {
          html = tempHtml;
          break;
        }
      }
    } catch (fetchError: unknown) {
        // Errors are logged but we continue to the next URL.
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.warn(`Запрос к ${url} превысил время ожидания.`);
        } else {
            console.error(`Ошибка при загрузке ${url}:`, fetchError);
        }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!html) {
    throw new Error('Не удалось загрузить страницу турнира или на ней нет таблиц.');
  }

  const $ = cheerio.load(html);
  const newPlayerProfiles: PlayerProfile[] = [];

  // ---
  // SPECIFICATION 2: METADATA EXTRACTION
  // 2.1. Tournament Name: Find the main heading (H1) and clean it of any extra tags or text (like dates).
  // 2.2. Tournament Date: Use a regular expression `(\d{1,2})[./-](\d{1,2})[./-](\d{4})` to find a date
  //      within the page's main heading or body. This is crucial for time-series analytics.
  //      If no date is found, fall back to the current date.
  // ---
  const h1Text = $('h1').text().trim();
  let tournamentName = $('h1').clone().find('span').remove().end().text().trim() || `Турнир #${tournamentId}`;
  let tournamentDate: Date | null = null;
  const datePattern = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/;
  const dateInTitle = h1Text.match(datePattern);
  if (dateInTitle) {
      const day = parseInt(dateInTitle[1], 10);
      const month = parseInt(dateInTitle[2], 10);
      const year = parseInt(dateInTitle[3], 10);
      tournamentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      tournamentName = tournamentName.replace(dateInTitle[0], '').replace(/\s+/g, ' ').trim().replace(/[.,\s/:-]+$/, '').trim();
  }
  const eventDateFinal = tournamentDate || new Date();


  // ---
  // SPECIFICATION 3: DYNAMIC COLUMN MAPPING
  // 3.1. Identify the main results table.
  // 3.2. Iterate through the table headers (`<th>`).
  // 3.3. Use a map of keywords (e.g., 'avg', 'ср', 'average' all map to 'avg') to dynamically find
  //      the column index for each required statistic. This makes the parser resilient to column reordering.
  // ---
  let table = $('table').filter((i, el) => {
      const h = $(el).find('thead th').text().toLowerCase();
      return h.includes('стадия') || h.includes('место') || h.includes('игрок') || h.includes('avg');
  }).first();
  if (table.length === 0) table = $('table').first();

  const headerMap: Record<string, number> = {};
  table.find('thead tr th').each((i, el) => {
    const txt = $(el).text().trim().toLowerCase();
    if (txt === 'avg' || txt === 'ср' || txt === 'ср.' || txt === 'average') headerMap['avg'] = i;
    else if (txt.includes('hi') || txt.includes('закрытие') || txt.includes('out')) headerMap['hiout'] = i;
    else if (txt.includes('best') || txt.includes('лучший') || txt.includes('leg')) headerMap['bestleg'] = i;
    else if (txt.includes('180') || txt.includes('max')) headerMap['180'] = i;
    else if (txt.includes('место') || txt === '#' || txt === 'rank' || txt.includes('стадия')) headerMap['rank'] = i;
    else if (txt.includes('игрок') || txt.includes('player') || txt === 'имя') headerMap['name'] = i;
  });

  const rankIdx = headerMap['rank'] ?? 0;
  const nameIdx = headerMap['name'] ?? (rankIdx === 0 ? 1 : 0);


  // ---
  // SPECIFICATION 4: ROW PROCESSING & DATA NORMALIZATION
  // 4.1. Iterate through each table row (`<tr>`) in the `<tbody>`.
  // 4.2. Player ID: Attempt to extract a unique ID from the player's profile link. If unavailable,
  //      create a "slug" from the player's name. Sanitize the ID to be Firestore-compliant (no slashes, dots, etc.).
  // 4.3. New Players: If the generated player ID is not in `existingProfiles`, create a new PlayerProfile object.
  // 4.4. Rank/Stage: Convert textual stages (e.g., "Финал", "1/2") to a numeric rank using a predefined map.
  // 4.5. Numeric Data: Sanitize all numeric fields, removing non-digit characters and converting to numbers.
  // 4.6. Point Calculation: For each player, invoke `calculatePlayerPoints` to convert raw stats into system points.
  // ---
  const results: TournamentPlayerResult[] = [];
  table.find('tbody tr').each((i, row) => {
    const cols = $(row).find('td');
    if (cols.length < 2) return;

    const getTxt = (idx: number | undefined) => idx !== undefined ? $(cols[idx]).text().trim() : '';
    
    const rankTxt = getTxt(rankIdx).toLowerCase();
    let rank = 0;
    for (const [k, v] of Object.entries(stageToRankMap)) {
        if (rankTxt.includes(k)) { rank = v; break; }
    }
    if (rank === 0) rank = parseInt(rankTxt, 10) || (i + 1);
    
    const nameCell = cols.eq(nameIdx);
    const name = nameCell.find('a').text().trim() || nameCell.text().trim();
    if (!name) return;

    let pId = nameCell.find('a').attr('href')?.split('/').pop() || name.replace(/\s+/g, '-').toLowerCase();
    pId = pId.replace(/[./\\[\\]*]/g, '_');
    if (pId.startsWith('__') && pId.endsWith('__') && pId.length > 4) {
      pId = pId.substring(2, pId.length - 2);
    }
    
    if (!existingProfiles.some(p => p.id === pId) && !newPlayerProfiles.some(p => p.id === pId)) {
        newPlayerProfiles.push({
            id: pId, name, nickname: PRO_NICKNAMES[Math.floor(Math.random() * PRO_NICKNAMES.length)],
            avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
            bio: 'Авто-профиль.', imageHint: 'person portrait',
            backgroundUrl: 'https://images.unsplash.com/photo-1544098485-2a216e2133c1',
            backgroundImageHint: 'darts background'
        });
    }

    const playerResult: TournamentPlayerResult = {
      id: pId, name, nickname: 'PRO', rank,
      points: 0, basePoints: 0, bonusPoints: 0,
      pointsFor180s: 0, is180BonusApplied: false,
      pointsForHiOut: 0, isHiOutBonusApplied: false,
      pointsForAvg: 0, isAvgBonusApplied: false,
      pointsForBestLeg: 0, isBestLegBonusApplied: false,
      pointsFor9Darter: 0, is9DarterBonusApplied: false,
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
      imageHint: 'person portrait',
      avg: safeNumber(getTxt(headerMap['avg']).replace(',', '.')),
      n180s: safeNumber(getTxt(headerMap['180'])),
      hiOut: safeNumber(getTxt(headerMap['hiout'])),
      bestLeg: safeNumber(getTxt(headerMap['bestleg'])),
      nineDarters: 0,
    };

    calculatePlayerPoints(playerResult, scoringSettings, league);
    results.push(playerResult);
  });

  if (results.length === 0) {
      throw new Error('Не найдено ни одного игрока в таблице результатов.');
  }
  
  // ---
  // SPECIFICATION 5: OUTPUT
  // 5.1. Assemble the final `ScrapedTournamentData` object, containing the tournament details
  //      and a list of any newly discovered player profiles. This object is the required output format.
  // ---
  return {
    tournament: {
        id: tournamentId, 
        name: tournamentName,
        date: eventDateFinal.toISOString(), 
        eventDate: eventDateFinal.toISOString(), 
        parsedAt: new Date().toISOString(),
        league, 
        players: results,
    } as any,
    newPlayerProfiles,
  };
};
