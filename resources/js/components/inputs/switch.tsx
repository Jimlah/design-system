import { cn } from '@/libs/utils';
import { ReactNode } from 'react';
import { Switch as SwitchPrimitive, SwitchProps } from 'react-aria-components';

const Switch = ({ className, children, ...props }: SwitchProps) => {
    return (
        <SwitchPrimitive className={cn('grid grid-cols-[auto_1fr] items-start gap-x-2', className as string)} {...props}>
            <div className="in-selected:before:translate-x-full relative isolate aspect-video h-[24px] rounded-full border-2 border-[#E2E8F0] bg-[#E2E8F0] ring-offset-2 before:absolute before:aspect-square before:h-full before:rounded-full before:bg-white in-focus:ring-2 in-focus:ring-[#94A3B8]" />

            <div className="font-inter text-[14px] leading-[24px]">{children as ReactNode}</div>
        </SwitchPrimitive>
    );
};

export default Switch;
