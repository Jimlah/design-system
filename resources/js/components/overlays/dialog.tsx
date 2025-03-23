import { cn } from '@/libs/utils';
import { Dialog as DialogPrimitive, DialogProps } from 'react-aria-components';

const Dialog = ({ className, ...props }: DialogProps) => {
    return <DialogPrimitive className={cn('h-fit w-fit outline-none', className as string)} {...props} />;
};

export default Dialog;
