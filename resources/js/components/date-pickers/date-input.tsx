import { cn } from '@/libs/utils';
import { DateInput as DateInputPrimitive, DateInputProps, DateSegment } from 'react-aria-components';

const DateInput = ({ className, ...props }: Omit<DateInputProps, 'children'>) => {
    return (
        <DateInputPrimitive
            data-input
            className={cn(
                'rounded-[6px] border border-[#CBD5E1] bg-white px-[12px] py-[8px] text-[16px] leading-[24px] text-[#0F172A] caret-[#0F172A] ring-[#94A3B8] ring-offset-1 outline-hidden placeholder:text-[#94A3B8] invalid:border-red-500 invalid:ring-red-500 disabled:cursor-not-allowed has-focus:ring-2',
                className as string,
            )}
            {...props}
        >
            {(segment) => <DateSegment className="outline-none focus:underline" segment={segment} />}
        </DateInputPrimitive>
    );
};

export default DateInput;
