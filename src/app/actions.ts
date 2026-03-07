
'use server';

import { getPlayerProfiles, updatePlayerProfiles, clearAllPlayerProfiles } from '@/lib/players';
import { addTournaments, clearAllTournamentData, deleteTournamentById, getTournaments } from '@/lib/tournaments';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { PlayerProfile, Tournament, ScoringSettings, LeagueId, AllLeagueSettings, TournamentPlayerResult, SponsorshipSettings } from '@/lib/types';
import { getAllScoringSettings, updateScoringSettings, updateLeagueSettings, getScoringSettings, updateBackgroundUrl, getLeagueSettings, updateSponsorshipSettings } from '@/lib/settings';
import { getDb } from '@/firebase/server';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import { calculateRankingsInternal } from '@/lib/leagues';
import * as cheerio from 'cheerio';
import { safeNumber } from '@/lib/utils';
import { calculatePlayerPoints } from '@/lib/scoring';

const stageToRankMap: Record<string, number> = {
    'победитель': 1,
    'победа': 1,
    '1 место': 1,
    'финал': 2,
    '2 место': 2,
    '1/2': 3,
    'полуфинал': 3,
    '3-4': 3,
    '1/4': 5,
    'четвертьфинал': 5,
    '5-8': 5,
    '1/8': 9,
    '9-16': 9,
    '1/16': 17,
    'резерв': 17,
};

const PRO_NICKNAMES = [
    "Снайпер", "Молния", "Танк", "Ястреб", "Вихрь", "Стрела", "Профи", "Легенда", 
    "Аллигатор", "Гром", "Авиатор", "Тигр", "Мастер", "Крепость", "Феникс", "Скорпион",
    "Voltage", "The Power", "Warrior", "Bullseye", "The Machine", "Titan", "Ace"
];

function getRandomNickname() {
    return PRO_NICKNAMES[Math.floor(Math.random() * PRO_NICKNAMES.length)];
}

