import GoalsSupabase from "@/components/GoalsSupabase";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function GoalsPage() {
  return (
    <ProtectedRoute>
      <GoalsSupabase />
    </ProtectedRoute>
  );
}
