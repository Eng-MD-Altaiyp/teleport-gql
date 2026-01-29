

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) => {

    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary text-primary-foreground shadow-lg hover:shadow-primary/50 hover:bg-primary/90 hover:scale-105",
        secondary: "bg-white dark:bg-slate-800 text-foreground border border-border hover:border-primary/50 hover:text-primary hover:shadow-md dark:hover:shadow-primary/20",
        ghost: "bg-transparent text-foreground/70 hover:text-primary hover:bg-primary/10"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-lg",
        md: "px-5 py-2.5 text-base rounded-xl",
        lg: "px-8 py-3.5 text-lg rounded-2xl"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {/* Glow Backdrop for Primary Buttons */}
            {variant === 'primary' && (
                <span className="absolute inset-0 rounded-xl bg-primary blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-40" />
            )}
            <span className="relative flex items-center gap-2">
                {children}
            </span>
        </button>
    );
};
