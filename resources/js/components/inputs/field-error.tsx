import { cn } from '@/libs/utils';
import { FieldError as FieldErrorPrimitive, FieldErrorProps } from 'react-aria-components';

const FieldError = ({ className, ...props }: FieldErrorProps) => {
    return <FieldErrorPrimitive className={cn('text-[12px] leading-[16px] text-[#FF6363]', className as string)} {...props} />;
};

export default FieldError;
