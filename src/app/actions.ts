
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
import { scrapeDartsbaseTournament } from '@/lib/scraping';

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
    const tournamentsToCreate: Omit<Tournament, 'id'>[] = [];
    let playerProfiles = await getPlayerProfiles();
    const allNewPlayerProfiles: PlayerProfile[] = [];
    const errors: string[] = [];

    for (const tournamentId of tournamentIds) {
      try {
        const scrapedData = await scrapeDartsbaseTournament(tournamentId, league, scoringSettings, playerProfiles);
        
        tournamentsToCreate.push(scrapedData.tournament);
        
        if (scrapedData.newPlayerProfiles.length > 0) {
            allNewPlayerProfiles.push(...scrapedData.newPlayerProfiles);
            // Update local cache of profiles to avoid duplicates in the same run
            playerProfiles.push(...scrapedData.newPlayerProfiles);
        }

      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          errors.push(`Турнир #${tournamentId}: ${errorMessage}`);
          continue;
      }
    }

    if (allNewPlayerProfiles.length > 0) {
        // Remove duplicates before saving
        const uniqueNewProfiles = allNewPlayerProfiles.filter((p, i, a) => a.findIndex(p2 => p2.id === p.id) === i);
        await updatePlayerProfiles(db, uniqueNewProfiles);
    }
    if (tournamentsToCreate.length > 0) {
        await addTournaments(db, tournamentsToCreate);
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
