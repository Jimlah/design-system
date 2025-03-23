import { cn } from '@/libs/utils';
import { ModalOverlayProps, Modal as ModalPrimitive } from 'react-aria-components';

const Modal = ({ className, ...props }: ModalOverlayProps) => {
    return (
        <ModalPrimitive
            className={cn(
                'absolute top-1/2 right-1/2 max-h-[80%] w-fit translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-[#CBD5E1] bg-white p-[24px] align-middle outline-none',
                className as string,
            )}
            {...props}
        />
    );
};

export default Modal;
