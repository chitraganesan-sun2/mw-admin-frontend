"use client";

import Sidebar from "@/components/common/Sidebar";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import CommonHeader from "@/components/common/Header";
import { usePathname, useRouter } from "next/navigation";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";
import { Drawer } from "antd";
import { FiMenu } from "react-icons/fi";

const NAV_DRAWER_ID = "admin-nav-drawer";

const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: staff, isLoading: staffLoading } = useStaff();
  const [navOpen, setNavOpen] = useState(false);

  // Page guard from the server's view of this account (the edge middleware only has the token's
  // role claim). If the role changed or the URL was typed by hand, go to the access-denied page
  // instead of rendering a page whose APIs will 403. Not a security boundary - the APIs enforce it.
  // Nothing is rendered until the server has said what this account may open, so a page the account
  // has no access to never fires its API calls just to be refused.
  const allowed = !!staff && canAccessPath(pathname, staff.permissions);
  useEffect(() => {
    if (staff && !allowed) router.replace("/access-denied");
  }, [staff, allowed, router]);

  // The phone menu closes whenever the page changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Phones and tablets (< 1024px): the sidebar becomes a slide-out menu opened from the top bar.
  // Wider screens keep the permanent sidebar column exactly as before.
  return (
    <div className="h-[100dvh] w-screen overflow-hidden lg:grid lg:grid-cols-12 lg:grid-rows-1">
      <div className="hidden lg:block lg:col-span-2">
        <Sidebar />
      </div>
      <Drawer
        id={NAV_DRAWER_ID}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        placement="left"
        width={280}
        closable
        title="Menu"
        rootClassName="lg:hidden"
        styles={{ body: { padding: 0 } }}
      >
        <Sidebar variant="drawer" onNavigate={() => setNavOpen(false)} />
      </Drawer>
      <div className="flex h-full min-w-0 flex-col bg-white lg:col-span-10">
        <div className="flex shrink-0 items-center gap-1 px-1 lg:h-[10vh] lg:px-0">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls={NAV_DRAWER_ID}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dark hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
          >
            <FiMenu size={22} aria-hidden />
          </button>
          <div className="min-w-0 flex-1 lg:h-full">
            <CommonHeader />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-tl-[24px] bg-background lg:rounded-tl-[50px]">
          {staffLoading ? null : allowed ? children : null}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
