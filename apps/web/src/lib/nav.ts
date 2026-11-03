import { getCurrentUser, getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabaseEnv";
import { getUnreadCount } from "@/lib/unread";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavState {
  links: NavLink[];
  signedIn: boolean;
  unread: number;
}

const PUBLIC_LINKS: NavLink[] = [
  { href: "/catalog", label: "Catalog" },
  { href: "/groups", label: "Groups" },
];

/** One navigation for every page, built from who the visitor is. */
export async function getNavState(): Promise<NavState> {
  if (!isSupabaseConfigured()) {
    return { links: PUBLIC_LINKS, signedIn: false, unread: 0 };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      links: [...PUBLIC_LINKS, { href: "/seller", label: "Sell" }],
      signedIn: false,
      unread: 0,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [profile, sellerRow, unread] = await Promise.all([
    getProfile(user.id),
    supabase.from("seller_profiles").select("status").eq("user_id", user.id).maybeSingle(),
    getUnreadCount(),
  ]);

  const links: NavLink[] = [
    ...PUBLIC_LINKS,
    { href: "/my/groups", label: "My groups" },
    { href: "/my/orders", label: "My orders" },
  ];

  const sellerStatus = sellerRow.data?.status as string | undefined;
  if (sellerStatus === "verified") {
    links.push(
      { href: "/seller", label: "Seller" },
      { href: "/seller/quotes", label: "Quotations" },
      { href: "/seller/orders", label: "Sales" },
    );
  } else {
    links.push({ href: "/seller", label: sellerStatus ? "Seller application" : "Sell" });
  }

  if (profile?.role === "admin") {
    links.push({ href: "/admin", label: "Admin" }, { href: "/admin/reports", label: "Reports" });
  }

  return { links, signedIn: true, unread };
}
