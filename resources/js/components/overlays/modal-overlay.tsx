import { cn } from '@/libs/utils';
import { ModalOverlay as ModalOverlayPrimitive, ModalOverlayProps } from 'react-aria-components';

const ModalOverlay = ({ className, ...props }: ModalOverlayProps) => {
    return <ModalOverlayPrimitive className={cn('fixed inset-0 bg-gray-500/20 outline-none', className as string)} {...props} />;
};

export default ModalOverlay;
