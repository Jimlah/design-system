import { cn } from '@/libs/utils';
import { Group as GroupPrimitive, GroupProps } from 'react-aria-components';

const Group = ({ className, ...props }: GroupProps) => {
    return (
        <GroupPrimitive
            className={cn(
                'grid h-fit w-fit grid-cols-[auto_1fr_auto] items-center gap-x-2 overflow-hidden rounded-[6px] border border-[#CBD5E1] p-0 ring-[#94A3B8] ring-offset-1 has-invalid:border-red-500 has-invalid:ring-red-500 has-focus:ring-2 [&>input]:border-none [&>input]:bg-transparent [&>input]:focus:ring-transparent',
                '[&>[data-input]]:border-none [&>[data-input]]:bg-transparent [&>[data-input]]:has-focus:ring-transparent',
                className as string,
            )}
            {...props}
        />
    );
};

export default Group;
