'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import type { Tournament } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export function TournamentShareButton({ tournament }: { tournament: Tournament }) {
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        // Construct the canonical URL without query params
        setShareUrl(window.location.origin + window.location.pathname);
    }, []);

    const handleShareToVk = () => {
        if (!shareUrl) return;
        
        const title = `Результаты турнира: ${tournament.name}`;
        const description = `Итоги турнира от ${formatDate(tournament.date)}. Узнайте, кто стал лучшим!`;
        const imageUrl = `https://picsum.photos/seed/dartstournament/600/400`;

        const vkShareUrl = `https://vk.com/share.php?url=${encodeURIComponent(
            shareUrl
        )}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(
            description
        )}&image=${encodeURIComponent(imageUrl)}`;
        
        window.open(vkShareUrl, '_blank', 'noopener,noreferrer');
    };
    
    if (!shareUrl) {
        return null;
    }

    return (
        <Button onClick={handleShareToVk} variant="outline">
            <Share2 />
            Поделиться в VK
        </Button>
    );
}
