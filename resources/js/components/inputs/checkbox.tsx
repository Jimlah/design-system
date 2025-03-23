import { cn } from '@/libs/utils';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';
import { Checkbox as CheckboxPrimitive, CheckboxProps } from 'react-aria-components';

const Checkbox = ({ className, children, ...props }: CheckboxProps) => {
    return (
        <CheckboxPrimitive className={cn('grid grid-cols-[auto_1fr] items-start gap-x-2', className as string)} {...props}>
            <div className="in-selected:bg-black in-selected:text-white size-[14px] overflow-hidden rounded border border-[#E5E7EB] ring-[#94A3B8] ring-offset-2 in-focus:ring-2">
                <Check className="size-[12px]" />
            </div>
            <div className="font-inter text-[14px] leading-[14px]">{children as ReactNode}</div>
        </CheckboxPrimitive>
    );
};

export default Checkbox;
