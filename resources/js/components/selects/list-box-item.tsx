import { cn } from '@/libs/utils';
import { ListBoxItem as ListBoxItemPrimitive, ListBoxItemProps } from 'react-aria-components';

const ListBoxItem = ({ className, ...props }: ListBoxItemProps) => {
    return (
        <ListBoxItemPrimitive
            className={cn('rounded-[6px] px-4 py-2 outline-none hover:bg-[#F1F5F9] focus:bg-[#F1F5F9] disabled:opacity-50', className as string)}
            {...props}
        />
    );
};

export default ListBoxItem;
