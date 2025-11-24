import React from 'react';
import ContactsTab from '@/components/contacts/ContactsTab';

const EmployeesTab = ({ initialContacts, loading, onUpdateNeeded }) => {
    return (
        <ContactsTab
            initialContacts={initialContacts}
            loading={loading}
            onUpdateNeeded={onUpdateNeeded}
            contactType="Colaborador"
            title="Colaboradores"
        />
    );
};

export default EmployeesTab;