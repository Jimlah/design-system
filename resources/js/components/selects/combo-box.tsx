import { cn } from '@/libs/utils';
import { ComboBox as ComboBoxPrimitive, ComboBoxProps } from 'react-aria-components';

const ComboBox = <T extends object>({ className, ...props }: ComboBoxProps<T>) => {
    return <ComboBoxPrimitive className={cn('disabled:opacity-50', className as string)} {...props} />;
};

export default ComboBox;
