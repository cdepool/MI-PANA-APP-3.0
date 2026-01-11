import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange, className = '' }) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount if empty
        if (!value && inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (isNaN(Number(val))) return;

        const newOtp = value.split('');
        // Allow only last char if multiple entered (paste scenario handled separately usually, but simple here)
        newOtp[index] = val.substring(val.length - 1);
        const combined = newOtp.join('');
        onChange(combined);

        // Move to next
        if (val && index < length - 1 && inputs.current[index + 1]) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !value[index] && index > 0 && inputs.current[index - 1]) {
            // Move back if empty and backspace pressed
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/[^0-9]/g, '');
        onChange(pastedData);
    };

    return (
        <div className={`flex gap-2 justify-center ${className}`}>
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-mipana-mediumBlue focus:ring-2 focus:ring-mipana-mediumBlue/20 outline-none bg-white dark:bg-gray-800 dark:text-white transition-all"
                />
            ))}
        </div>
    );
};

export default OtpInput;
