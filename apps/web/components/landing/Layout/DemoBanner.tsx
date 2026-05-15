export function DemoBanner() {
    return (
        <div className="w-full bg-mentha-mint text-mentha-forest text-center py-2.5 px-4 font-sans text-xs font-medium tracking-wide">
            This is a demo:{' '}
            <a
                href="https://github.com/beenruuu/mentha"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:opacity-70 transition-opacity"
            >
                self-host Mentha for free
            </a>{' '}
            to use the full platform.
        </div>
    );
}