export async function importTournament(prevState: unknown, formData: FormData) {
  try {
    const db = getDb();
    if (!db) {
      return { success: false, message: 'Критическая ошибка: Не удалось подключиться к базе данных. Проверьте переменные окружения Firebase в панели управления вашего хостинга.' };
    }

    const tournamentIdsRaw = formData.get('tournamentId');
    const league = formData.get('league') as LeagueId;

    if (!tournamentIdsRaw || typeof tournamentIdsRaw !== 'string') {
      return { success: false, message: 'Неверный ID турнира.' };
    }
    if (!league) {
      return { success: false, message: 'Лига не выбрана.' };
    }
    
    const tournamentIds = tournamentIdsRaw.match(/\d+/g) || [];
    if (tournamentIds.length === 0) {
        return { success: false, message: 'Не найдены корректные ID в строке.' };
    }
      
    const scoringSettings = await getScoringSettings(league);
    const playerProfiles = await getPlayerProfiles();
    const playerProfileMap = new Map(playerProfiles.map(p => [p.id, p]));
    const allNewPlayerProfiles: PlayerProfile[] = [];
    const tournamentsToCreate: Omit<Tournament, 'id'>[] = [];
    const errors: string[] = [];
    const parsedAtDate = new Date().toISOString();

    for (const tournamentId of tournamentIds) {
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
                  if ($temp('table').length > 0) {
                      html = tempHtml;
                      break; 
                  }
              }
          } catch (fetchError: unknown) {
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
          errors.push(`Турнир #${tournamentId}: Не удалось загрузить страницу турнира или на ней нет таблиц.`);
          continue;
      }
      
      try {
        const $ = cheerio.load(html);
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
        
        let table = $('table').filter((i, el) => {
            const h = $(el).find('thead th').text().toLowerCase();
            return h.includes('стадия') || h.includes('место') || h.includes('игрок') || h.includes('avg') || h.includes('имя');
        }).first();
        
        if (table.length === 0) {
            let maxRows = 0;
            let largestTable: cheerio.Cheerio | null = null;
            $('table').each(function() {
                const currentTable = $(this);
                const rows = currentTable.find('tr').length;
                if (rows > maxRows) {
                    maxRows = rows;
                    largestTable = currentTable;
                }
            });
            if (largestTable) {
                table = largestTable;
            }
        }
        
        if (table.length === 0) {
            throw new Error('Не найдено ни одной таблицы на странице.');
        }

        const headerMap: Record<string, number> = {};
        table.find('thead tr th').each((i, el) => {
          const txt = $(el).text().trim().toLowerCase();
          
          if (txt === 'avg' || txt === 'ср' || txt === 'ср.' || txt === 'average') {
            headerMap['avg'] = i;
          }
          if (txt.includes('hi-out') || txt.includes('hiout') || txt.includes('закрытие')) {
            headerMap['hiout'] = i;
          }
          if (txt.includes('best') || txt.includes('лучший') || txt.includes('leg')) {
            headerMap['bestleg'] = i;
          }
          if (txt.includes('180') || txt.includes('max')) {
            headerMap['180'] = i;
          }
          if (txt.includes('место') || txt === '#' || txt.includes('rank') || txt.includes('стадия')) {
            headerMap['rank'] = i;
          }
          if (txt.includes('игрок') || txt.includes('player') || txt.includes('имя')) {
            headerMap['name'] = i;
          }
        });
        
        if (headerMap['name'] === undefined) {
            throw new Error('Не удалось определить колонку "Игрок" в таблице.');
        }

        const rankIdx = headerMap['rank'];
        const nameIdx = headerMap['name'];

        const results: TournamentPlayerResult[] = [];
        table.find('tbody tr').each((i, row) => {
          const cols = $(row).find('td');
          if (cols.length < 2) return;

          const getTxt = (idx: number | undefined) => idx !== undefined ? $(cols[idx]).text().trim() : '';
          
          let rank = 0;
          if(rankIdx !== undefined){
              const rankTxt = getTxt(rankIdx).toLowerCase();
              for (const [k, v] of Object.entries(stageToRankMap)) {
                  if (rankTxt.includes(k)) { rank = v; break; }
              }
              if (rank === 0) rank = parseInt(rankTxt, 10) || 0;
          }
          if (rank === 0) rank = i + 1;
          
          const nameCell = cols.eq(nameIdx);
          const name = nameCell.find('a').text().trim() || nameCell.text().trim();
          if (!name) return;

          let pId = nameCell.find('a').attr('href')?.split('/').pop() || name.replace(/\s+/g, '-').toLowerCase();
          pId = pId.replace(/[./\\[\\]*]/g, '_');
          if (pId.startsWith('__') && pId.endsWith('__') && pId.length > 4) {
            pId = pId.substring(2, pId.length - 2);
          }
          
          let nickname = 'PRO';
          let existingProfile = playerProfileMap.get(pId);

          if (!existingProfile) {
              const newPlayerProfile: PlayerProfile = {
                  id: pId, name, nickname: getRandomNickname(),
                  avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
                  bio: 'Авто-профиль.', imageHint: 'person portrait',
                  backgroundUrl: 'https://images.unsplash.com/photo-1544098485-2a216e2133c1',
                  backgroundImageHint: 'darts background'
              };
              allNewPlayerProfiles.push(newPlayerProfile);
              playerProfileMap.set(pId, newPlayerProfile);
              nickname = newPlayerProfile.nickname;
          } else {
              nickname = existingProfile.nickname;
          }

          const playerResult: TournamentPlayerResult = {
            id: pId, name, nickname, rank,
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

        tournamentsToCreate.push({
          id: tournamentId, 
          name: tournamentName,
          date: eventDateFinal.toISOString(), 
          eventDate: eventDateFinal.toISOString(), 
          parsedAt: parsedAtDate,
          league, 
          players: results,
        } as any);

      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Неизвестная ошибка парсинга';
        errors.push(`Турнир #${tournamentId}: ${errorMessage}`);
      }
    }

    if (allNewPlayerProfiles.length > 0) {
        await updatePlayerProfiles(db, allNewPlayerProfiles);
    }
    if (tournamentsToCreate.length > 0) {
        await addTournaments(db, tournamentsToCreate);
    }

    if (tournamentsToCreate.length === 0 && errors.length > 0) {
        return { success: false, message: `Импорт не удался. Ошибки: ${errors.join('; ')}` };
    }

    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: `Импорт завершен. Успешно: ${tournamentsToCreate.length}. Ошибок: ${errors.length > 0 ? errors.join('; ') : '0'}` };
  } catch (error: unknown) {
    const message = error instanceof Error ? `Критическая ошибка записи в БД: ${error.message}` : 'Произошла непредвиденная ошибка во время записи данных в базу. Проверьте права доступа Firestore.';
    console.error("Критическая ошибка импорта:", error);
    return { success: false, message };
  }
}

