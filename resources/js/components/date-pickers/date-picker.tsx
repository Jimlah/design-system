import { ReactNode, useRef } from 'react';
import { DatePicker as DatePickerPrimitive, DatePickerProps, DateValue, PopoverContext } from 'react-aria-components';

const DatePicker = <T extends DateValue>({ className, children, ...props }: DatePickerProps<T>) => {
    const ref = useRef(null);

    return (
        <DatePickerPrimitive ref={ref} className={className} {...props}>
            <PopoverContext.Provider value={{ triggerRef: ref }}>{children as ReactNode}</PopoverContext.Provider>
        </DatePickerPrimitive>
    );
};

export default DatePicker;
