import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const checkIOS = () => {
            const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            setIsIOS(isIOSDevice);
        };

        checkIOS();

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app is already installed
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    // iOS specific instructions
    if (isIOS && !showPrompt) {
        return null;
    }

    if (!showPrompt && !isIOS) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                zIndex: 1000,
                maxWidth: '320px',
                animation: 'slideUp 0.3s ease-out',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Download size={24} style={{ flexShrink: 0, color: '#fff' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                        Install MFP Gym App
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '12px' }}>
                        {isIOS
                            ? 'Tap the share button and select "Add to Home Screen"'
                            : 'Install the app on your device for quick access'}
                    </div>
                    {!isIOS && (
                        <button
                            onClick={handleInstall}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: '#fff',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                            }}
                        >
                            Install Now
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowPrompt(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
