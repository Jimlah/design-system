import { cn } from '@/libs/utils';
import { Input as InputPrimitive, InputProps } from 'react-aria-components';

const Input = ({ className, ...props }: InputProps) => {
    return (
        <InputPrimitive
            className={cn(
                'rounded-[6px] border border-[#CBD5E1] bg-white px-[12px] py-[8px] text-[16px] leading-[24px] text-[#0F172A] caret-[#0F172A] ring-[#94A3B8] ring-offset-1 outline-hidden placeholder:text-[#94A3B8] invalid:border-red-500 invalid:ring-red-500 focus:ring-2 disabled:cursor-not-allowed',
                className as string,
            )}
            {...props}
        />
    );
};

export default Input;
