import { Suspense } from 'react';
import Loading from './ui/Loading';

// eslint-disable-next-line react/display-name
const Loadable = (Component) => (props) => (
  <Suspense fallback={<Loading />}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;
