import { cn } from '@/libs/utils';
import { ReactNode } from 'react';
import { Radio as RadioPrimitive, RadioProps } from 'react-aria-components';

const Radio = ({ className, children, ...props }: RadioProps) => {
    return (
        <RadioPrimitive className={cn('grid grid-cols-[auto_1fr] items-start gap-x-2', className as string)} {...props}>
            <div className="flex size-[16px] items-center justify-center overflow-hidden rounded-full border border-[#E5E7EB] ring-[#94A3B8] ring-offset-2 in-focus:ring-2">
                <div className="in-selected:bg-black size-[8px] rounded-full" />
            </div>
            <div className="font-inter text-[14px] leading-[14px]">{children as ReactNode}</div>
        </RadioPrimitive>
    );
};

export default Radio;
