import { LoginUI } from '@ui-pages';
import { type SyntheticEvent, useState } from 'react';

import { selectUserState } from '@services/selectors';
import { useDispatch, useSelector } from '@services/store';
import { login } from '@services/userSlice';

export const Login = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const errorText = useSelector(selectUserState).loginError ?? '';

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    void dispatch(login({ email, password }));
  };

  return (
    <LoginUI
      errorText={errorText}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
