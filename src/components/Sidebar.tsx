import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BarChart2,
  Home,
  Wallet,
  Receipt,
  Target,
  Calendar,
  CreditCard,
  BookOpen,
  HandCoins,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { MonthSelector } from "./MonthSelector";
import { useMonthContext } from "@/hooks/use-month-context";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/app/dashboard" },
  { icon: Receipt, label: "Expenses", path: "/app/expenses" },
  { icon: Wallet, label: "Budget", path: "/app/budget" },
  { icon: BarChart2, label: "Analytics", path: "/app/analytics" },
  { icon: Target, label: "Goals", path: "/app/goals" },
  { icon: HandCoins, label: "Loans & Udhaar", path: "/app/loans" },
  { icon: CreditCard, label: "Manage Funds", path: "/app/manage-funds" },
  { icon: Calendar, label: "Monthly Summary", path: "/app/history" },
  { icon: BookOpen, label: "App Guide", path: "/app/guide" },
];

const Sidebar = () => {
  const location = useLocation();
  const { selectedMonth, setSelectedMonth } = useMonthContext();

  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date);
  };

  const handleAddExpense = () => {
    window.dispatchEvent(new CustomEvent('open-expense-form', { 
      detail: { mode: 'manual' }
    }));
  };

  return (
    <SidebarComponent>
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-6">
          <img
            src="/lovable-uploads/12aae181-1a03-4067-a879-2f29d4213837.png"
            alt="Hisab Dost logo"
            className="h-7 w-7 bg-white rounded shadow-sm"
            style={{ filter: "drop-shadow(0 2px 3px rgba(128,102,255,0.10))" }}
          />
          <span className="font-bold text-lg bg-gradient-to-r from-[#6E59A5] to-[#9b87f5] bg-clip-text text-transparent">
            Hisab Dost
          </span>
        </div>

        {/* Prominent Add Expense Button */}
        <div className="px-3 mb-4">
          <button
            onClick={handleAddExpense}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl leading-none">+</span>
            <span>Add Expense</span>
          </button>
        </div>
        
        <div className="px-3 mb-4">
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={handleMonthChange}
          />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path} className="menu-link flex items-center gap-3 py-2.5 px-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarComponent>
  );
};

export default Sidebar;
