import { RadioGroup as RadioGroupPrimitive, RadioGroupProps } from 'react-aria-components';

const RadioGroup = ({ className, ...props }: RadioGroupProps) => {
    return <RadioGroupPrimitive className={className as string} {...props} />;
};

export default RadioGroup;
