import { getNavData } from "@/lib/catalog";
import { NavBar } from "./nav-bar";

export async function Header() {
  const { categories, brands } = await getNavData();
  return <NavBar categories={categories} brands={brands} />;
}
