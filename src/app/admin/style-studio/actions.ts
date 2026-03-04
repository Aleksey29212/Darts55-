'use server';

/**
 * @fileOverview Server actions for the Style Studio feature.
 *
 * - generatePlayerCardStyling - A function that generates styling themes.
 * - updateThemeAction - A function that updates the application theme.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ThemeSettings } from '@/lib/types';
import { updateThemeSettings } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

// --- Logic from generate-player-card-styling.ts ---

const GeneratePlayerCardStylingInputSchema = z.object({
  playerName: z.string().optional().describe('The name of the player.'),
  playerRanking: z.number().optional().describe('The ranking of the player.'),
  playerStats: z.string().optional().describe('The statistics of the player.'),
  cardThemePreference: z
    .string()
    .optional()
    .describe('The user preference for the card theme, if any.'),
});
export type GeneratePlayerCardStylingInput = z.infer<
  typeof GeneratePlayerCardStylingInputSchema
>;

const GeneratePlayerCardStylingOutputSchema = z.object({
  description: z
    .string()
    .describe(
      'A text description of the suggested style and the reasoning behind it.'
    ),
  theme: z.object({
    primary: z
      .string()
      .describe('The primary color in HSL format (e.g., "45 100% 51%").'),
    accent: z
      .string()
      .describe('The accent color in HSL format (e.g., "217 91% 60%").'),
    background: z
      .string()
      .describe('The background color in HSL format (e.g., "230 9% 7%").'),
    foreground: z
      .string()
      .describe('The foreground color in HSL format (e.g., "0 0% 98%"). Ensure high contrast with the background color.'),
    gold: z
      .string()
      .describe('The gold color for 1st place in HSL format (e.g., "45 93% 48%").'),
    silver: z
      .string()
      .describe('The silver color for 2nd place in HSL format (e.g., "220 13% 75%").'),
    bronze: z
      .string()
      .describe('The bronze color for 3rd place in HSL format (e.g., "28 65% 55%").'),
  }),
});
export type GeneratePlayerCardStylingOutput = z.infer<
  typeof GeneratePlayerCardStylingOutputSchema
>;

const stylingPrompt = ai.definePrompt({
  name: 'generatePlayerCardStylingPrompt',
  input: {schema: GeneratePlayerCardStylingInputSchema},
  output: {schema: GeneratePlayerCardStylingOutputSchema},
  prompt: `You are an expert UI/UX designer specializing in app theming.

  {{#if playerName}}
  Based on the player's name, ranking, and stats, generate a color theme for the application that reflects the player's persona.

  Player Name: {{{playerName}}}
  Player Ranking: {{{playerRanking}}}
  Player Stats: {{{playerStats}}}
  {{else}}
  Generate a general, versatile, and visually appealing color theme for a professional darts tournament application. The theme should be modern, energetic, and suitable for a competitive sports context.
  {{/if}}

  Card Theme Preference: {{#if cardThemePreference}}{{{cardThemePreference}}}{{else}}No specific theme preference{{/if}}

  Your response should include:
  1. A 'description' of the design choices, explaining why they are suitable.
  2. A 'theme' object containing specific HSL values for 'primary', 'accent', 'background', 'foreground', 'gold', 'silver', and 'bronze' colors for a dark theme. Ensure the 'foreground' color provides high contrast against the 'background' color for readability.

  Only provide the HSL values, without the 'hsl()' wrapper. For example: "45 100% 51%".
`,
});

const generatePlayerCardStylingFlow = ai.defineFlow(
  {
    name: 'generatePlayerCardStylingFlow',
    inputSchema: GeneratePlayerCardStylingInputSchema,
    outputSchema: GeneratePlayerCardStylingOutputSchema,
  },
  async input => {
    const {output} = await stylingPrompt(input);
    return output!;
  }
);

export async function generatePlayerCardStyling(
  input: GeneratePlayerCardStylingInput
): Promise<GeneratePlayerCardStylingOutput> {
  return generatePlayerCardStylingFlow(input);
}


// --- Logic from themeActions.ts ---
export async function updateThemeAction(theme: ThemeSettings | null) {
  try {
    await updateThemeSettings(theme);
    revalidatePath('/', 'layout');

    return { 
      success: true, 
      message: theme ? 'Тема успешно сохранена в облаке!' : 'Тема сброшена к стандартной.' 
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Не удалось сохранить настройки темы';
    console.error('Failed to update theme in Firestore:', msg);
    return { success: false, message: msg };
  }
}
