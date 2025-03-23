import { cn } from '@/libs/utils';
import { TextField as TextFieldPrimitive, TextFieldProps } from 'react-aria-components';

const TextField = ({ className, ...props }: TextFieldProps) => {
    return <TextFieldPrimitive className={cn('disabled:opacity-50', className as string)} {...props} />;
};

export default TextField;
