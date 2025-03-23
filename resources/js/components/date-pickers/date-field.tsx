import { DateField as DateFieldPrimitive, DateFieldProps, DateValue } from 'react-aria-components';

const DateField = <T extends DateValue>({ className, ...props }: DateFieldProps<T>) => {
    return <DateFieldPrimitive className={className} {...props} />;
};

export default DateField;
