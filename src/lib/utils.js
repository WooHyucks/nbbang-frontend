import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * URL에 캐시 무효화를 위한 타임스탬프 파라미터를 추가합니다.
 * @param {string} url - 원본 URL
 * @returns {string} 타임스탬프가 추가된 URL
 */
export function addCacheBustingParam(url) {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
}
