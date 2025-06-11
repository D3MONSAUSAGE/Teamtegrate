
import React from 'react';
import TimezoneSelector from '../TimezoneSelector';
import { useUserTimezone } from '@/hooks/useUserTimezone';

const ProfileTimezoneField: React.FC = () => {
  const { userTimezone, isUpdating, updateUserTimezone } = useUserTimezone();

  return (
    <TimezoneSelector
      value={userTimezone}
      onChange={updateUserTimezone}
      disabled={isUpdating}
    />
  );
};

export default ProfileTimezoneField;
