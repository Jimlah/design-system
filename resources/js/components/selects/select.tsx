import { cn } from '@/libs/utils';
import { Select as SelectPrimitive, SelectProps } from 'react-aria-components';

const Select = ({ className, ...props }: SelectProps) => {
    return (
        <SelectPrimitive
            className={cn(
                'outline-none',
                '[&>button]:rounded-[6px] [&>button]:border [&>button]:border-[#CBD5E1] [&>button]:px-[12px] [&>button]:py-[8px]',
                '[&>button]:ring-[#94A3B8] [&>button]:ring-offset-2 focus:[&>button]:ring-2',
                '[&>button]:grid [&>button]:grid-cols-[1fr_auto] [&>button]:items-center [&>button]:gap-2',
                className as string,
            )}
            {...props}
        />
    );
};

export default Select;
