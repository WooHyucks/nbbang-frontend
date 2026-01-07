import React, { useState } from 'react';
import Billing from '../../components/billing/Billing';
import BillingMember from '../../components/billing/BillingMember';
import BillingName from '../../components/billing/BillingName';
import BillingPayment from '../../components/billing/BillingPayment';

const BillingPage = () => {
    const [member, setMember] = useState([]);
    const [payment, setPayment] = useState([]);
    const [meetingName, setMeetingName] = useState([]);

    return (
        <div>
            <BillingName
                meetingName={meetingName}
                setMeetingName={setMeetingName}
            />
            <BillingMember
                member={member}
                setMember={setMember}
                setPayment={setPayment}
            />
            <BillingPayment
                member={member}
                payment={payment}
                setPayment={setPayment}
            />
            <Billing
                member={member}
                payment={payment}
                meetingName={meetingName}
                setMeetingName={setMeetingName}
            />
        </div>
    );
};

export default BillingPage;
