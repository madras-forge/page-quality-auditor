import Dashboard from './dashboard';
import { createDemoReport } from '../lib/demo';
export default function Page() {
  return <Dashboard initialReport={createDemoReport()} />;
}
