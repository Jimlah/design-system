import { DialogTrigger as DialogTriggerPrimitive, DialogTriggerProps } from 'react-aria-components';

const DialogTrigger = ({ ...props }: DialogTriggerProps) => {
    return <DialogTriggerPrimitive {...props} />;
};

export default DialogTrigger;
