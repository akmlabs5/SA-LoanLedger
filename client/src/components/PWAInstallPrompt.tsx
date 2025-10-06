import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // Show again after 1 day if previously dismissed
    if (dismissed && Date.now() - dismissedTime < oneDayInMs) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds of page load
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show prompt after 5 seconds (manual instructions needed)
    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (deferredPrompt) {
      // Show the install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User ${outcome} the install prompt`);
      setDeferredPrompt(null);
    }
    
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Install Prompt Card */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50 animate-in slide-in-from-bottom duration-500">
        <Card className="mx-4 md:mx-0 mb-4 md:mb-0 bg-white dark:bg-gray-900 border-2 border-green-600 shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              data-testid="button-dismiss-install"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                M
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl">Install Morouna Loans</h3>
                <p className="text-white/90 text-sm">Fast, reliable, works offline</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {isIOS ? (
              // iOS Installation Instructions
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  To install this app on your iOS device:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Tap the Share button <span className="inline-block">📤</span> in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-800 dark:text-green-300">
                    Get instant access from your home screen
                  </p>
                </div>
              </div>
            ) : (
              // Android/Desktop Installation
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Install for Better Experience
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add Morouna Loans to your home screen for quick access, offline support, and a native app experience.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl mb-1">⚡</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Faster Loading</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Works Offline</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!isIOS && (
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11"
                  data-testid="button-install-pwa"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Now
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                className={`${isIOS ? 'flex-1' : 'flex-1'} h-11`}
                data-testid="button-maybe-later"
              >
                {isIOS ? 'Got it!' : 'Maybe Later'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
