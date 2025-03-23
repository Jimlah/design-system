import { cn } from '@/libs/utils';
import { SelectValue as SelectValuePrimitive, SelectValueProps } from 'react-aria-components';

const SelectValue = <T extends object>({ className, ...props }: SelectValueProps<T>) => {
    return <SelectValuePrimitive className={cn('text-left text-[16px] leading-[24px] font-medium text-[#0F172A]', className as string)} {...props} />;
};

export default SelectValue;
