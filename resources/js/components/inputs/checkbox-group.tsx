import { CheckboxGroup as CheckboxGroupPrimitive, CheckboxGroupProps } from 'react-aria-components';

const CheckboxGroup = ({ className, ...props }: CheckboxGroupProps) => {
    return <CheckboxGroupPrimitive className={className as string} {...props} />;
};

export default CheckboxGroup;
