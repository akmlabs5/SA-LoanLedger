import { usePreferences } from '@/contexts/PreferencesContext';

type SoundEffect = 'success' | 'error' | 'click' | 'notification';

const soundUrls: Record<SoundEffect, string> = {
  success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8N+RQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAo=',
  error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8N+RQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAo=',
  click: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
  notification: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8N+RQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvs56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAoVXrTp66lVFApHn+DyvmwhBi+Azvi+Zx0FNYzV8cqBMwcZaLvt56RPEAxSp+Pxt2McBjiP1/LNdzAFJHfH8OCRQAo=',
};

const audioCache: Record<SoundEffect, HTMLAudioElement> = {} as any;

Object.entries(soundUrls).forEach(([key, url]) => {
  const audio = new Audio(url);
  audio.volume = 0.3;
  audioCache[key as SoundEffect] = audio;
});

export function useSoundEffects() {
  const { preferences } = usePreferences();
  const soundsEnabled = preferences?.enableSounds !== false;

  const playSound = (effect: SoundEffect) => {
    if (!soundsEnabled) return;
    
    try {
      const audio = audioCache[effect];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Ignore errors (e.g., user hasn't interacted with page yet)
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return {
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playClick: () => playSound('click'),
    playNotification: () => playSound('notification'),
    soundsEnabled,
  };
}