export async function updatePlayer(player: PlayerProfile) {
  const db = getDb();
  if (!db) {
      return { success: false, message: 'Ошибка базы данных: нет подключения.' };
  }
  try {
    await updatePlayerProfiles(db, [player]);
    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Данные игрока обновлены.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка базы данных';
    return { success: false, message };
  }
}

export async function updatePlayerAvatar(playerId: string, avatarUrl: string | null) {
    const db = getDb();
    if (!db) {
        return { success: false, message: "Ошибка: База данных недоступна." };
    }
    try {
        const playerRef = doc(db, 'players', playerId);
        
        const updateData: any = { updatedAt: serverTimestamp() };
        if (avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        } else {
            const playerSnap = await getDoc(playerRef);
            if (playerSnap.exists()) {
                const name = playerSnap.data().name;
                updateData.avatarUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`;
            }
        }

        await setDoc(playerRef, updateData, { merge: true });
        revalidatePath('/', 'layout');
        return { success: true, message: 'Аватар обновлен.' };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Неизвестная ошибка при обновлении аватара';
        return { success: false, message };
    }
}

export async function deletePlayerAction(playerId: string) {
    const db = getDb();
    if (!db) {
        return { success: false, message: 'Ошибка: База данных недоступна.' };
    }
    try {
        await deleteDoc(doc(db, 'players', playerId));
        revalidateTag('rankings');
        revalidatePath('/', 'layout');
        return { success: true, message: 'Профиль игрока удален.' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка при удалении игрока';
        return { success: false, message };
    }
}

export async function clearAllPlayerData() {
  const db = getDb();
  if (!db) {
    return { success: false, message: 'Ошибка: База данных недоступна.' };
  }
  try {
    await clearAllPlayerProfiles(db);
    await clearAllTournamentData();
    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Все данные очищены.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка очистки данных';
    return { success: false, message };
  }
}

export async function clearTournamentsAction() {
  const db = getDb();
  if (!db) {
    return { success: false, message: 'Ошибка: База данных недоступна.' };
  }
  try {
    await clearAllTournamentData();
    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Все турниры удалены.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка удаления турниров';
    return { success: false, message };
  }
}

export async function saveScoringSettings(leagueId: LeagueId, data: ScoringSettings) {
  const db = getDb();
  if (!db) {
      return { success: false, message: 'Ошибка базы данных: нет подключения.' };
  }
  try {
    await updateScoringSettings(leagueId, data);
    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Настройки сохранены.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка сохранения настроек';
    return { success: false, message };
  }
}

export async function saveLeagueSettings(data: AllLeagueSettings) {
  const db = getDb();
  if (!db) {
      return { success: false, message: 'Ошибка базы данных: нет подключения.' };
  }
  try {
    await updateLeagueSettings(data);
    revalidateTag('rankings');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Лиги обновлены.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка обновления лиг';
    return { success: false, message };
  }
}

export async function deleteTournamentAction(tournamentId: string) {
    const db = getDb();
    if (!db) {
      return { success: false, message: 'Ошибка: База данных недоступна.' };
    }
    try {
        await deleteTournamentById(tournamentId);
        revalidateTag('rankings');
        revalidatePath('/', 'layout');
        return { success: true, message: 'Турнир удален.' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ошибка удаления турнира';
        return { success: false, message };
    }
}

export async function saveBackgroundAction(prevState: unknown, formData: FormData) {
  const intent = formData.get('intent');
  const db = getDb();
  if (!db) {
      return { success: false, message: 'Ошибка базы данных: нет подключения.' };
  }
  try {
    if (intent === 'reset') {
        await updateBackgroundUrl('');
    } else {
        const url = formData.get('url') as string;
        await updateBackgroundUrl(url);
    }
    revalidatePath('/', 'layout');
    return { success: true, message: intent === 'reset' ? 'Фон сброшен.' : 'Фон обновлен.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка сохранения фона';
    return { success: false, message };
  }
}

export async function saveSponsorshipAction(data: SponsorshipSettings) {
    const db = getDb();
    if (!db) {
        return { success: false, message: 'Ошибка базы данных: нет подключения.' };
    }
    try {
        await updateSponsorshipSettings(data);
        revalidatePath('/', 'layout');
        return { success: true, message: 'Настройки спонсорства обновлены.' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ошибка сохранения спонсорства';
        return { success: false, message };
    }
}

export async function logVisitAction() {
    const db = getDb();
    if (!db) {
        console.error("Database not available for logVisitAction. Silently failing.");
        return;
    }
  try {
    const h = await headers();
    const ua = h.get('user-agent') || '';
    const isBot = /bot|spider|crawler|lighthouse|inspect/i.test(ua);
    if (isBot) return;

    await addDoc(collection(db, 'visits'), {
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to log visit:', e);
  }
}

export async function logSponsorClickAction(playerId: string, playerName: string, sponsorName: string) {
    const db = getDb();
    if (!db) {
        console.error("Database not available for logSponsorClickAction. Silently failing.");
        return { success: false };
    }
    try {
        await addDoc(collection(db, 'sponsor_clicks'), {
            playerId,
            playerName,
            sponsorName,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        console.error('Failed to log click:', e);
        return { success: false };
    }
}

export async function exportAllRankingsAction() {
    const db = getDb();
    if (!db) {
        return { success: false, message: 'База данных не доступна.' };
    }
    try {
        const [ls, playerProfiles, allTournaments, allScoringSettings] = await Promise.all([
            getLeagueSettings(),
            getPlayerProfiles(),
            getTournaments(),
            getAllScoringSettings()
        ]);

        const leagues = Array.from(new Set(['general', ...(Object.keys(ls) as LeagueId[]).filter(k => (ls as any)[k].enabled)])) as LeagueId[];
        let csv = 'League,Rank,Name,Nickname,Points,Matches,AVG,180s,Hi-Out\n';
        
        for (const lid of leagues) {
            const players = calculateRankingsInternal(lid, playerProfiles, allTournaments, allScoringSettings);
            players.filter(p => p.matchesPlayed > 0).forEach(p => {
                csv += `${lid},${p.rank},"${p.name}","${p.nickname}",${p.points},${p.matchesPlayed},${p.avg.toFixed(2)},${p.n180s},${p.hiOut}\n`;
            });
        }
        return { success: true, csv };
    } catch(e: unknown) { 
        const message = e instanceof Error ? e.message : 'Неизвестная ошибка при экспорте';
        return { success: false, message }; 
    }
}

export async function triggerDeploymentAction() {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const workflowId = process.env.GITHUB_WORKFLOW_ID || 'deploy.yml';

    if (!token || !owner || !repo) {
        return { success: false, message: 'Настройки GitHub не настроены.' };
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({
                ref: 'main', // или ветка по умолчанию
            }),
        });

        if (response.ok) {
            return { success: true, message: 'Обновление запущено в GitHub Actions.' };
        } else {
            const err = await response.json();
            return { success: false, message: `Ошибка GitHub: ${err.message || response.statusText}` };
        }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Ошибка сети при обращении к GitHub.';
        return { success: false, message };
    }
}
