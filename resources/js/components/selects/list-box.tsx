import { cn } from '@/libs/utils';
import { ListBox as ListBoxPrimitive, ListBoxProps } from 'react-aria-components';

const ListBox = <T extends object>({ className, ...props }: ListBoxProps<T>) => {
    return (
        <ListBoxPrimitive
            className={cn(
                'w-full rounded-[6px] border border-[#F1F5F9] bg-white p-[5px] text-[16px] leading-[24px] text-[#0F172A] outline-none',
                className as string,
            )}
            {...props}
        />
    );
};

export default ListBox;
