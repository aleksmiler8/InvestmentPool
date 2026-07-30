import { AdminPanelV3 } from "./admin-v3";

type Props = {
  loadUser: () => Promise<void>;
};

export default function AdminPanel({ loadUser }: Props) {
  return <AdminPanelV3 loadUser={loadUser} />;
}