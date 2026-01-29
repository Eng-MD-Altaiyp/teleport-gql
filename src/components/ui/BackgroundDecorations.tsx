

export const BackgroundDecorations = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            {/* Glowing Orb - Bottom Left */}
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />

            {/* Rotating Rings - Bottom Left */}
            <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] opacity-10 dark:opacity-20 text-primary">
                {/* Ring 1 - Dashed - Clockwise */}
                <div className="absolute inset-0 border-[3px] border-dashed border-current rounded-full animate-[spin_60s_linear_infinite]" />

                {/* Ring 2 - Dashed - Counter Clockwise - Smaller */}
                <div className="absolute inset-20 border-[3px] border-dashed border-current rounded-full animate-[spin-reverse_45s_linear_infinite]" />

                {/* Decorative Elements on Rings */}
                <div className="absolute top-1/2 left-0 w-4 h-4 bg-current rounded-full blur-[2px] animate-[spin_60s_linear_infinite]" />
            </div>

            {/* Subtle top right glow for balance */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        </div>
    );
};
