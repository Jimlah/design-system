import { cn } from '@/libs/utils';
import { NumberField as NumberFieldPrimitive, NumberFieldProps } from 'react-aria-components';

const NumberField = ({ className, ...props }: NumberFieldProps) => {
    return <NumberFieldPrimitive className={cn('disabled:opacity-50', className as string)} {...props} />;
};

export default NumberField;
