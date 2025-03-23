import { cn } from '@/libs/utils';
import { Popover as PopoverPrimitive, PopoverProps } from 'react-aria-components';

const Popover = ({ className, ...props }: PopoverProps) => {
    return <PopoverPrimitive className={cn('min-w-(--trigger-width) rounded-[6px] shadow-md outline-none', className as string)} {...props} />;
};

export default Popover;
