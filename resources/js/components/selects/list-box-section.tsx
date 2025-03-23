import { ListBoxSection as ListBoxSectionPrimitive, ListBoxSectionProps } from 'react-aria-components';

const ListBoxSection = <T extends object>({ ...props }: ListBoxSectionProps<T>) => {
    return <ListBoxSectionPrimitive {...props} />;
};

export default ListBoxSection;
