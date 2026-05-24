import { Redirect } from 'expo-router';

import { ROUTES } from '@/navigation/routes';

export default function IndexRoute() {
  return <Redirect href={ROUTES.login} />;
}
