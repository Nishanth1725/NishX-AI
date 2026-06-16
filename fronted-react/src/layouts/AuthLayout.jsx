import { Outlet } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground variant="particles" />
      <Outlet />
    </div>
  );
}
