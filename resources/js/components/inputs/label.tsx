import { cn } from '@/libs/utils';
import { Label as LabelPrimitive, LabelProps } from 'react-aria-components';

const Label = ({ className, ...props }: LabelProps) => {
    return <LabelPrimitive className={cn('text-[14px] leading-[20px] font-medium text-[#0F172A]', className as string)} {...props} />;
};

export default Label;
