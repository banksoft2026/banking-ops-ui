import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../shared/ToastContainer';

export function AppShell() {
  return (
    <div className="flex h-screen bg-[#F0F2F5]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[200px]">
        <Topbar />
        <main className="flex-1 overflow-auto mt-[54px] p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
